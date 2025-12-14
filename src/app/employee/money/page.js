"use client"

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Download, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeMoney() {
  const { data: session } = useSession();
  const [history, setHistory] = useState([]);
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
        fetch(`/api/users/${session.user.id}/salary`)
        .then(res => res.json())
        .then(data => {
            setHistory(data.history || []);
            setLoader(false);
        });
    }
  }, [session]);

  const totalEarned = history.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen pb-24">
       {/* Header */}
       <header className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 px-6 pt-12 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
             <Link href="/employee" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
             </Link>
             <h1 className="text-xl font-black text-gray-900 dark:text-white">Earnings Log</h1>
          </div>
       </header>

       {/* Total Ribbon */}
       <div className="mx-6 mt-6 p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 flex items-center justify-between">
            <div>
               <p className="text-indigo-200 text-xs font-bold uppercase">Total Lifetime</p>
               <p className="text-3xl font-black">{totalEarned.toLocaleString()} <span className="text-sm font-medium opacity-70">SAR</span></p>
            </div>
            <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
               <Download className="w-5 h-5" />
            </div>
       </div>

       {/* List */}
       <div className="px-6 mt-8 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent Transactions</h2>
          
          {loader && <p className="text-center text-gray-400 py-10">Loading...</p>}
          
          {!loader && history.length === 0 && <p className="text-center text-gray-400 py-10">No history found.</p>}

          {history.map((item, idx) => (
             <div key={idx} className="bg-white dark:bg-gray-900 p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold text-xs ${item.isPaid ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                      <span>{format(new Date(item.date), 'dd')}</span>
                      <span className="text-[10px] uppercase opacity-70">{format(new Date(item.date), 'MMM')}</span>
                   </div>
                   <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">Salary Payment</p>
                      <div className="flex items-center gap-2 mt-0.5">
                         {item.isPaid ? (
                           <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Received</span>
                         ) : (
                           <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>
                         )}
                         <span className="text-[10px] text-gray-400">• {item.roomNumber ? `Room ${item.roomNumber}` : 'N/A'}</span>
                      </div>
                   </div>
                </div>
                <div className="text-right">
                   <p className="font-black text-gray-900 dark:text-white">+ {item.amount}</p>
                   {item.deductions?.length > 0 && (
                      <p className="text-[10px] text-red-500 font-medium">-{item.deductions.reduce((a,b)=>a+b.amount,0)} Ded</p>
                   )}
                </div>
             </div>
          ))}
       </div>
    </div>
  );
}
