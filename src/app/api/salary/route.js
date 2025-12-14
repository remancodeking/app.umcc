import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SalaryReport from "@/models/SalaryReport";
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
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
