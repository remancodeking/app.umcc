"use client"

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Ban, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeAttendance() {
  const { data: session } = useSession();
  const [history, setHistory] = useState([]);
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
        fetch(`/api/users/${session.user.id}/salary`) // Reuse salary endpoint as it contains status
        .then(res => res.json())
        .then(data => {
            setHistory(data.history || []);
            setLoader(false);
        });
    }
  }, [session]);

  const presentDays = history.filter(h => ['Present', 'On Duty'].includes(h.status)).length;
  const totalDays = history.length;

  const getStatusColor = (status) => {
     if (['Present', 'On Duty'].includes(status)) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
     if (status === 'Absent') return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
     return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
  };

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen pb-24">
       {/* Header */}
       <header className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 px-6 pt-12 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
             <Link href="/employee" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
             </Link>
             <h1 className="text-xl font-black text-gray-900 dark:text-white">Attendance Log</h1>
          </div>
       </header>

       {/* Summary Cards */}
       <div className="grid grid-cols-2 gap-4 px-6 mt-6">
          <div className="bg-emerald-500 text-white p-5 rounded-3xl shadow-lg shadow-emerald-500/20">
             <p className="text-emerald-100 text-xs font-bold uppercase mb-1">Total Present</p>
             <p className="text-3xl font-black">{presentDays} <span className="text-base font-medium opacity-60">Days</span></p>
          </div>
          <div className="bg-rose-500 text-white p-5 rounded-3xl shadow-lg shadow-rose-500/20">
             <p className="text-rose-100 text-xs font-bold uppercase mb-1">Total Absent</p>
             <p className="text-3xl font-black">{totalDays - presentDays} <span className="text-base font-medium opacity-60">Days</span></p>
          </div>
       </div>

       {/* List */}
       <div className="px-6 mt-8 space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Daily Records</h2>
          
          {loader && <p className="text-center text-gray-400 py-10">Loading...</p>}
          
          {history.map((item, idx) => (
             <div key={idx} className="bg-white dark:bg-gray-900 p-4 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-gray-800">
                 <div className="flex items-center gap-4">
                     <div className={`p-2 rounded-xl ${getStatusColor(item.status)}`}>
                        {['Present', 'On Duty'].includes(item.status) ? <CheckCircle className="w-5 h-5"/> : item.status === 'Absent' ? <Ban className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}
                     </div>
                     <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{format(new Date(item.date), 'EEEE, d MMM yyyy')}</p>
                        <p className="text-xs text-gray-400">{item.roomNumber ? `Room: ${item.roomNumber}` : ''}</p>
                     </div>
                 </div>
                 <div className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                    {item.status}
                 </div>
             </div>
          ))}
       </div>
    </div>
  );
}
