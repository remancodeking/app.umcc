import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import User from "@/models/User";
import Attendance from "@/models/Attendance";
import SalesReport from "@/models/SalesReport";
// Ensure Room is registered/imported if you have a separate model file
import Room from "@/models/Room"; 

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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 1. Fetch All Rooms (Primary grouping source)
    const rooms = await Room.find().populate({
      path: 'users',
      select: 'name empCode designation role status'
    }).sort({ roomNumber: 1 });

    // 2. Fetch All active Employees (The Master List)
    // Included 'shift' in selection
    const allUsers = await User.find({ 
        role: { $in: ['Employee', 'Admin', 'Cashier'] }, 
        status: 'In Work' 
    }).select('name empCode designation role status shift');

    // 3. Fetch Attendance for Date
    const attendance = await Attendance.find({ date });
    const attendanceMap = {};
    attendance.forEach(a => { attendanceMap[a.user.toString()] = a.status; });

    // 4. Fetch Sales Report (Revenue)
    const sales = await SalesReport.findOne({ date });
    const recommendedRevenue = sales?.distribution?.laborAmount || 0;

    // --- MAPPING LOGIC ---
    const userRoomMap = {};
    rooms.forEach(room => {
        if(room.users && room.users.length > 0) {
            room.users.forEach(u => {
                const uid = u._id ? u._id.toString() : u.toString();
                userRoomMap[uid] = room.roomNumber;
            });
        }
    });

    const combinedData = allUsers.map(u => {
        const userId = u._id.toString();
        const status = attendanceMap[userId] || 'Absent'; 
        
        return {
            _id: userId,
            name: u.name,
            empCode: u.empCode,
            designation: u.designation,
            status: status,
            shift: u.shift, // Pass shift to frontend
            roomNumber: userRoomMap[userId] || 'Unassigned'
        };
    });

    // Sort by Room Number then Name
    combinedData.sort((a, b) => {
        if(a.roomNumber === 'Unassigned') return 1; 
        if(b.roomNumber === 'Unassigned') return -1;
        
        const rA = parseInt(a.roomNumber);
        const rB = parseInt(b.roomNumber);
        if(!isNaN(rA) && !isNaN(rB)) {
            if (rA !== rB) return rA - rB;
        } else {
            if (a.roomNumber !== b.roomNumber) return a.roomNumber.localeCompare(b.roomNumber);
        }
        return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
        date,
        employees: combinedData,
        recommendedRevenue
    });

  } catch (error) {
    console.error("Salary Today API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
