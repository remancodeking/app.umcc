import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import User from '@/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Get logged-in user's attendance
    const userId = session.user.id;

    // Get today's date formatted as YYYY-MM-DD for simpler querying
    const today = new Date().toISOString().split('T')[0];

    // Find if checked in today
    const todayRecord = await Attendance.findOne({ user: userId, date: today });

    // Get history (limited to last 30 entries)
    const history = await Attendance.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('user', 'name');

    return NextResponse.json({
      todayRecord,
      history
    });

  } catch (error) {
    console.error("Attendance GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { location } = await request.json();
    const userId = session.user.id;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Check if already checked in
    const existing = await Attendance.findOne({ user: userId, date: todayStr });
    if (existing) {
       return NextResponse.json({ error: "Already clocked in for today" }, { status: 400 });
    }

    // Determine status (Late if after 8:15 AM)
    // 8:00 AM is the target.
    // Create a date object for today at 08:15 AM
    const lateThreshold = new Date(now);
    lateThreshold.setHours(8, 15, 0, 0); 
    
    let status = "On Duty";
    if (now > lateThreshold) {
       status = "Late";
    }

    const newRecord = await Attendance.create({
       user: userId,
       date: todayStr,
       clockIn: now,
       status: status,
       location: location || "Main Terminal",
       shift: "A", // Defaulting to A for now
    });

    return NextResponse.json(newRecord);

  } catch (error) {
     console.error("Attendance POST Error:", error);
     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
    try {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      await dbConnect();
      const userId = session.user.id;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
  
      // Find today's record
      const record = await Attendance.findOne({ user: userId, date: todayStr });
      if (!record) {
         return NextResponse.json({ error: "No clock-in record found for today" }, { status: 404 });
      }
      
      if (record.clockOut) {
         return NextResponse.json({ error: "Already clocked out" }, { status: 400 });
      }
  
      // Calculate duration
      const durationMs = now - new Date(record.clockIn);
      const durationMinutes = Math.floor(durationMs / 1000 / 60);
      
      // Update status if needed (e.g. if > 8 hours, Present; else Half Day? But user logic 8-8 is 12 hours)
      // For now keep status as is, just mark Present if previously On Duty/Late
      // Or maybe refine 'On Duty' to 'Present' once completed.
      let finalStatus = record.status;
      if (finalStatus === "On Duty") finalStatus = "Present";

      record.clockOut = now;
      record.durationMinutes = durationMinutes;
      record.status = finalStatus;

      await record.save();
  
      return NextResponse.json(record);
  
    } catch (error) {
       console.error("Attendance PUT Error:", error);
       return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
