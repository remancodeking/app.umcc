import React, { forwardRef } from 'react';

const PayrollSummarySheet = forwardRef(({ data }, ref) => {
  if (!data || !data.report) return <div ref={ref} className="hidden" />;

  const { report, rooms } = data;

  return (
    <div ref={ref} className="w-full bg-white text-black p-8 font-serif leading-relaxed">
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold uppercase tracking-widest mb-1">United Movement Company Ltd.</h1>
            <h2 className="text-lg font-bold">Daily Salary Disbursement Sheet</h2>
            <p className="text-sm text-gray-600 mt-1">Date: <span className="font-bold">{new Date(report.date).toLocaleDateString()}</span></p>
            <div className="flex justify-center gap-6 mt-2 text-xs font-bold uppercase">
                <span>Revenue: {report.totalRevenue}</span>
                <span>Staff Paid: {report.totalPresent}</span>
                <span>Per Head Rate: {report.perHead} SAR</span>
            </div>
        </div>

        {/* Room Wise Table */}
        <table className="w-full text-xs border-collapse border border-black mb-8">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border border-black px-2 py-1 w-12">#</th>
                    <th className="border border-black px-2 py-1 text-left">Room Number</th>
                    <th className="border border-black px-2 py-1 w-20">Emp Count</th>
                    <th className="border border-black px-2 py-1 text-right w-24">Total Amount</th>
                    <th className="border border-black px-2 py-1 w-32">Receiver Name</th>
                    <th className="border border-black px-2 py-1 w-24">Signature</th>
                </tr>
            </thead>
            <tbody>
                {rooms.map((room, index) => (
                    <tr key={index}>
                        <td className="border border-black px-2 py-1 text-center font-bold">{index + 1}</td>
                        <td className="border border-black px-2 py-1 font-bold">{room.roomNumber}</td>
                        <td className="border border-black px-2 py-1 text-center">{room.employees.length}</td>
                        <td className="border border-black px-2 py-1 text-right font-bold">{Number(room.totalAmount).toLocaleString()}</td>
                        <td className="border border-black px-2 py-1">{room.receiverName || '-'}</td>
                        <td className="border border-black px-2 py-1"></td>
                    </tr>
                ))}
            </tbody>
            <tfoot className="bg-gray-100 font-bold">
                <tr>
                    <td colSpan="2" className="border border-black px-2 py-1 text-right text-sm">Totals:</td>
                    <td className="border border-black px-2 py-1 text-center text-sm">{report.totalPresent}</td>
                    <td className="border border-black px-2 py-1 text-right text-sm">
                        {rooms.reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString()}
                    </td>
                    <td colSpan="2" className="border border-black px-2 py-1"></td>
                </tr>
            </tfoot>
        </table>

        {/* Signatures */}
        <div className="mt-12 flex justify-between text-xs font-bold uppercase px-8">
            <div className="text-center">
                <div className="mb-8 border-b border-black w-40"></div>
                <p>Prepared By (Cashier)</p>
            </div>
            <div className="text-center">
                <div className="mb-8 border-b border-black w-40"></div>
                <p>Approved By (Admin)</p>
            </div>
        </div>
    </div>
  );
});

PayrollSummarySheet.displayName = "PayrollSummarySheet";
export default PayrollSummarySheet;
