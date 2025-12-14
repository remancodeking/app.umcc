"use client";

import { X, Printer } from "lucide-react";

export default function SalarySlipsView({ report, onClose }) {
  if (!report || !report.records) return null;

  // Group Records by Room Number
  const roomGroups = {};
  report.records.forEach((r) => {
    // Use 'Unassigned' fallback if roomNumber is missing
    const room = r.roomNumber || "Unassigned";
    if (!roomGroups[room]) roomGroups[room] = [];
    roomGroups[room].push(r);
  });

  // Sort Rooms: Numeric Rooms first, then alphanumeric/Unassigned
  const sortedRoomKeys = Object.keys(roomGroups).sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    const rA = parseInt(a);
    const rB = parseInt(b);
    if (!isNaN(rA) && !isNaN(rB)) return rA - rB;
    return a.localeCompare(b);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="salary-slips-view-root" className="fixed inset-0 z-[50] bg-black/80 backdrop-blur-md flex flex-col justify-center items-center p-4">
      {/* Container Box */}
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden print:h-auto print:shadow-none print:max-w-none print:rounded-none print:static">
        
        {/* Toolbar - Hidden when printing */}
        <div className="bg-gray-50 border-b px-6 py-4 flex justify-between items-center shadow-sm print:hidden shrink-0">
            <div>
            <h2 className="text-xl font-bold text-gray-900">Salary Slips Preview</h2>
            <p className="text-xs text-gray-500">{report.date} • {report.totalPresent} Active Staff</p>
            </div>
            <div className="flex gap-3">
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
            >
                <Printer size={16} /> Print Slips
            </button>
            <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
            >
                <X size={20} />
            </button>
            </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-8 justify-center flex bg-gray-100/50 print:p-0 print:bg-white print:block">
            
            {/* Paper Container */}
            <div className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-[5mm] print:shadow-none print:w-full print:max-w-none print:p-0 print:min-h-0 print:m-0 mx-auto">
            
            <style jsx global>{`
                @media print {
                @page { size: A4 portrait; margin: 5mm; }
                body * { visibility: hidden; }
                #salary-slips-view-root, #salary-slips-view-root * { visibility: visible; }
                #salary-slips-view-root {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: auto;
                    background: white !important;
                    padding: 0 !important;
                    overflow: visible !important;
                }
                /* Hide toolbar specifically */
                .print\\:hidden { display: none !important; }
                }
            `}</style>

            {/* Grid Layout - 3 Columns */}
            <div className="grid grid-cols-3 gap-4 content-start">
                {sortedRoomKeys.map((roomNum) => {
                const employees = roomGroups[roomNum];

                // Calculate totals for this room
                const totalCash = employees.reduce((sum, r) => {
                    const isActive = ["Present", "On Duty"].includes(r.status);
                    return sum + (isActive ? r.finalAmount || 0 : 0);
                }, 0);

                return (
                    <div
                    key={roomNum}
                    className="border-2 border-black break-inside-avoid h-fit bg-white text-black mb-1"
                    >
                    {/* Header */}
                    <div className="bg-black text-white text-center font-bold text-xs py-1 uppercase border-b-2 border-black">
                        ROOM NO: {roomNum}
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse text-[9px] table-fixed">
                        <thead>
                        <tr className="bg-gray-100 border-b border-black print:bg-gray-100">
                            <th className="border-r border-black w-6 text-center text-black py-0.5">
                            No
                            </th>
                            <th className="border-r border-black text-left px-1 text-black">
                            Name
                            </th>
                            <th className="border-r border-black w-14 text-center text-black">
                            Amt
                            </th>
                            <th className="w-10 text-center text-black">Info</th>
                        </tr>
                        </thead>
                        <tbody>
                        {employees.map((emp, i) => {
                            const isActive = ["Present", "On Duty"].includes(
                            emp.status
                            );
                            const cuts =
                            emp.deductions
                                ?.map(
                                (d) =>
                                    `${d.reason.substring(0, 1)}:${d.amount}`
                                )
                                .join(",") || "";

                            return (
                            <tr
                                key={emp.user || i}
                                className="border-b border-black h-5"
                            >
                                <td className="border-r border-black text-center font-bold text-black">
                                {i + 1}
                                </td>
                                <td
                                className={`border-r border-black px-1 font-bold truncate ${
                                    !isActive
                                    ? "line-through text-gray-500"
                                    : "text-black"
                                }`}
                                >
                                {emp.name}
                                {!isActive && (
                                    <span className="ml-1 text-[7px] no-underline text-black">
                                    (ABS)
                                    </span>
                                )}
                                </td>
                                <td className="border-r border-black text-center font-mono font-bold text-[10px] text-black">
                                {isActive ? Math.round(emp.finalAmount) : "-"}
                                </td>
                                <td className="px-1 text-center font-bold text-red-600">
                                {cuts}
                                </td>
                            </tr>
                            );
                        })}

                        {/* Minimum padding to ensure consistent rows */}
                        {[...Array(Math.max(0, 4 - employees.length))].map((_, i) => (
                            <tr key={`empty-${i}`} className="border-b border-black h-5">
                            <td className="border-r border-black text-center font-bold text-gray-300">-</td>
                            <td className="border-r border-black"></td>
                            <td className="border-r border-black"></td>
                            <td></td>
                            </tr>
                        ))}

                        {/* Total Row */}
                        <tr className="bg-gray-200 font-bold text-[9px] print:bg-gray-200">
                            <td
                            colSpan={2}
                            className="border-r border-black text-right px-2 text-black"
                            >
                            Total:
                            </td>
                            <td className="border-r border-black text-center text-black">
                            {Math.round(totalCash)}
                            </td>
                            <td></td>
                        </tr>
                        </tbody>
                    </table>
                    </div>
                );
                })}
            </div>
            </div>
        </div>
      </div>
    </div>
  );
}
