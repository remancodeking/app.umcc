"use client"

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ChevronRight, Bell, AlertCircle, CheckCircle, Clock, Zap, Star, Shield, Download } from 'lucide-react';
import { format } from "date-fns";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useInstall } from "@/components/providers/InstallProvider";

export default function EmployeeHome() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const { deferredPrompt, promptInstall, isStandalone } = useInstall();

  useEffect(() => {
    if (session?.user?.id) {
       fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/users/${session.user.id}/salary`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch(e) {
      console.error(e);
      toast.error("Could not load data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><div className="animate-spin w-12 h-12 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;

  // Calculte Today's Data
  const history = data?.history || [];
  const todayDate = new Date().toISOString().split('T')[0];
  const todayRecord = history.find(h => h.date === todayDate);

  const todayAmount = todayRecord?.amount || 0;
  const isPaid = todayRecord?.isPaid || false;
  const status = todayRecord?.status || 'Not Marked'; 

  // Format Name
  const firstName = session?.user?.name ? session.user.name.split(' ')[0] : 'Employee';
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="bg-black min-h-screen pb-24 text-white font-sans selection:bg-indigo-500/30">
       
       {/* App Bar / Header */}
       <header className="pt-8 px-6 pb-6 sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5">
                    <div className="h-full w-full rounded-full bg-black flex items-center justify-center text-sm font-bold">
                        {firstName[0]}
                    </div>
                 </div>
                 <div>
                     <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{greeting}</p>
                     <h1 className="text-xl font-bold">{firstName}</h1>
                 </div>
             </div>
             
             <div className="flex gap-2">
                 {/* Install Button */}
                 {deferredPrompt && !isStandalone && (
                     <button 
                        onClick={promptInstall}
                        className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-full flex items-center gap-1 hover:bg-gray-200 transition-colors"
                     >
                         <Download className="w-3 h-3" /> Install
                     </button>
                 )}

                 <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors relative">
                     <Bell className="w-5 h-5" />
                     <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                 </button>
             </div>
          </div>
       </header>

       <div className="px-6 space-y-8 mt-6">
          
          {/* Main Card: Money Earned Today */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={() => router.push('/employee/money')}
            className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-8 shadow-2xl shadow-indigo-500/20 active:scale-95 transition-transform cursor-pointer border border-white/10"
          >
             {/* Abstract Shapes */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-24 translate-x-24 group-hover:bg-white/20 transition-colors duration-500"></div>
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/20 rounded-full blur-2xl translate-y-12 -translate-x-12"></div>
             
             <div className="relative z-10">
                <div className="flex items-start justify-between mb-10">
                   <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
                      <Wallet className="w-6 h-6 text-white" />
                   </div>
                   <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/10 shadow-lg ${isPaid ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100'}`}>
                      {isPaid ? <CheckCircle className="w-3.5 h-3.5"/> : <Clock className="w-3.5 h-3.5"/>}
                      {isPaid ? 'PAID' : 'PENDING'}
                   </div>
                </div>

                <div>
                   <p className="opacity-70 text-xs font-bold uppercase tracking-widest mb-2">Daily Earnings</p>
                   <div className="flex items-baseline gap-2">
                      <span className="text-7xl font-black tracking-tighter" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{todayAmount}</span>
                      <span className="text-xl font-bold opacity-60">SAR</span>
                   </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                   <p className="text-sm font-medium opacity-80 flex items-center gap-2">
                       <Zap className="w-4 h-4 fill-white text-white" /> Tap to view details
                   </p>
                   <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                       <ChevronRight className="w-4 h-4" />
                   </div>
                </div>
             </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
              <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.1 }}
                 onClick={() => router.push('/employee/attendance')}
                 className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-3xl border border-white/5 active:bg-gray-800 transition-colors cursor-pointer"
              >
                  <div className="mb-4 p-2 bg-blue-500/10 w-fit rounded-xl text-blue-400"><Shield className="w-5 h-5" /></div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status</p>
                  <div className={`text-xl font-black ${
                      ['Present','On Duty'].includes(status) ? 'text-emerald-400' : status === 'Absent' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                      {status}
                  </div>
              </motion.div>

              <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-3xl border border-white/5"
              >
                  <div className="mb-4 p-2 bg-purple-500/10 w-fit rounded-xl text-purple-400"><Star className="w-5 h-5" /></div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Unpaid</p>
                  <div className="text-xl font-black text-white">
                      {data?.stats?.unpaidBalance?.toLocaleString() || 0} <span className="text-xs text-gray-500 font-normal">SAR</span>
                  </div>
              </motion.div>
          </div>
          
          {/* Recent Activity Mini List (Placeholder) */}
          <div className="pt-4">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">Recent History</h3>
              <div className="space-y-3">
                  {history.slice(0, 3).map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-900/30 border border-white/5 rounded-2xl">
                          <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ${h.status === 'Present' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                  {h.status === 'Present' ? 'P' : 'A'}
                              </div>
                              <div>
                                  <p className="font-bold text-sm">{format(new Date(h.date), 'MMM dd, yyyy')}</p>
                                  <p className="text-xs text-gray-500">{h.status}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-sm">{h.amount} SAR</p>
                              <p className={`text-[10px] font-bold uppercase ${h.isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>{h.isPaid ? 'Paid' : 'Pending'}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

       </div>
    </div>
  );
}
