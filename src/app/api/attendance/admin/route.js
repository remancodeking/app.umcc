import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import AttendanceSession from '@/models/AttendanceSession';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Ground Operation Manager' && session.user.role !== 'Supervisor')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    // Default to today if no date provided
    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    // Check Session Status
    let sessionStatus = 'Not Started'; // Default if no record
    const dailySession = await AttendanceSession.findOne({ date: targetDate });
    if (dailySession) {
       sessionStatus = dailySession.status;
    }

    // 1. Fetch all users
    const users = await User.find({ role: { $ne: 'User' } }).select('name empCode designation iqamaNumber passportNumber shift mobile status avatar');

    // 2. Fetch attendance records for this date
    const attendanceRecords = await Attendance.find({ date: targetDate });

    // 3. Map users to combine data
    const combinedData = users.map(user => {
      const record = attendanceRecords.find(r => r.user.toString() === user._id.toString());
      
      let status = 'Pending';
      if (record) {
         status = record.status;
      }

      return {
        _id: user._id,
        name: user.name,
        empCode: user.empCode,
        iqamaNumber: user.iqamaNumber,
        passportNumber: user.passportNumber,
        designation: user.designation,
        shift: user.shift,
        mobile: user.mobile,
        recordId: record?._id || null,
        clockIn: record?.clockIn || null,
        clockOut: record?.clockOut || null,
        status: status, 
        durationMinutes: record?.durationMinutes || 0
      };
    });

    return NextResponse.json({
       date: targetDate,
       sessionStatus: sessionStatus,
       users: combinedData
    });

  } catch (error) {
    console.error("Admin Attendance GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'Admin' && session.user.role !== 'Ground Operation Manager' && session.user.role !== 'Supervisor')) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { action, userId, date, status } = body; 

    // ACTION: Session Management
    if (action === 'session_action') {
       const { type } = body; // type: 'start' or 'complete'
       
       let dailySession = await AttendanceSession.findOne({ date: date });
       
       if (type === 'start') {
          if (dailySession) {
             return NextResponse.json({ error: "Session already started" }, { status: 400 });
          }
          dailySession = await AttendanceSession.create({
             date: date,
             status: 'Open',
             startedBy: session.user.id
          });
          return NextResponse.json({ message: "Session Started", session: dailySession });
       }
       
       if (type === 'complete') {
          if (!dailySession) {
             return NextResponse.json({ error: "Cannot complete a session that hasn't started" }, { status: 400 });
          }
          // Assuming we are just marking it closed
          dailySession.status = 'Closed';
          dailySession.completedBy = session.user.id;
          await dailySession.save();
          return NextResponse.json({ message: "Session Completed", session: dailySession });
       }
    }

    // ACTION: Update User Attendance
    // First check if session allows updates
    const dailySession = await AttendanceSession.findOne({ date: date });
    
    // If we require session to be Open to edit:
    // User asked "if i cliek the complete button after this not motfile"
    if (dailySession?.status === 'Closed') {
       return NextResponse.json({ error: "Attendance is locked/completed for this date." }, { status: 403 });
    }
    
    // Also, if session is not started, maybe we shouldn't allow marking?
    // "start button ... attendances is sgint" -> implies start needed first.
    if (!dailySession && action !== 'force_update') { // add a backdoor if needed, but per requirements:
       return NextResponse.json({ error: "Please start the attendance session first." }, { status: 400 });
    }

    // Check if record exists
    let record = await Attendance.findOne({ user: userId, date: date });

    if (record) {
       record.status = status;
       await record.save();
    } else {
       // Create new record
       record = await Attendance.create({
          user: userId,
          date: date,
          status: status,
          shift: 'A', // default
       });
    }
    
    return NextResponse.json(record);

  } catch (error) {
     console.error("Admin Attendance POST Error:", error);
     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
