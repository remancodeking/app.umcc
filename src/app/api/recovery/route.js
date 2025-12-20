import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Recovery from "@/models/Recovery";
import User from "@/models/User"; // Ensure registered
import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
};

export async function GET(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query = {};
    if (status) query.status = status;

    const recoveries = await Recovery.find(query)
      .populate('user', 'name empCode')
      .sort({ createdAt: -1 });

    return NextResponse.json(recoveries);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !['Admin', 'Cashier', 'Ground Operation Manager'].includes(session.user.role)) {
       // Relaxed checking, but typically Admin
       // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, totalAmount, reason } = await req.json();

    if (!userId || !totalAmount || !reason) {
       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const recovery = await Recovery.create({
        user: userId,
        totalAmount,
        reason,
        paidAmount: 0,
        status: 'Active'
    });

    return NextResponse.json(recovery, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
