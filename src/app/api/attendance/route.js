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

    // Fetch all users (sorted)
    const users = await User.find({ role: { $ne: 'Admin' } }).sort({ name: 1 }).select("name role empCode mobile designation shift terminal");

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
        const { userId, userIds, date, status, shift, notes } = body;

        // BULK UPDATE
        if (userIds && Array.isArray(userIds)) {
             const operations = userIds.map(uid => ({
                updateOne: {
                    filter: { user: uid, date: date },
                    update: { 
                        $set: { 
                            status: status, 
                            shift: shift || 'A',
                            notes: notes || '',
                            // Only set clockIn if strictly marking Present and it wasn't there? 
                            // Or just simplify. Let's simplify.
                            updatedAt: new Date()
                        }
                    },
                    upsert: true
                }
            }));
            await Attendance.bulkWrite(operations);
            return NextResponse.json({ success: true, count: userIds.length });
        }

        // SINGLE UPDATE
        let record = await Attendance.findOne({ user: userId, date });

        if (record) {
            record.status = status;
            if(shift) record.shift = shift;
            if(notes !== undefined) record.notes = notes;
            await record.save();
        } else {
            record = await Attendance.create({
                user: userId,
                date,
                status,
                shift: shift || 'A',
                notes,
                clockIn: status === 'Present' ? new Date() : null
            });
        }

        return NextResponse.json({ success: true, record });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        const ids = searchParams.get('ids'); 

        if (!date || !ids) return NextResponse.json({ error: "Date and IDs required" }, { status: 400 });

        const userIds = ids.split(',');
        const result = await Attendance.deleteMany({
            date: date,
            user: { $in: userIds }
        });

        return NextResponse.json({ message: "Deleted successfully", count: result.deletedCount });

    } catch (error) {
         return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
