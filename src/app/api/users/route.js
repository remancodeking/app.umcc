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
    const { name, mobile, role, shift, iqamaNumber, empCode, designation, passportNumber, email, status, terminal } = body;

    // 1. Validation (Iqama is now the primary key)
    if (!iqamaNumber || !name || !role) {
      return NextResponse.json({ error: 'Name, Role, and Iqama Number are required' }, { status: 400 });
    }

    // 2. Uniqueness Check
    const existingUser = await User.findOne({ 
      $or: [
        { iqamaNumber: iqamaNumber },
        { empCode: empCode || 'non-existent-code' },
        ...(mobile ? [{ mobile }] : [])
      ] 
    });
    
    if (existingUser) {
        if(existingUser.iqamaNumber === iqamaNumber) return NextResponse.json({ error: 'Iqama Number already exists' }, { status: 400 });
        if(existingUser.empCode === empCode) return NextResponse.json({ error: 'Employee Code already exists' }, { status: 400 });
        if(mobile && existingUser.mobile === mobile) return NextResponse.json({ error: 'Mobile Number already exists' }, { status: 400 });
    }

    // 3. Auto-Generate SM Number (Robust with Jitter)
    let nextSM = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) { 
        // Small random delay to desynchronize parallel requests
        if (attempts > 0) {
            await new Promise(resolve => setTimeout(resolve, Math.random() * 200)); 
        }

        const lastUser = await User.findOne({ sm: { $regex: /^SM-\d+$/ } }).sort({ createdAt: -1 });
        let nextNum = 1001;
        
        if (lastUser && lastUser.sm) {
            const currentNum = parseInt(lastUser.sm.split("-")[1]);
            if (!isNaN(currentNum)) {
                // If retrying, try jumping ahead slightly to avoid the immediate next collision
                nextNum = currentNum + 1 + (attempts > 0 ? attempts : 0);
            }
        }
        nextSM = `SM-${nextNum}`;
        
        // Double check availability
        const check = await User.findOne({ sm: nextSM });
        if (!check) {
             isUnique = true;
        }
        attempts++;
    }
    
    // Fallback: If still not unique after 10 tries, use timestamp
    if (!isUnique) {
        nextSM = `SM-${Date.now().toString().slice(-4)}`;
    }

    // 4. Default Password Logic (Set to Iqama Number)
    const hashedPassword = await bcrypt.hash(iqamaNumber, 10);

    // Sanitize designation:
    let finalDesignation = designation ? designation.replace(/\r?\n|\r/g, ' ').trim() : 'Porter';
    
    // Explicitly nullify optional sparse unique fields if they are empty strings
    const safeEmpCode = empCode && String(empCode).trim() !== "" ? empCode : undefined;
    const safeMobile = mobile && String(mobile).trim() !== "" ? mobile : undefined;
    const safeEmail = email && String(email).trim() !== "" ? email : undefined;

    const VALID_DESIGNATIONS = [
        'Porter', 'Team Leader', 'Supervisor', 'Ground Operation Manager', 'GID', 
        'Hotel Incharge', 'Cashier', 'Operation Manager', 'Transport Incharge'
    ];

    const match = VALID_DESIGNATIONS.find(d => d.toLowerCase() === finalDesignation.toLowerCase());
    if (match) {
        finalDesignation = match;
    }

    const newUser = await User.create({
      name,
      mobile: safeMobile,
      email: safeEmail,
      password: hashedPassword,
      role: role || 'Employee',
      sm: nextSM,
      empCode: safeEmpCode,
      designation: finalDesignation,
      shift,
      iqamaNumber, 
      passportNumber,
      status: status || 'In Work',
      terminal,
      isOnboarding: true // Force password change on first login
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
    
    // Bulk Update Logic
    if (body.ids && Array.isArray(body.ids)) {
        const { ids, ...data } = body;
        
        // Hash password if present (rare in bulk, but possible)
        if (data.password) {
             data.password = await bcrypt.hash(data.password, 10);
        } else {
             delete data.password;
        }

        const result = await User.updateMany(
            { _id: { $in: ids } },
            { $set: data }
        );
        
        return NextResponse.json({ message: `Updated ${result.modifiedCount} users` });
    }

    // Single Update Logic
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: 'User ID or IDs array is required' }, { status: 400 });

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
    const idParam = searchParams.get('id');
    const deleteAll = searchParams.get('all');

    // 1. Delete All Users (Protect Admin)
    if (deleteAll === 'true') {
        const result = await User.deleteMany({ role: { $ne: 'Admin' } }); // Safety: Don't delete Admins
        return NextResponse.json({ message: `Deleted ${result.deletedCount} users (Admins protected).` });
    }

    // 2. Delete Selected (One or Many)
    if (idParam) {
        const ids = idParam.split(',');
        if (ids.length === 1) {
             const deletedUser = await User.findByIdAndDelete(ids[0]);
             if (!deletedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
             return NextResponse.json({ message: 'User deleted successfully' });
        } else {
             const result = await User.deleteMany({ _id: { $in: ids } });
             return NextResponse.json({ message: `Deleted ${result.deletedCount} users.` });
        }
    }

    return NextResponse.json({ error: 'User ID(s) or all=true param required' }, { status: 400 });

  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
