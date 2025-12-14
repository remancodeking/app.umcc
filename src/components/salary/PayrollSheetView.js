"use client";

import { X, Printer } from "lucide-react";

export default function PayrollSheetView({ report, onClose }) {
  if (!report || !report.records) return null;

  // Split records into two columns for the "Notebook" layout
  const activeRecords = report.records.filter(r => ['Present', 'On Duty'].includes(r.status));
  const midPoint = Math.ceil(activeRecords.length / 2);
  const leftColumn = activeRecords.slice(0, midPoint);
  const rightColumn = activeRecords.slice(midPoint);

  const handlePrint = () => {
    window.print();
  };

  const SheetRow = ({ index, record }) => (
    <div className="flex border-b border-blue-300 h-8 items-center text-sm">
      <div className="w-8 border-r border-blue-300 text-center font-bold text-gray-600">
        {index + 1}
      </div>
      <div className="flex-1 border-r border-blue-300 px-2 font-medium truncate">
        {record?.name}
      </div>
      <div className="w-16 text-center font-mono font-bold text-gray-800">
        {record?.finalAmount}
      </div>
    </div>
  );

  return (
    <div id="payroll-sheet-view-root" className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col justify-center items-center p-4">
      
      {/* Container Box */}
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden print:h-auto print:shadow-none print:max-w-none print:rounded-none print:static">
        
        {/* Toolbar */}
        <div className="w-full bg-gray-50 border-b px-6 py-4 flex justify-between items-center shadow-sm print:hidden shrink-0">
            <div>
            <h2 className="text-xl font-bold text-gray-900">Payroll Sheet (Notebook View)</h2>
            <p className="text-xs text-gray-500">{report.date} • Master Record</p>
            </div>
            <div className="flex gap-3">
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg active:scale-95"
            >
                <Printer size={16} /> Print Sheet
            </button>
            <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
            >
                <X size={20} />
            </button>
            </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 w-full overflow-auto p-8 flex justify-center bg-gray-100/50 print:p-0 print:bg-white print:block">
            
            {/* The Paper */}
            <div className="bg-[#fdfdfd] shadow-xl w-full max-w-[210mm] min-h-[297mm] p-[10mm] print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 relative mx-auto">
                <style jsx global>{`
                    @media print {
                        @page { size: A4 portrait; margin: 0; }
                        body * { visibility: hidden; }
                        #payroll-sheet-view-root, #payroll-sheet-view-root * { visibility: visible; }
                        #payroll-sheet-view-root {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: auto;
                            background: white !important;
                            padding: 0 !important;
                            overflow: visible !important;
                        }
                        .print\\:hidden { display: none !important; }
                    }
                `}</style>
                
                {/* Notebook Styling Overlay */}
                <div className="h-full border border-gray-300 flex flex-col">
                    
                    {/* Header Area */}
                    <div className="border-b-2 border-red-300 p-4 mb-2">
                        <div className="flex justify-between items-end">
                            <h1 className="text-2xl font-bold font-serif text-blue-900 italic underline decoration-red-300 decoration-2 underline-offset-4">
                                Details of Daily Labor
                            </h1>
                            <div className="text-right">
                                <p className="font-bold text-lg text-blue-900">Date: <span className="underline decoration-dotted">{report.date}</span></p>
                                <p className="font-bold text-sm text-gray-500">Shift: Main</p>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid - 2 Columns mimicking the notebook */}
                    <div className="flex-1 flex">
                        
                        {/* Left Page Column */}
                        <div className="flex-1 border-r-2 border-red-300 px-2 flex flex-col">
                            {/* Column Header */}
                            <div className="flex border-b-2 border-red-300 h-8 items-center bg-blue-50 text-blue-900 font-bold text-xs uppercase">
                                <div className="w-8 text-center border-r border-red-300">No</div>
                                <div className="flex-1 text-center border-r border-red-300">Name</div>
                                <div className="w-16 text-center">Wage</div>
                            </div>
                            
                            {/* Rows */}
                            <div className="flex-1">
                                {leftColumn.map((r, i) => (
                                    <SheetRow key={i} index={i} record={r} />
                                ))}
                                {/* Fill empty lines to look like notebook */}
                                {[...Array(Math.max(0, 30 - leftColumn.length))].map((_, i) => (
                                    <div key={`empty-l-${i}`} className="flex border-b border-blue-100 h-8"></div>
                                ))}
                            </div>
                        </div>

                        {/* Right Page Column */}
                        <div className="flex-1 px-2 flex flex-col">
                            {/* Column Header */}
                            <div className="flex border-b-2 border-red-300 h-8 items-center bg-blue-50 text-blue-900 font-bold text-xs uppercase">
                                <div className="w-8 text-center border-r border-red-300">No</div>
                                <div className="flex-1 text-center border-r border-red-300">Name</div>
                                <div className="w-16 text-center">Wage</div>
                            </div>

                            {/* Rows */}
                            <div className="flex-1">
                                {rightColumn.map((r, i) => (
                                    <SheetRow key={i} index={i + midPoint} record={r} />
                                ))}
                                {/* Fill empty lines */}
                                {[...Array(Math.max(0, 30 - rightColumn.length))].map((_, i) => (
                                    <div key={`empty-r-${i}`} className="flex border-b border-blue-100 h-8"></div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Footer Totals */}
                    <div className="border-t-2 border-red-300 p-2 bg-yellow-50 flex justify-between items-center text-blue-900 border-b">
                        <div>
                            <span className="font-bold uppercase text-xs mr-2">Total Staff:</span>
                            <span className="font-mono font-bold text-lg">{activeRecords.length}</span>
                        </div>
                        <div className="text-xl font-bold">
                            TOTAL: <span className="underline decoration-double">{Number(report.totalRevenue).toLocaleString()}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
