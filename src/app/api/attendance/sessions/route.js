import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import AttendanceSession from '@/models/AttendanceSession';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Ground Operation Manager' && session.user.role !== 'Supervisor')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch all sessions, sorted by date descending
    const sessions = await AttendanceSession.find({})
      .sort({ date: -1 })
      .populate('startedBy', 'name')
      .populate('completedBy', 'name');

    return NextResponse.json(sessions);

  } catch (error) {
    console.error("Attendance Sessions GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
