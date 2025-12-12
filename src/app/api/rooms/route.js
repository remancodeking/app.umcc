import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';
import User from '@/models/User';

export async function GET(request) {
  try {
    await dbConnect();
    const rooms = await Room.find().populate('users', 'name empCode avatar designation').sort({ roomNumber: 1 });
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
    
    // Validate uniqueness if needed, though Mongoose handles it
    const existing = await Room.findOne({ roomNumber: body.roomNumber });
    if(existing) return NextResponse.json({ error: "Room number already exists" }, { status: 400 });

    const newRoom = await Room.create(body);
    return NextResponse.json(newRoom, { status: 201 });

  } catch (error) {
    console.error("Create Room Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
