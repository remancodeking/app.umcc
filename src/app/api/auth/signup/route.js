
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    await dbConnect();

    // 1. Get Data
    const body = await req.json();
    console.log("👉 Incoming Signup Data:", body); 

    const { name, nationalId, mobile, email, password, role } = body;

    // 2. Validation
    // اب ہم چیک کریں گے کہ nationalId موجود ہے یا نہیں
    if (!nationalId || !password || !name) {
      return NextResponse.json(
        { message: 'Missing fields: Name, Password, and National ID are required.' }, 
        { status: 400 }
      );
    }

    // 3. Check Duplicate
    // موبائل، ای میل، یا نیشنل آئی ڈی پہلے سے تو نہیں؟
    const existingUser = await User.findOne({
      $or: [
        { mobile: mobile || "N/A" },
        { email: email || "N/A" },
        { nationalId: nationalId },     // نیشنل آئی ڈی چیک کریں
        { iqamaNumber: nationalId }     // اقامہ بھی وہی ہے، اس لیے وہ بھی چیک کریں
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this Mobile or ID' }, 
        { status: 400 }
      );
    }

    // 4. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create User
    // یہاں ہم nationalId کو ہی iqamaNumber میں ڈال رہے ہیں
    const newUser = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      //role: role || 'Employee',
    //  status: 'In Work',
      
      // ✅ یہ ہے آپ کا حل:
      nationalId: nationalId,   // نیشنل آئی ڈی میں بھی وہی ویلیو
      iqamaNumber: nationalId,  // اقامہ نمبر میں بھی وہی ویلیو (کیونکہ یہ Required ہے)
    });

    console.log("✅ User Created:", newUser._id);

    return NextResponse.json(
      { message: 'User created successfully', user: newUser }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("🔥 Error:", error);
    return NextResponse.json(
      { message: error.message || 'Server Error' }, 
      { status: 500 }
    );
  }
}
