import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import User from "@/models/User";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI);
};

export async function GET(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await User.findById(session.user.id).select("-password");
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { name, email, mobile } = await req.json();

        // Validation
        if(!name || !mobile) {
             return NextResponse.json({ error: "Name and Mobile are required" }, { status: 400 });
        }

        // Check if email/mobile taken by others
        const existing = await User.findOne({
            $or: [{ email: email }, { mobile: mobile }],
            _id: { $ne: session.user.id }
        });
        
        if (existing) {
            if(existing.email === email && email) return NextResponse.json({ error: "Email already in use" }, { status: 400 });
            if(existing.mobile === mobile) return NextResponse.json({ error: "Mobile number already in use" }, { status: 400 });
        }

        const updatedUser = await User.findByIdAndUpdate(
            session.user.id,
            { name, email, mobile },
            { new: true }
        ).select("-password");

        return NextResponse.json(updatedUser);

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        if (newPassword.length < 6) {
             return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
        }

        const user = await User.findById(session.user.id);
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Verify Old Password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
        }

        // Hash New Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return NextResponse.json({ success: true, message: "Password updated successfully" });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
