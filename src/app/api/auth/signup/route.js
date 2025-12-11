import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await dbConnect();
    const { name, nationalId, mobile, password } = await req.json();

    if (!nationalId || !mobile || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await User.findOne({ $or: [{ mobile }, { nationalId }] });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists with this Mobile or National ID' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name || 'User', // Default name as prompt didn't specify Name field for signup
      nationalId,
      mobile,
      password: hashedPassword,
      role: 'User',
    });

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
