import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import SalesReport from '@/models/SalesReport';
import { CloudCog } from 'lucide-react';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    
    // Filter by Shift (Team)
    const query = {};
    if (session.user.shift && session.user.shift !== 'All') {
        const userShift = session.user.shift;
        // Strict Match: Team matches user shift OR Legacy (team is null/missing)
        // This ensures historical data is not hidden.
        query.$or = [
            { team: userShift },
            { team: null },
            { team: { $exists: false } }
        ];
    }
    
    // Sort by date desc
    const reports = await SalesReport.find(query).sort({ date: -1, createdAt: -1 }).limit(50).populate('submittedBy', 'name');
    
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const body = await request.json();
    
    const team = (session.user.shift && session.user.shift !== 'All') ? session.user.shift : null;

    const newReport = await SalesReport.create({
      ...body,
      submittedBy: session.user.id,
      team: team
    });

    return NextResponse.json(newReport);
  } catch (error) {
    console.error("Sales Report Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
