import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newPassword, confirmPassword } = await req.json();

    if (!newPassword || !confirmPassword) {
        return NextResponse.json({ error: 'Both fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await dbConnect();

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        { 
            password: hashedPassword,
            isOnboarding: false 
        },
        { new: true }
    );

    return NextResponse.json({ message: 'Password updated successfully', user: updatedUser });

  } catch (error) {
    console.error("Onboarding Error:", error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
