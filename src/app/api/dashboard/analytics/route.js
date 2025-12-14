import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SalesReport from "@/models/SalesReport";
import mongoose from "mongoose";

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI);
};

export async function GET(req) {
    try {
        await connectDB();
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        let query = {};
        if (start && end) {
            query.date = { $gte: start, $lte: end };
        }

        const reports = await SalesReport.find(query).sort({ date: 1 });

        // Aggregation
        let totalRevenue = 0;
        let totalNet = 0;
        let totalLabor = 0;
        let totalStaffPresent = 0;
        let totalStaffTotal = 0;
        let count = 0;

        // Expanded Aggregations
        let totalExpenses = 0;
        let totalAdjustments = 0;
        let revenueStreams = {
             Alfiyah: 0,
             Rahman: 0,
             Bugis: 0,
             Ibrahim: 0,
             Generic: 0,
             Zamzam: 0,
             Trolley: 0,
             Passenger: 0,
             Porter: 0
        };
        let foreignCurrencyTotal = 0;

        // For Charts
        const dailyTrend = [];
        const dailyStaff = [];

        reports.forEach(r => {
            totalRevenue += r.totalSalesAmount || 0;
            totalNet += r.netSalesAmount || 0;
            totalLabor += r.distribution?.laborAmount || 0;
            
            const present = r.staffStats?.empPresent || 0;
            const totalEmp = r.staffStats?.totalEmp || 0;
            totalStaffPresent += present;
            totalStaffTotal += totalEmp;
            count++;

            // Expenses & Adjustments
            const adj = r.adjustments || {};
            const expenses = (adj.terminalExpenses || 0) + (adj.crossShiftTrolleyPayments || 0) + (adj.fcUnexchangeable || 0);
            totalExpenses += expenses;
            totalAdjustments += (adj.crossShiftTrolleyReceipts || 0) - expenses;

            // Foreign Currency (Convert to SAR estimate from totalForeignCashInSar)
            foreignCurrencyTotal += r.foreignCurrency?.totalForeignCashInSar || 0;

            // Daily Trend
            const dayStr = r.date;
            const existingDay = dailyTrend.find(d => d.date === dayStr);
            if (existingDay) {
                existingDay.amount += r.totalSalesAmount || 0;
                existingDay.expenses += expenses;
            } else {
                dailyTrend.push({ date: dayStr, amount: r.totalSalesAmount || 0, expenses });
                dailyStaff.push({ date: dayStr, present, absent: (r.staffStats?.empAbsent || 0) });
            }

            // Detailed Sources
            const rev = r.revenue || {};
            revenueStreams.Alfiyah += (rev.groupsDepartureAlfiyah || 0) + (rev.groupsArrivalAlfiyah || 0);
            revenueStreams.Rahman += (rev.groupsDepartureRahman || 0) + (rev.groupsArrivalRahman || 0);
            revenueStreams.Bugis += (rev.groupsDepartureBugis || 0) + (rev.groupsArrivalBugis || 0);
            revenueStreams.Ibrahim += (rev.groupsArrivalIbrahim || 0) + (rev.groupsDepartureIbrahim || 0);
            revenueStreams.Generic += (rev.groupsDepartureGeneric || 0) + (rev.groupsArrivalGeneric || 0);
            revenueStreams.Zamzam += (rev.zamzam || 0) + (rev.bZamzam || 0);
            revenueStreams.Trolley += rev.trolley || 0;
            revenueStreams.Passenger += rev.passengerCollection || 0;
            revenueStreams.Porter += rev.porterCollection || 0;
        });

        // Format Breakdown for Recharts (Pie)
        const revenuePieData = [
            { name: 'Alfiyah', value: revenueStreams.Alfiyah, fill: '#8884d8' },
            { name: 'Rahman', value: revenueStreams.Rahman, fill: '#82ca9d' },
            { name: 'Bugis', value: revenueStreams.Bugis, fill: '#ffc658' },
            { name: 'Ibrahim', value: revenueStreams.Ibrahim, fill: '#ff8042' },
            { name: 'Generic Groups', value: revenueStreams.Generic, fill: '#a4de6c' },
            { name: 'Zamzam', value: revenueStreams.Zamzam, fill: '#d0ed57' },
            { name: 'Trolley', value: revenueStreams.Trolley, fill: '#83a6ed' },
            { name: 'Pax Collection', value: revenueStreams.Passenger, fill: '#8dd1e1' },
            { name: 'Porter', value: revenueStreams.Porter, fill: '#82ca9d' }
        ].filter(i => i.value > 0);

        // KPI Calculations
        const avgStaffPresent = count > 0 ? Math.round(totalStaffPresent / count) : 0;
        const avgStaffTotal = count > 0 ? Math.round(totalStaffTotal / count) : 0;
        // Calculate Revenue per Staff (total revenue / total present man-shifts) roughly
        const staffEfficiency = totalStaffPresent > 0 ? Math.round(totalRevenue / totalStaffPresent) : 0;
        
        return NextResponse.json({
            kpi: {
                totalRevenue,
                totalNet,
                totalLabor,
                totalExpenses,
                foreignCurrencyTotal,
                avgStaffPresent,
                attendanceRate: totalStaffTotal > 0 ? Math.round((totalStaffPresent / totalStaffTotal) * 100) : 0,
                staffEfficiency, // Avg revenue generated per person-shift
                reportCount: count,
            },
            charts: {
                dailyTrend,
                dailyStaff,
                revenuePieData
            },
            detailedStreams: revenueStreams,
            rawReports: reports // Sending raw reports for a detailed Drill-down table if needed
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
