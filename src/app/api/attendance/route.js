import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Attendance from "@/models/Attendance";
import User from "@/models/User";
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
    const date = searchParams.get("date");
    const shift = searchParams.get("shift");

    if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

    // Fetch all employees
    const users = await User.find({ role: "Employee" }).select("name role empCode mobile");

    // Fetch attendance records for this date (and shift if provided)
    // If shift is provided, strictly filter? Or just show all for the day?
    // User said "cannot create double shapes", suggesting singular shift per day arguably?
    // But usually attendance is per day. However, shift 'A', 'B' could exist.
    // Let's filter by date.
    
    const query = { date };
    if (shift && shift !== 'All') {
        query.shift = shift;
    }

    const attendanceRecords = await Attendance.find(query);

    // Merge record with user
    const data = users.map(user => {
        const record = attendanceRecords.find(r => r.user.toString() === user._id.toString());
        return {
            user: user,
            attendance: record || null
        };
    });

    // Counts
    const stats = {
        total: users.length,
        present: attendanceRecords.filter(r => ['Present', 'On Duty'].includes(r.status)).length,
        absent: attendanceRecords.filter(r => r.status === 'Absent').length,
        leave: attendanceRecords.filter(r => r.status === 'Leave').length,
    };

    return NextResponse.json({ data, stats });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { userId, date, status, shift, notes } = body;

        // Check if record exists for this User + Date
        // User said: "you cannot create double shapes", so update if exists
        
        let record = await Attendance.findOne({ user: userId, date });

        if (record) {
            // Update
            record.status = status;
            record.shift = shift;
            record.notes = notes;
            await record.save();
        } else {
            // Create
            record = await Attendance.create({
                user: userId,
                date,
                status,
                shift,
                notes,
                clockIn: status === 'Present' ? new Date() : null
            });
        }

        return NextResponse.json({ success: true, record });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
