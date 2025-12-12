import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Room from '@/models/Room';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Check role
    const { role } = session.user;
    if (role !== 'Admin' && role !== 'Cashier') {
        return NextResponse.json({ error: "Forbidden: Authorized users only" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updatedRoom = await Room.findByIdAndUpdate(id, body, { new: true }).populate('users', 'name empCode avatar designation');
    if (!updatedRoom) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("Update Room Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Check role
    const { role } = session.user;
    if (role !== 'Admin' && role !== 'Cashier') {
        return NextResponse.json({ error: "Forbidden: Authorized users only" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const deletedRoom = await Room.findByIdAndDelete(id);
    if (!deletedRoom) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    return NextResponse.json({ message: "Room deleted" });
  } catch (error) {
    console.error("Delete Room Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
