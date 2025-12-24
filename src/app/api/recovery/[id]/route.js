import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Recovery from "@/models/Recovery";
import mongoose from "mongoose";

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI);
};

export async function PUT(req, { params }) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        // Add role check if needed, e.g. only Admins
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const data = await req.json();

        const recovery = await Recovery.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });

        if (!recovery) {
            return NextResponse.json({ error: "Recovery not found" }, { status: 404 });
        }

        return NextResponse.json(recovery);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const deletedRecovery = await Recovery.findByIdAndDelete(id);

        if (!deletedRecovery) {
            return NextResponse.json({ error: "Recovery not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
