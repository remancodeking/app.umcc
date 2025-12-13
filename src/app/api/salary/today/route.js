import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import User from "@/models/User";
import Attendance from "@/models/Attendance";
import SalesReport from "@/models/SalesReport";
// Ensure Room is registered/imported if you have a separate model file, 
// though sometimes just relying on mongoose.model works if already loaded. 
// Safer to import.
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
    // Populate users to know who belongs where
    const rooms = await Room.find().populate({
      path: 'users',
      select: 'name empCode designation role status'
    }).sort({ roomNumber: 1 });

    // 2. Fetch All active Employees (The Master List)
    // We fetch this efficiently to ensure we catch everyone, even those not in a room yet.
    const allUsers = await User.find({ 
        role: { $in: ['Employee', 'Admin', 'Cashier'] }, 
        status: 'In Work' 
    }).select('name empCode designation role status');

    // 3. Fetch Attendance for Date
    const attendance = await Attendance.find({ date });
    const attendanceMap = {};
    attendance.forEach(a => { attendanceMap[a.user.toString()] = a.status; });

    // 4. Fetch Sales Report (Revenue)
    const sales = await SalesReport.findOne({ date });
    const recommendedRevenue = sales?.distribution?.laborAmount || 0;

    // --- MAPPING LOGIC ---
    // Create a map of UserID -> RoomNumber from the fetched Rooms
    const userRoomMap = {};
    rooms.forEach(room => {
        if(room.users && room.users.length > 0) {
            room.users.forEach(u => {
                // Determine user ID (it might be an object if populated, or string if not)
                const uid = u._id ? u._id.toString() : u.toString();
                userRoomMap[uid] = room.roomNumber;
            });
        }
    });

    // Combined Data: List of ALL employees, now with 'roomNumber' attached
    const combinedData = allUsers.map(u => {
        const userId = u._id.toString();
        // Determine status (use attendance if exists, otherwise assume Absent/Pending)
        // If "Present" or "On Duty", they are eligible for pay typically.
        const status = attendanceMap[userId] || 'Absent'; 
        
        return {
            _id: userId,
            name: u.name,
            empCode: u.empCode,
            designation: u.designation,
            status: status,
            roomNumber: userRoomMap[userId] || 'Unassigned' // <--- The Key Fix
        };
    });

    // Sort by Room Number (Numeric if possible) then Name
    combinedData.sort((a, b) => {
        if(a.roomNumber === 'Unassigned') return 1; 
        if(b.roomNumber === 'Unassigned') return -1;
        
        // Try numeric sort for rooms "1", "2", "10"
        const rA = parseInt(a.roomNumber);
        const rB = parseInt(b.roomNumber);
        if(!isNaN(rA) && !isNaN(rB)) {
            if (rA !== rB) return rA - rB;
        } else {
            // String sort fallback
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
