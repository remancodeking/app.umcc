import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  await dbConnect();
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { name, mobile, password, sm, empCode, designation, role, shift, iqamaNumber, passportNumber, email, status, terminal } = body;

    // Basic validation
    if (!mobile || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ mobile }, { empCode: empCode || 'non-existent' }, { nationalId: iqamaNumber || 'non-existent' }] 
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'User with this Mobile, EmpCode, or ID already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      mobile,
      email,
      password: hashedPassword,
      role: role || 'Employee',
      sm,
      empCode,
      designation,
      shift,
      iqamaNumber, 
      passportNumber,
      status,
      terminal
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password; // Don't accidentally overwrite with empty/null
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
