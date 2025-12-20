import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SalaryReport from "@/models/SalaryReport";
import Recovery from "@/models/Recovery"; // Ensure registration
import mongoose from "mongoose";

// Ensure DB connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export async function GET(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reports = await SalaryReport.find().sort({ date: -1 });
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Cashier')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // Assign Team based on Creator
    const team = (session.user.shift && session.user.shift !== 'All') ? session.user.shift : null;

    // Enhance records with shift if missing? Ideally, users from 'today' API already have shift.
    // We trust the frontend sent the correct structure, but we add the top-level team.
    
    const reportPayload = {
        ...body,
        team: team
    };

    const report = await SalaryReport.create(reportPayload);

    // --- Process Recoveries ---
    // Iterate records to find deductions with recoveryId and update the Recovery model
    try {
        const Recovery = mongoose.models.Recovery || mongoose.model('Recovery');
        
        for (const record of report.records) {
            if (record.deductions && record.deductions.length > 0) {
                for (const ded of record.deductions) {
                    if (ded.recoveryId) {
                        const rec = await Recovery.findById(ded.recoveryId);
                        if (rec) {
                            rec.paidAmount = (rec.paidAmount || 0) + (ded.amount || 0);
                            
                            // Check Completion
                            if (rec.paidAmount >= rec.totalAmount) {
                                rec.status = 'Completed';
                            }
                            
                            // Add History
                            rec.history.push({
                                amount: ded.amount,
                                date: new Date(),
                                salaryReportId: report._id
                            });
                            
                            await rec.save();
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error("Error updating recoveries:", err);
        // We do typically not fail the whole request if this side-effect fails, but we should log it.
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
