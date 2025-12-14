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

export async function GET(req, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Await params to fix Next.js 15 issue
    const { id: userId } = await params;

    // 1. Fetch Salary History (Finalized Reports)
    // We look for reports where 'records.user' matches the userId
    const history = await SalaryReport.find({
        status: 'Finalized',
        "records.user": userId
    }).sort({ date: -1 }).limit(50); // Limit to last 50 entries for performance

    // Format history
    const formattedHistory = history.map(report => {
        const record = report.records.find(r => r.user.toString() === userId);
        
        // Check if Paid
        // A record is considered paid if the room it belongs to has been disbursed (isPaid: true)
        const roomDisbursement = report.roomDisbursements?.find(rd => rd.roomNumber === record?.roomNumber);
        const isPaid = roomDisbursement?.isPaid || false;

        return {
            _id: report._id,
            date: report.date,
            status: record?.status || 'Absent',
            amount: record?.finalAmount || 0,
            roomNumber: record?.roomNumber || 'N/A',
            deductions: record?.deductions || [],
            isPaid: isPaid
        };
    });

    // Stats
    const totalEarned = formattedHistory.reduce((sum, h) => sum + h.amount, 0);
    
    // Unpaid Balance: Sum of amounts where isPaid is false
    const unpaidBalance = formattedHistory
        .filter(h => h.amount > 0 && !h.isPaid)
        .reduce((sum, h) => sum + h.amount, 0);

    const presentDays = formattedHistory.filter(h => ['Present', 'On Duty'].includes(h.status)).length;

    return NextResponse.json({
        history: formattedHistory,
        stats: {
            totalEarned,
            unpaidBalance,
            presentDays,
            totalDays: formattedHistory.length
        }
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
