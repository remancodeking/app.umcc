import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import SalesReport from '@/models/SalesReport';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    // Check role
    const { role } = session.user;
    if (role !== 'Admin' && role !== 'Cashier') {
        return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const updatedReport = await SalesReport.findByIdAndUpdate(id, body, { new: true });
    
    if (!updatedReport) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error("Update Error:", error);
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
        return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const deletedReport = await SalesReport.findByIdAndDelete(id);

    if (!deletedReport) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
