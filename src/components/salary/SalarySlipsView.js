"use client";

import { X, Printer, Download, ArrowDownAZ, ArrowDown01, Grid3X3, Grid2X2, LayoutGrid } from "lucide-react";
import Script from "next/script";
import { useState } from "react";

export default function SalarySlipsView({ report, onClose }) {
    if (!report || !report.records) return null;

    const [sortBy, setSortBy] = useState('numeric'); // 'numeric' | 'alpha'
    const [gridCols, setGridCols] = useState(3); // 2 | 3 | 4
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    // Group Records by Room Number
    const roomGroups = {};
    report.records.forEach((r) => {
        // Filter: Only show active Rooms. Skip if no room or 'Unassigned'.
        if (!r.roomNumber || r.roomNumber === "Unassigned") return;

        const room = r.roomNumber;
        if (!roomGroups[room]) roomGroups[room] = [];
        roomGroups[room].push(r);
    });

    // Sort Rooms
    const sortedRoomKeys = Object.keys(roomGroups).sort((a, b) => {
        if (sortBy === 'numeric') {
            const rA = parseInt(a, 10);
            const rB = parseInt(b, 10);
            if (!isNaN(rA) && !isNaN(rB)) return rA - rB;
        }
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        if (!isScriptLoaded || !window.html2pdf) {
            alert("PDF Generator is initializing... please wait.");
            return;
        }

        setIsGeneratingPdf(true);
        const element = document.getElementById('salary-slips-content');
        const opt = {
            margin: [5, 5, 5, 5], // mm
            filename: `Salary_Slips_${report.date}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        window.html2pdf().set(opt).from(element).save().then(() => setIsGeneratingPdf(false));
    };

    return (
        <div id="salary-slips-view-root" className="fixed inset-0 z-[50] bg-black/80 backdrop-blur-md flex flex-col justify-center items-center p-4">
            <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #salary-slips-view-root,
          #salary-slips-view-root * {
            visibility: visible;
          }
          #salary-slips-view-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 0 !important;
          }
          .print\\:hidden { display: none !important; }

          /* Grid Layout */
          .salary-grid {
             display: grid !important;
             grid-template-columns: repeat(${gridCols}, 1fr) !important;
             gap: 3mm !important;
             align-items: stretch !important; /* Stretch to match height */
             width: 100% !important;
          }
          .salary-card {
             break-inside: avoid !important;
             page-break-inside: avoid !important;
             border: 1px solid black !important;
             height: 100% !important;
          }
        }
      `}</style>

            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
                strategy="afterInteractive"
                onLoad={() => setIsScriptLoaded(true)}
            />

            {/* Toolbar */}
            <div className="bg-white w-full max-w-5xl rounded-t-2xl border-b p-4 flex flex-col md:flex-row justify-between items-center shadow-sm print:hidden gap-4">
                <div>
                    <h2 className="text-xl font-bold">Salary Slips</h2>
                    <p className="text-xs text-gray-500">Preview Mode • {report.date}</p>
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setSortBy('numeric')} className={`p-2 rounded-md ${sortBy === 'numeric' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`} title="Numeric Sort"><ArrowDown01 size={16} /></button>
                    <button onClick={() => setSortBy('alpha')} className={`p-2 rounded-md ${sortBy === 'alpha' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`} title="A-Z Sort"><ArrowDownAZ size={16} /></button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <button onClick={() => setGridCols(2)} className={`p-2 rounded-md ${gridCols === 2 ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`} title="2 Columns"><Grid2X2 size={16} /></button>
                    <button onClick={() => setGridCols(3)} className={`p-2 rounded-md ${gridCols === 3 ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`} title="3 Columns"><Grid3X3 size={16} /></button>
                    <button onClick={() => setGridCols(4)} className={`p-2 rounded-md ${gridCols === 4 ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-black'}`} title="4 Columns"><LayoutGrid size={16} /></button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPdf || !isScriptLoaded}
                        className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={16} /> {isGeneratingPdf ? 'Saving...' : (!isScriptLoaded ? 'Loading...' : 'Download PDF')}
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-black text-white font-bold rounded-lg flex items-center gap-2 hover:bg-gray-800"><Printer size={16} /> Print</button>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-100 w-full max-w-5xl overflow-auto p-8 rounded-b-2xl print:p-0 print:overflow-visible print:bg-white print:w-full print:max-w-full">
                <div id="salary-slips-content" className="bg-white shadow-xl mx-auto p-[5mm] w-[210mm] min-h-[297mm] print:shadow-none print:w-full print:min-h-0 print:p-0">

                    <div className="salary-grid grid gap-3 items-stretch" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
                        {sortedRoomKeys.map((room) => {
                            const employees = roomGroups[room];
                            const total = employees.reduce((sum, emp) => sum + (['Present', 'On Duty'].includes(emp.status) ? emp.finalAmount : 0), 0);
                            // Match Image: Fixed 5 rows always.
                            const ROWS = 5;
                            const displayList = [...employees.slice(0, ROWS)]; // Take up to 5 employees

                            // Fill remaining slots with null for empty rows
                            while (displayList.length < ROWS) {
                                displayList.push(null);
                            }

                            return (
                                <div key={room} className="salary-card border-2 border-black bg-white text-black text-[9px] flex flex-col">
                                    {/* Header */}
                                    <div className="bg-black text-white font-bold text-center py-1 border-b-2 border-black uppercase tracking-wider">
                                        Room {room}
                                    </div>

                                    {/* Table */}
                                    <table className="w-full border-collapse flex-1">

                                        <tbody>
                                            {displayList.map((emp, i) => {
                                                if (!emp) {
                                                    // Empty Row
                                                    return (
                                                        <tr key={`empty-${room}-${i}`} className="border-b border-black h-5">
                                                            <td className="border-r border-black w-10 bg-gray-50/50"></td>{/* Left */}
                                                            <td className="border-r border-black"></td>{/* Middle */}
                                                            <td className="border-r border-black w-8"></td>
                                                            <td className="w-6 text-center text-gray-300 font-bold border-l border-black leading-none">{i + 1}</td>{/* Right (Index) */}
                                                        </tr>
                                                    );
                                                }

                                                // Active Row
                                                const active = ['Present', 'On Duty'].includes(emp.status);
                                                const cuts = emp.deductions?.map(d => {
                                                    const r = d.reason.toLowerCase();
                                                    let label = r.substring(0, 4);
                                                    if (r.includes('recovery')) label = 'Rec';
                                                    else if (r.includes('fine')) label = 'Fine';
                                                    else if (r.includes('loan')) label = 'Loan';
                                                    else if (r.includes('advance')) label = 'Adv';
                                                    return `${label}:${d.amount}`;
                                                }).join(',') || '';

                                                return (
                                                    <tr key={`emp-${emp.id}-${i}`} className="border-b border-black h-5">
                                                        {/* COL 1: Amount/Details (Left) */}
                                                        <td className="border-r border-black w-10 text-center font-mono font-bold leading-none">
                                                            {active ? Math.round(emp.finalAmount) : '-'}
                                                        </td>

                                                        {/* COL 2: Name (Middle) */}
                                                        <td className="border-r border-black px-1 font-bold truncate text-right leading-none">
                                                            <span className={!active ? "line-through text-gray-500" : ""}>{emp.name}</span>
                                                        </td>

                                                        {/* Info (Deductions) */}
                                                        <td className="border-r border-black w-8 text-center text-[7px] text-red-600 font-bold leading-none truncate">
                                                            {cuts}
                                                        </td>

                                                        {/* COL 3: Index (Right) - Matching Image */}
                                                        <td className="w-6 text-center font-bold border-l border-black bg-gray-50 leading-none">
                                                            {i + 1}
                                                        </td>
                                                    </tr>
                                                )
                                            })}

                                            {/* Total Row */}
                                            <tr className="bg-gray-100 font-black h-5">
                                                <td className="border-r border-black text-center py-1">{Math.round(total)}</td>
                                                <td colSpan={3} className="text-center text-[7px] uppercase tracking-widest py-1">Total</td>
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
    );
}
