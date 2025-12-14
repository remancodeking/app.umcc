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
    const { role, shift } = session.user;
    if (role !== 'Admin' && role !== 'Cashier') {
        return NextResponse.json({ error: "Forbidden: Authorized users only" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Check ownership/shift logic before update
    const existing = await SalesReport.findById(id);
    if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    // If shift scoping is active (shift exists and not 'All'), ensure match
    if (shift && shift !== 'All' && existing.team && existing.team !== shift) {
         // Allow Admins to override? The prompt says "Authorized users only" (Cashier/Admin). 
         // Usually Admin can do anything. Cashier is restricted.
         if(role !== 'Admin') {
             return NextResponse.json({ error: "Forbidden: You can only edit reports from your shift" }, { status: 403 });
         }
    }
    
    // Prevent changing team
    delete body.team; 

    // Use findByIdAndUpdate on the ID (we essentially verified access above)
    const updatedReport = await SalesReport.findByIdAndUpdate(id, body, { new: true });
    
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

    const { role, shift } = session.user;
    if (role !== 'Admin' && role !== 'Cashier') {
        return NextResponse.json({ error: "Forbidden: Authorized users only" }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    const existing = await SalesReport.findById(id);
    if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });

    // Shift check
    if (shift && shift !== 'All' && existing.team && existing.team !== shift) {
         if(role !== 'Admin') {
             return NextResponse.json({ error: "Forbidden: You can only delete reports from your shift" }, { status: 403 });
         }
    }

    await SalesReport.findByIdAndDelete(id);

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
