import React, { forwardRef } from 'react';

const PayrollSummarySheet = forwardRef(({ data }, ref) => {
  if (!data || !data.report) return <div ref={ref} className="hidden" />;

  const { report, rooms } = data;

  return (
    <div ref={ref} className="w-full bg-white text-black p-4 font-sans text-[10px] leading-tight print:p-0">
        <style jsx global>{`
          @media print {
            @page { size: A4 portrait; margin: 5mm; }
            body { -webkit-print-color-adjust: exact; }
          }
        `}</style>
        
        {/* Header */}
        <div className="text-center mb-4">
            <h1 className="font-black text-xl uppercase tracking-widest border-b-2 border-black inline-block px-8">United Movement Company Ltd.</h1>
            <div className="flex justify-between items-end mt-2 px-4 uppercase font-bold">
                <div>Date: {new Date(report.date).toLocaleDateString()}</div>
                <div>Salary Disbursement Sheet</div>
                <div>Per Head: {report.perHead}</div>
            </div>
        </div>

        {/* Room Grid - 3 Columns */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-4">
            {(() => {
                // Chunk rooms into groups of 3 to align row heights
                const chunkSize = 3;
                const chunks = [];
                for (let i = 0; i < rooms.length; i += chunkSize) {
                    chunks.push(rooms.slice(i, i + chunkSize));
                }

                return chunks.map((chunk, chunkIndex) => {
                    // Find max rows in this row (min 5)
                    const maxRows = Math.max(5, ...chunk.map(c => c.employees.length));

                    return chunk.map((room, colIndex) => {
                        const filledRows = [...room.employees];
                        while(filledRows.length < maxRows) {
                            filledRows.push({ isPlaceholder: true });
                        }

                        const totalAmount = room.employees.reduce((sum, e) => {
                            const isPayable = ['Present', 'On Duty'].includes(e.status);
                            return sum + (isPayable ? (Number(e.finalAmount) || 0) : 0);
                        }, 0);

                        return (
                             <div key={`${chunkIndex}-${colIndex}`} className="border-2 border-black flex flex-col break-inside-avoid">
                                {/* Header */}
                                <div className="bg-black text-white text-center font-bold py-1 uppercase text-xs">
                                    Room {room.roomNumber}
                                </div>
                                
                                {/* Table */}
                                <div className="flex-1 flex flex-col">
                                    {filledRows.map((emp, i) => {
                                        if (emp.isPlaceholder) {
                                            return (
                                                <div key={`p-${i}`} className="flex border-b border-gray-300 h-6">
                                                    <div className="w-[15%] border-r border-gray-300"></div>
                                                    <div className="flex-1 border-r border-gray-300"></div>
                                                    <div className="w-[10%] flex items-center justify-center text-gray-300 font-bold">{i + 1}</div>
                                                </div>
                                            );
                                        }

                                        const isPayable = ['Present', 'On Duty'].includes(emp.status);
                                        const isStrikethrough = !isPayable;
                                        const amount = isPayable ? Number(emp.finalAmount).toFixed(0) : '-';
                                        
                                        // Shorten Name: First 2 words
                                        const shortName = emp.name ? emp.name.split(' ').slice(0, 2).join(' ') : '';

                                        return (
                                            <div key={i} className="flex border-b border-gray-300 h-6 items-center">
                                                {/* Amount Column */}
                                                <div className="w-[15%] border-r border-gray-300 flex items-center justify-center font-bold h-full text-xs">
                                                    {amount}
                                                </div>
                                                
                                                {/* Name Column - Bigger & Shortened */}
                                                <div className={`flex-1 border-r border-gray-300 px-2 flex items-center h-full truncate text-xs font-black uppercase tracking-tight ${isStrikethrough ? 'line-through text-gray-400' : ''}`}>
                                                    {shortName}
                                                </div>
                                                
                                                {/* Index Column */}
                                                <div className="w-[10%] flex items-center justify-center font-bold h-full text-[10px]">
                                                    {i + 1}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="flex bg-gray-100 h-6 items-center font-bold border-t-2 border-black">
                                     <div className="w-[15%] flex items-center justify-center border-r border-gray-400 h-full">
                                         {totalAmount}
                                     </div>
                                     <div className="flex-1 flex items-center justify-center h-full uppercase text-xs tracking-wider">
                                         Total
                                     </div>
                                     <div className="w-[10%] border-l border-gray-400 h-full"></div>
                                </div>
                            </div>
                        );
                    });
                });
            })()}
        </div>
        
        {/* Grand Footer */}
         <div className="mt-8 flex justify-between px-8 font-bold uppercase text-xs">
            <div>Prepared By: ___________________</div>
            <div>Approved By: ___________________</div>
        </div>

    </div>
  );
});

PayrollSummarySheet.displayName = "PayrollSummarySheet";
export default PayrollSummarySheet;
