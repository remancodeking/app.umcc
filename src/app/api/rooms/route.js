import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import User from '@/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    await dbConnect();

    let query = {};
    if (session?.user?.shift && session.user.shift !== 'All') {
        const userShift = session.user.shift;
        // Show rooms belonging to this shift OR global rooms (shift usually null for legacy / global)
        // Show rooms belonging to this shift OR Legacy rooms (shift is null/missing)
        query = { 
            $or: [
                { shift: userShift },
                { shift: null },
                { shift: { $exists: false } }
            ]
        };
    }
    
    // Populate users AND their shift to display correctly if needed
    const rooms = await Room.find(query)
        .populate('users', 'name empCode avatar designation shift') 
        .sort({ roomNumber: 1 });
        
    return NextResponse.json(rooms);
  } catch (error) {
    console.error("Fetch Rooms Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Check role
    const { role } = session.user;
    if (role !== 'Admin' && role !== 'Cashier') {
        return NextResponse.json({ error: "Forbidden: Authorized users only" }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();
    
    // Explicitly use the session shift to scope the room
    const cleanShift = (session.user.shift && session.user.shift !== 'All') ? session.user.shift : null;

    // Validate uniqueness based on Shift + RoomNumber
    const query = { roomNumber: body.roomNumber };
    if (cleanShift) {
        query.shift = cleanShift;
    } else {
        // If global/admin creating without specific shift context, check if strictly global exists or if any exists?
        // User request: "if the room number is okay in one ship, then in the other ship there should be a number one"
        // This implies strict scoping.
        // For 'All' shift users, maybe we should allow them to specify shift in body?
        // For now, let's stick to strict session scoping.
        // If cleanShift is null (Global Admin), check for Global Room (shift: null)
        query.shift = null; 
    }

    const existing = await Room.findOne(query);
    
    if(existing) {
        return NextResponse.json({ 
            error: cleanShift 
                ? `Room ${body.roomNumber} already exists in Shift ${cleanShift}`
                : `Global Room ${body.roomNumber} already exists`
        }, { status: 400 });
    }

    const newRoom = await Room.create({
        ...body,
        shift: cleanShift 
    });
    return NextResponse.json(newRoom, { status: 201 });

  } catch (error) {
    console.error("Create Room Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
