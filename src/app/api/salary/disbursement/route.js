import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SalaryReport from "@/models/SalaryReport";
import User from "@/models/User";
import mongoose from "mongoose";

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI);
};

export async function GET(req) {
    try {
        await connectDB();
        
        // Extract 'date' from query params
        const { searchParams } = new URL(req.url);
        const dateQuery = searchParams.get('date');

        let report;
        if (dateQuery) {
            report = await SalaryReport.findOne({ date: dateQuery, status: 'Finalized' });
        } else {
            // Default to latest
            report = await SalaryReport.findOne({ status: 'Finalized' }).sort({ date: -1 });
        }

        if (!report) return NextResponse.json(null);

        // Group records to prepare "Disbursement View"
        const rooms = {};
        report.records.forEach(r => {
            const rNum = r.roomNumber || 'Unassigned';
            if(!rooms[rNum]) rooms[rNum] = { 
                roomNumber: rNum, 
                totalAmount: 0, 
                employees: [], 
                isPaid: false 
            };
            
            // Check if user is present/payable
            if(['Present','On Duty'].includes(r.status)) {
                // If it's a numeric value
                const amount = r.finalAmount || 0;
                rooms[rNum].totalAmount += amount;
            }
            rooms[rNum].employees.push(r);
        });

        // Merge with existing disbursement status
        if(report.roomDisbursements && report.roomDisbursements.length > 0) {
            report.roomDisbursements.forEach(d => {
                if(rooms[d.roomNumber]) {
                    rooms[d.roomNumber].isPaid = d.isPaid;
                    rooms[d.roomNumber].paidAt = d.paidAt;
                    rooms[d.roomNumber].receiverName = d.receiverName;
                    rooms[d.roomNumber].receiptId = d.receiptId;
                }
            });
        }

        return NextResponse.json({
            _id: report._id,
            date: report.date,
            totalPresent: report.totalPresent,
            rooms: Object.values(rooms).sort((a,b) => {
                 const nA = parseInt(a.roomNumber);
                 const nB = parseInt(b.roomNumber);
                 if(!isNaN(nA) && !isNaN(nB)) return nA - nB;
                 return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' });
            })
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session || !['Admin','Cashier'].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { reportId, roomNumber, receiverId, totalAmount } = await req.json();

        // Generate Receipt ID
        const receiptId = `PAY-${Date.now().toString().slice(-6)}`;

        // Get Receiver Name
        const receiver = await User.findById(receiverId).select('name');
        if(!receiver) return NextResponse.json({ error: "Receiver not found" }, { status: 404 });

        // Update Report
        const updated = await SalaryReport.findByIdAndUpdate(
            reportId,
            {
                $push: {
                    roomDisbursements: {
                        roomNumber,
                        isPaid: true,
                        receiver: receiverId,
                        receiverName: receiver.name,
                        receiptId,
                        paidAt: new Date(),
                        totalAmount
                    }
                }
            },
            { new: true }
        );

        return NextResponse.json({ success: true, receiptId, date: new Date(), receiverName: receiver.name });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
