"use client"

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { LogOut, Calendar, Wallet, ChevronRight, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("salary"); // 'salary' | 'attendance'

  // Fetch Data
  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/users/${session.user.id}/salary`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
             <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-sm font-medium text-gray-400 animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  // Derived Data
  const stats = data?.stats || {};
  const history = data?.history || [];
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = history.find(h => h.date === today);
  const todayStatus = todayRecord?.status || 'Not Marked';

  // Helper for Status Color
  const getStatusColor = (status) => {
      switch(status) {
          case 'Present': return 'bg-emerald-500 text-white shadow-emerald-500/30';
          case 'On Duty': return 'bg-emerald-500 text-white shadow-emerald-500/30';
          case 'Absent': return 'bg-rose-500 text-white shadow-rose-500/30';
          default: return 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
      }
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-20">
      
      {/* HEADER */}
      <header className="px-6 pt-8 pb-4 flex items-center justify-between">
         <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Welcome back,</p>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
               {session?.user?.name?.split(' ')[0]} 
               <span className="text-gray-300 dark:text-gray-700">.</span>
            </h1>
         </div>
         <button 
           onClick={() => signOut({ callbackUrl: '/auth/login' })}
           className="p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
         >
           <LogOut className="w-5 h-5" />
         </button>
      </header>

      {/* HERO CARD (Status & Wallet) */}
      <section className="px-6 mb-8">
         <div className="relative overflow-hidden rounded-[2rem] bg-gray-900 dark:bg-black text-white p-6 shadow-2xl shadow-indigo-500/20">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
             
             <div className="relative z-10 flex flex-col gap-6">
                
                {/* Top Row: Date & Status */}
                <div className="flex items-start justify-between">
                   <div>
                      <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Today's Status</p>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${getStatusColor(todayStatus)}`}>
                         {['Present', 'On Duty'].includes(todayStatus) ? <CheckCircle className="w-3 h-3"/> : todayStatus === 'Absent' ? <XCircle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                         {todayStatus}
                      </div>
                   </div>
                   <div className="text-right">
                       <p className="text-sm font-medium text-gray-300">{format(new Date(), 'EEE, dd MMM')}</p>
                   </div>
                </div>

                {/* Bottom Row: Wallet Balance */}
                <div>
                   <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">Unpaid Balance</p>
                   <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black tracking-tight">{stats.unpaidBalance?.toLocaleString()}</span>
                      <span className="text-lg font-medium text-indigo-300">SAR</span>
                   </div>
                   <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> 
                      Accumulated pending collection
                   </p>
                </div>
             </div>
         </div>
      </section>

      {/* TABS NAVIGATION */}
      <section className="px-6 mb-6">
         <div className="p-1 bg-gray-100 dark:bg-gray-900 rounded-xl flex font-bold text-sm">
            <button 
              onClick={() => setActiveTab("salary")}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'salary' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
               <Wallet className="w-4 h-4" /> Earnings
            </button>
            <button 
              onClick={() => setActiveTab("attendance")}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'attendance' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
               <Calendar className="w-4 h-4" /> Attendance
            </button>
         </div>
      </section>

      {/* TAB CONTENT */}
      <section className="px-6">
         {activeTab === 'salary' ? (
           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* List of Recent Earnings */}
               {history.map((record) => (
                  <div key={record._id} className="group bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${record.isPaid ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'}`}>
                            {record.day || format(new Date(record.date), 'dd')}
                         </div>
                         <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">{format(new Date(record.date), 'MMMM yyyy')}</p>
                            <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                               {['Present', 'On Duty'].includes(record.status) ? (
                                   record.isPaid ? <span className="text-emerald-500">Paid Cash</span> : <span className="text-amber-500">Pending</span>
                               ) : (
                                   <span className="text-red-400">{record.status}</span>
                               )}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-lg font-black ${record.amount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-300'}`}>
                            {record.amount > 0 ? '+' : ''}{record.amount}
                         </p>
                         {record.deductions?.length > 0 && (
                            <p className="text-xs text-red-500 font-bold">-{record.deductions.reduce((a,b)=>a+b.amount,0)} Ded</p>
                         )}
                      </div>
                  </div>
               ))}
               {history.length === 0 && (
                  <div className="text-center py-10 text-gray-400">No earnings history found</div>
               )}
           </div>
         ) : (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Attendance Summary */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-emerald-800 dark:text-emerald-400 text-xs font-bold uppercase mb-1">Days Present</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.presentDays}</p>
                 </div>
                 <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                    <p className="text-rose-800 dark:text-rose-400 text-xs font-bold uppercase mb-1">Days Absent</p>
                    <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{stats.totalDays - stats.presentDays}</p>
                 </div>
              </div>

               {/* Simple Log */}
               <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {history.map((record, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                          <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${['Present', 'On Duty'].includes(record.status) ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{format(new Date(record.date), 'EEEE, dd MMM')}</span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${['Present', 'On Duty'].includes(record.status) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {record.status === 'Present' ? 'P' : record.status === 'On Duty' ? 'OD' : 'A'}
                          </span>
                      </div>
                  ))}
               </div>
           </div>
         )}
      </section>

    </div>
  );
}
