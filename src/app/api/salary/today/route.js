import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";
import User from "@/models/User";
import Attendance from "@/models/Attendance";
import SalesReport from "@/models/SalesReport";
// Ensure Room is registered/imported if you have a separate model file
import Room from "@/models/Room";
import Recovery from "@/models/Recovery"; // Import Recovery 

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
            if (room.users && room.users.length > 0) {
                room.users.forEach(u => {
                    const uid = u._id ? u._id.toString() : u.toString();
                    userRoomMap[uid] = room.roomNumber;
                });
            }
        });

        // 4.5 Fetch Active Recoveries
        // We import Recovery model dynamically if needed, or at top. 
        // Assuming imported at top or using mongoose.model
        let Recovery;
        try {
            Recovery = mongoose.model('Recovery');
        } catch {
            const RecoverySchema = new mongoose.Schema({ /* partial schema for validation if fetch fails? No, trust it exists */ });
            // We really should import it properly at top
        }

        // Better: Import it properly at the top of file

        // 5. Map Data
        const recoveryMap = {};
        if (mongoose.models.Recovery) {
            const activeRecoveries = await mongoose.models.Recovery.find({
                status: 'Active',
                user: { $in: allUsers.map(u => u._id) }
            });
            activeRecoveries.forEach(r => {
                // If multiple, maybe sum? For now assume one active per user
                recoveryMap[r.user.toString()] = {
                    _id: r._id,
                    reason: r.reason,
                    remainingAmount: r.totalAmount - (r.paidAmount || 0),
                    deductionRate: r.deductionRate || 100
                };
            });
        }

        const combinedData = allUsers.map(u => {
            const userId = u._id.toString();
            const status = attendanceMap[userId] || 'Absent';

            return {
                _id: userId,
                name: u.name,
                empCode: u.empCode,
                designation: u.designation,
                status: status,
                shift: u.shift,
                roomNumber: userRoomMap[userId] || 'Unassigned',
                recovery: recoveryMap[userId] || null // Attach recovery info
            };
        });

        // Sort by Room Number then Name
        combinedData.sort((a, b) => {
            if (a.roomNumber === 'Unassigned') return 1;
            if (b.roomNumber === 'Unassigned') return -1;

            const rA = parseInt(a.roomNumber);
            const rB = parseInt(b.roomNumber);
            if (!isNaN(rA) && !isNaN(rB)) {
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
