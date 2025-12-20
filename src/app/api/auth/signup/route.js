
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Connect to Database
    await dbConnect();

    // 2. Get Data from Request
    const body = await req.json();
    
    // 🔍 LOG: یہاں آپ کو نظر آئے گا کہ فرنٹ اینڈ کیا بھیج رہا ہے
    console.log("👉 Incoming Signup Data:", body); 

    const { name, nationalId, mobile, email, password, iqamaNumber, role } = body;

    // 3. Validation (چیک کریں کہ ضروری ڈیٹا موجود ہے)
    // نوٹ: آپ کے Schema میں iqamaNumber ضروری (Required) ہے
    if (!iqamaNumber || !password || !name) {
      console.log("❌ Missing Fields: Name, Password or IqamaNumber is missing");
      return NextResponse.json(
        { message: 'Missing required fields: Name, Password, and Iqama Number are mandatory.' }, 
        { status: 400 }
      );
    }

    // 4. Check Duplicate (کیا یہ یوزر پہلے سے موجود ہے؟)
    // ہم موبائل، ای میل، اور اقامہ نمبر تینوں چیک کریں گے
    const existingUser = await User.findOne({
      $or: [
        { mobile: mobile || "N/A" },         // اگر موبائل خالی ہے تو اسے اگنور کرے گا (Sparse کی وجہ سے)
        { email: email || "N/A" },           
        { iqamaNumber: iqamaNumber }         // اقامہ نمبر یونیک ہونا ضروری ہے
      ]
    });

    if (existingUser) {
      console.log("⚠️ User Already Exists:", existingUser.email || existingUser.mobile);
      return NextResponse.json(
        { message: 'User already exists with this Mobile, Email, or Iqama Number' }, 
        { status: 400 }
      );
    }

    // 5. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Create User
    const newUser = await User.create({
      name,
      email,
      mobile,
      nationalId,
      iqamaNumber, // یہ فیلڈ Schema میں Required ہے، اس لیے اسے پاس کرنا ضروری ہے
      password: hashedPassword,
      //role: role || 'Employee', // اگر رول نہیں آیا تو بائی ڈیفالٹ Employee سیٹ ہوگا
     // status: 'In Work'
    });

    // ✅ LOG: کامیابی کا میسج
    console.log("✅ User Created Successfully:", newUser._id);

    return NextResponse.json(
      { message: 'User created successfully', user: newUser }, 
      { status: 201 }
    );

  } catch (error) {
    // ❌ LOG: اگر کوئی اصلی ایرر آیا (جیسے Schema Error)
    console.error("🔥 Server Error Details:", error);
    
    // یوزر کو ایرر میسج بھیجیں
    return NextResponse.json(
      { message: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
