"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Image from 'next/image';

const ReceiptTemplate = React.forwardRef(({ data }, ref) => {
  if (!data) return null;

  const {
      receiptId,
      date,
      roomNumber,
      receiverName,
      receiverId, // Optional if we have it
      employees,
      totalAmount,
      adminName
  } = data;

  return (
    <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto hidden print:block text-black">
       <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; }
          .print\\:block { display: block !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
      
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center">
         <div className="flex items-center gap-4">
             {/* Logo Placeholder */}
             <div className="h-16 w-16 bg-gray-200 flex items-center justify-center border border-black font-bold text-xs text-center">
                 UMCC LOGO
             </div>
             <div>
                 <h1 className="text-2xl font-bold uppercase tracking-wider">Salary Payment Voucher</h1>
                 <p className="text-sm font-bold text-gray-600">United Mining & Construction Company</p>
             </div>
         </div>
         <div className="text-right">
             <p className="font-bold text-lg">RCPT #: {receiptId}</p>
             <p className="text-sm">{new Date(date).toLocaleString()}</p>
         </div>
      </div>

      {/* Transaction Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm border border-black p-4 bg-gray-50">
          <div>
              <p className="font-bold text-gray-500 uppercase text-xs">Paid To (Receiver)</p>
              <p className="font-bold text-lg uppercase">{receiverName}</p>
          </div>
          <div>
              <p className="font-bold text-gray-500 uppercase text-xs">Room Number</p>
              <p className="font-bold text-lg">{roomNumber}</p>
          </div>
          <div>
             <p className="font-bold text-gray-500 uppercase text-xs">Payment Method</p>
             <p className="font-bold">Cash Disbursement</p>
          </div>
          <div>
             <p className="font-bold text-gray-500 uppercase text-xs">Status</p>
             <p className="font-bold text-green-700 uppercase">PAID & VERIFIED</p>
          </div>
      </div>

      {/* Breakdown Table */}
      <div className="mb-8">
          <h3 className="font-bold text-sm uppercase border-b border-black mb-2">Payment Breakdown</h3>
          <table className="w-full text-sm border-collapse">
              <thead>
                  <tr className="bg-gray-100 border-y border-black">
                      <th className="py-2 text-left font-bold pl-2">Employee Name</th>
                      <th className="py-2 text-center font-bold">Status</th>
                      <th className="py-2 text-right font-bold pr-2">Net Amount</th>
                  </tr>
              </thead>
              <tbody>
                  {employees.map((emp, i) => {
                      const isPayable = ['Present','On Duty'].includes(emp.status);
                      return (
                        <tr key={i} className="border-b border-gray-300">
                            <td className="py-2 pl-2 font-medium">{emp.name} <span className="text-xs text-gray-500">({emp.empCode})</span></td>
                            <td className="py-2 text-center text-xs uppercase">{emp.status}</td>
                            <td className="py-2 text-right font-mono font-bold pr-2">
                                {isPayable ? Number(emp.finalAmount).toFixed(2) : '-'}
                            </td>
                        </tr>
                      );
                  })}
              </tbody>
              <tfoot>
                  <tr className="bg-black text-white">
                      <td colSpan={2} className="py-2 text-right font-bold pr-4 uppercase">Total Paid Amount</td>
                      <td className="py-2 text-right font-bold font-mono text-lg pr-2">{Number(totalAmount).toFixed(2)} SAR</td>
                  </tr>
              </tfoot>
          </table>
      </div>

      {/* Footer / Signatures */}
      <div className="mt-20 pt-8 border-t-2 border-black grid grid-cols-2 gap-20">
          <div>
              <p className="mb-8 font-bold text-sm uppercase">Received By:</p>
              <div className="border-b border-black w-full border-dashed"></div>
              <p className="mt-2 font-bold text-xs">{receiverName}</p>
              <p className="text-[10px] text-gray-500">Signature above confirms receipt of full amount.</p>
          </div>
          <div>
              <p className="mb-8 font-bold text-sm uppercase">Authorized By:</p>
              <div className="border-b border-black w-full border-dashed"></div>
              <p className="mt-2 font-bold text-xs">{adminName || 'Admin'}</p>
          </div>
      </div>

       <div className='mt-8 text-center text-[10px] text-gray-400'>
           System Generated Receipt • UMCC Salary System
       </div>
    </div>
  );
});

ReceiptTemplate.displayName = "ReceiptTemplate";
export default ReceiptTemplate;
