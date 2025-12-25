"use client";

import { X, Printer, Download, ArrowDownAZ, ArrowDown01, Grid3X3, Grid2X2, LayoutGrid, Eye, EyeOff } from "lucide-react";
import Script from "next/script";
import { useState } from "react";

export default function SalarySlipsView({ report, onClose }) {
    if (!report || !report.records) return null;

    const [sortBy, setSortBy] = useState('numeric');
    const [gridCols, setGridCols] = useState(3);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [showPreview, setShowPreview] = useState(true);

    // Group Records by Room Number
    const roomGroups = {};
    report.records.forEach((r) => {
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

    const handleDownloadPDF = async () => {
        if (!window.html2pdf) {
            alert("PDF Library is still loading... please try again.");
            return;
        }

        setIsGeneratingPdf(true);
        const element = document.getElementById('salary-slips-content');
        const opt = {
            margin: [8, 8, 8, 8],
            filename: `Salary_Slips_${report.date}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        try {
            await window.html2pdf().set(opt).from(element).save();
        } catch (e) {
            console.error(e);
            alert("PDF Generation Failed. Use Print button.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div id="salary-slips-view-root" className="fixed inset-0 z-[50] bg-gradient-to-br from-black via-gray-900 to-black backdrop-blur-lg flex flex-col justify-center items-center p-4">
            <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          body * {
            visibility: hidden;
            height: 0;
            margin: 0;
            padding: 0;
          }
          
          #salary-slips-view-root,
          #salary-slips-view-root * {
            visibility: visible;
            height: auto;
            margin: 0;
            padding: 0;
          }
          
          #salary-slips-view-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            z-index: 99999 !important;
            display: block !important;
          }
          
          nav, aside, header, .sidebar { display: none !important; }
          .print\\:hidden { display: none !important; }

          #salary-slips-content {
            width: 100% !important;
            max-width: 210mm !important;
            box-shadow: none !important;
            background: white !important;
          }

          .salary-grid {
            display: grid !important;
            grid-template-columns: repeat(${gridCols}, 1fr) !important;
            gap: 4mm !important;
            width: 100% !important;
            page-break-inside: avoid !important;
          }

          .salary-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 1px solid #000 !important;
            background: white !important;
          }

          .salary-card table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
        }
      `}</style>
            <Script
                src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
                strategy="afterInteractive"
                onLoad={() => setIsScriptLoaded(true)}
            />

            {/* Header Toolbar */}
            <div className="bg-white/95 backdrop-blur-sm w-full max-w-6xl rounded-t-3xl border-b border-gray-200 p-6 shadow-2xl print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {/* Title Section */}
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Salary Slips</h2>
                        <p className="text-sm text-gray-500 mt-1">Preview Mode • {report.date}</p>
                    </div>

                    {/* Controls Section */}
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        {/* Sort Controls */}
                        <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                            <button onClick={() => setSortBy('numeric')} className={`p-2 rounded-lg transition-all ${sortBy === 'numeric' ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`} title="Sort by Room Number"><ArrowDown01 size={18} /></button>
                            <button onClick={() => setSortBy('alpha')} className={`p-2 rounded-lg transition-all ${sortBy === 'alpha' ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`} title="Sort Alphabetically"><ArrowDownAZ size={18} /></button>
                        </div>

                        {/* Grid Layout Controls */}
                        <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                            <button onClick={() => setGridCols(2)} className={`p-2 rounded-lg transition-all ${gridCols === 2 ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`} title="2 Columns"><Grid2X2 size={18} /></button>
                            <button onClick={() => setGridCols(3)} className={`p-2 rounded-lg transition-all ${gridCols === 3 ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`} title="3 Columns"><Grid3X3 size={18} /></button>
                            <button onClick={() => setGridCols(4)} className={`p-2 rounded-lg transition-all ${gridCols === 4 ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`} title="4 Columns"><LayoutGrid size={18} /></button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button onClick={() => setShowPreview(!showPreview)} className="px-4 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2 shadow-lg">{showPreview ? <Eye size={18} /> : <EyeOff size={18} />}{showPreview ? 'Hide' : 'Show'}</button>
                            <button onClick={handleDownloadPDF} disabled={isGeneratingPdf || !isScriptLoaded} className="px-4 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"><Download size={18} />{isGeneratingPdf ? 'Saving...' : !isScriptLoaded ? 'Loading...' : 'Download PDF'}</button>
                            <button onClick={handlePrint} className="px-4 py-2.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg"><Printer size={18} />Print</button>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X size={24} className="text-gray-600" /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {showPreview && (
                <div className="flex-1 bg-gray-50 w-full max-w-6xl overflow-auto p-8 rounded-b-3xl print:p-0 print:overflow-visible print:bg-white print:w-full print:max-w-full shadow-2xl">
                    <div id="salary-slips-content" className="bg-white mx-auto p-6 w-full print:shadow-none print:w-full print:p-0 rounded-lg">
                        <div className="salary-grid grid gap-4 items-stretch" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
                            {(() => {
                                // Chunking rooms into rows based on column count
                                const chunks = [];
                                for (let i = 0; i < sortedRoomKeys.length; i += gridCols) {
                                    chunks.push(sortedRoomKeys.slice(i, i + gridCols));
                                }

                                return chunks.map((chunk, chunkIndex) => {
                                    // Find max rows in this dynamic row (min 5) to align heights
                                    const rowLengths = chunk.map(k => (roomGroups[k] || []).length);
                                    const maxRows = Math.max(5, ...rowLengths);

                                    return chunk.map((room) => {
                                        const employees = roomGroups[room];
                                        const total = employees.reduce(
                                            (sum, emp) => sum + (['Present', 'On Duty'].includes(emp.status) ? emp.finalAmount : 0),
                                            0
                                        );

                                        // Pad list to match the row's tallest card
                                        const displayList = [...employees];
                                        while (displayList.length < maxRows) {
                                            displayList.push(null);
                                        }

                                        return (
                                            <div key={room} className="salary-card border-2 border-black bg-white text-black text-[9px] flex flex-col rounded-md overflow-hidden shadow-sm break-inside-avoid">
                                                {/* Card Header */}
                                                <div className="bg-black text-white font-bold text-center py-1.5 border-b-2 border-black uppercase tracking-wider text-xs">
                                                    Room {room}
                                                </div>

                                                {/* Table */}
                                                <div className="flex-1 flex flex-col bg-white">
                                                    <table className="w-full border-collapse flex-1">
                                                        <tbody>
                                                            {displayList.map((emp, i) => {
                                                                // Empty Placeholders - Ensure they take up vertical space
                                                                if (!emp) {
                                                                    return (
                                                                        <tr key={`empty-${room}-${i}`} className="border-b border-gray-300 h-7">
                                                                            <td className="border-r border-gray-300 w-12 bg-gray-50/10"></td>
                                                                            <td className="border-r border-gray-300 px-1"></td>
                                                                            <td className="border-r border-gray-300 w-10"></td>
                                                                            <td className="w-8 text-center text-gray-300 font-bold border-l border-gray-300 text-[10px]">{i + 1}</td>
                                                                        </tr>
                                                                    );
                                                                }

                                                                // Active Rows
                                                                const active = ['Present', 'On Duty'].includes(emp.status);
                                                                const cuts = emp.deductions?.map((d) => {
                                                                    const r = d.reason.toLowerCase();
                                                                    let label = r.substring(0, 4);
                                                                    if (r.includes('recovery')) label = 'Rec';
                                                                    else if (r.includes('fine')) label = 'Fine';
                                                                    else if (r.includes('loan')) label = 'Loan';
                                                                    else if (r.includes('advance')) label = 'Adv';
                                                                    return `${label}:${d.amount}`;
                                                                }).join(',') || '';

                                                                const shortName = emp.name ? emp.name.split(' ').slice(0, 2).join(' ') : '';

                                                                return (
                                                                    <tr key={`emp-${emp.id}-${i}`} className="border-b border-gray-300 h-7">
                                                                        <td className="border-r border-gray-300 w-12 text-center font-mono font-bold leading-tight text-blue-700 text-xs">
                                                                            {active ? Math.round(emp.finalAmount) : '-'}
                                                                        </td>

                                                                        <td className="border-r border-gray-300 px-1 font-black truncate text-right leading-tight uppercase tracking-tight text-[10px]">
                                                                            <span className={!active ? 'line-through text-gray-400' : 'text-gray-900'}>
                                                                                {shortName}
                                                                            </span>
                                                                        </td>

                                                                        <td className="border-r border-gray-300 w-10 text-center text-[8px] text-red-600 font-bold leading-tight truncate">
                                                                            {cuts}
                                                                        </td>

                                                                        <td className="w-8 text-center font-bold border-l border-gray-300 bg-gray-50 leading-tight text-gray-700 text-[10px]">
                                                                            {i + 1}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}

                                                            {/* Total Row - Pushed to bottom */}
                                                            <tr className="bg-black text-white font-black h-7 border-t-2 border-black">
                                                                <td className="border-r border-gray-500 text-center py-1 text-sm">{Math.round(total)}</td>
                                                                <td colSpan={3} className="text-center text-[10px] uppercase tracking-widest py-1 font-bold">
                                                                    Total
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    });
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}