"use client"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, User, Clock, CheckCircle, XCircle, MapPin, Coffee, AlertTriangle, Play, Square, Loader2, Filter, Search, Printer, Eye, Lock, ChevronRight, FileText } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'Admin' || session?.user?.role === 'Ground Operation Manager' || session?.user?.role === 'Supervisor';

  const [activeTab, setActiveTab] = useState("all"); 
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Data States
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [adminData, setAdminData] = useState([]);
  const [sessionStatus, setSessionStatus] = useState('Not Started');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Confirm Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'complete', title, message }

  // Reports
  const [reportSessions, setReportSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Data
  const fetchData = async (date = null) => {
    try {
      if (isAdmin) {
         // Admin Fetch
         setLoading(true);
         let url = '/api/attendance/admin';
         if (date) url += `?date=${date}`;

         const res = await fetch(url);
         if (res.ok) {
            const data = await res.json();
            setAdminData(data.users);
            setSessionStatus(data.sessionStatus);
            if(date) setSelectedDate(data.date);
            else setSelectedDate(new Date().toISOString().split('T')[0]);
         }
      } else {
         // User Fetch
         const res = await fetch('/api/attendance');
         if (res.ok) {
           const data = await res.json();
           setTodayRecord(data.todayRecord);
           setHistory(data.history);
         }
      }
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
      try {
          const res = await fetch('/api/attendance/sessions');
          if (res.ok) {
              const data = await res.json();
              setReportSessions(data);
          }
      } catch (error) {
          console.error("Failed to fetch reports:", error);
      }
  };

  useEffect(() => {
    if (session) {
        if(activeTab === 'reports') {
            fetchReports();
        } else {
            // If switching back from reports to daily view, maybe reset to today?
            // For now, let's keep it simple. Initial load fetches today.
            if(activeTab !== 'reports' && !selectedDate) fetchData();
        }
    }
  }, [session, isAdmin, activeTab]);

  // Initial Load
  useEffect(() => {
      if(session) fetchData();
  }, [session]);


  // User Handlers
  const handleClockIn = async () => {
    setActionLoading(true);
    try {
       const res = await fetch('/api/attendance', {
          method: 'POST',
          body: JSON.stringify({ location: 'Main Terminal' }),
          headers: { 'Content-Type': 'application/json' }
       });
       const data = await res.json();
       if (!res.ok) throw new Error(data.error);
       
       toast.success("Clocked in successfully!");
       fetchData();
    } catch (error) {
       toast.error(error.message || "Failed to clock in");
    } finally {
       setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    try {
       const res = await fetch('/api/attendance', { method: 'PUT' });
       const data = await res.json();
       if (!res.ok) throw new Error(data.error);
       
       toast.success("Clocked out successfully!");
       fetchData();
    } catch (error) {
       toast.error(error.message || "Failed to clock out");
    } finally {
       setActionLoading(false);
    }
  };

  // Admin Handlers
  const toggleSession = async (type) => {
     if (type === 'complete' && !isConfirmModalOpen) {
         setConfirmAction({
             type: 'complete',
             title: 'Complete Attendance Session?',
             message: 'Are you sure you want to complete and lock today\'s attendance? This action cannot be undone.'
         });
         setIsConfirmModalOpen(true);
         return;
     }

     try {
        const today = new Date().toISOString().split('T')[0];
        const res = await fetch('/api/attendance/admin', {
           method: 'POST',
           body: JSON.stringify({ action: 'session_action', type, date: today }),
           headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        
        if (res.ok) {
           toast.success(data.message);
           setSessionStatus(data.session.status);
           setIsConfirmModalOpen(false);
        } else {
           toast.error(data.error);
        }
     } catch (error) {
        toast.error("Failed to update session");
     }
  };


  const markStatus = async (userId, status) => {
     if (sessionStatus !== 'Open') {
        toast.error("Attendance session is not Open.");
        return;
     }

     try {
        const res = await fetch('/api/attendance/admin', {
           method: 'POST',
           body: JSON.stringify({ userId, date: selectedDate, status }),
           headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.ok) {
           toast.success(`Marked as ${status}`);
           setAdminData(prev => prev.map(u => u._id === userId ? { ...u, status } : u));
        } else {
           const err = await res.json();
           toast.error(err.error || "Failed to update status");
        }
     } catch (error) {
        toast.error("Error updating status");
     }
  };

  const handlePrint = () => {
      window.print();
  };

  const formatDuration = (mins) => {
     if(!mins) return "0h 0m";
     const h = Math.floor(mins / 60);
     const m = mins % 60;
     return `${h}h ${m}m`;
  };

  const getStatusColor = (status) => {
      switch(status) {
         case 'Present': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
         case 'Late': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
         case 'On Duty': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
         case 'Absent': return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800';
         case 'Pending': return 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
         default: return 'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
      }
  };

  // --- ADMIN VIEW ---
  if (isAdmin) {
    const todayStr = selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Filter Data
    const filteredData = adminData.filter(user => {
       const userLower = user.name.toLowerCase();
       const searchLower = searchTerm.toLowerCase();
       return (userLower.includes(searchLower) || user.empCode?.toLowerCase().includes(searchLower)) && 
              (activeTab === 'all' || 
               (activeTab === 'p' && (user.status === 'Present' || user.status === 'On Duty')) ||
               (activeTab === 'l' && user.status === 'Late') ||
               (activeTab === 'a' && user.status === 'Absent') ||
               (activeTab === 'pending' && user.status === 'Pending'));
    });

    const stats = {
       total: adminData.length,
       present: adminData.filter(u => u.status === 'Present' || u.status === 'On Duty').length,
       late: adminData.filter(u => u.status === 'Late').length,
       absent: adminData.filter(u => u.status === 'Absent').length,
       pending: adminData.filter(u => u.status === 'Pending').length,
    };

    return (
       <div className="space-y-6">
          {/* Admin Header */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
             <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Monitor</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      sessionStatus === 'Open' ? 'bg-green-100 text-green-700' : 
                      sessionStatus === 'Closed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                   }`}>
                      Session: {sessionStatus}
                   </span>
                   <p className="text-sm text-gray-500">{todayStr}</p>
                </div>
             </div>
             
             {/* Action Buttons */}
             <div className="flex flex-wrap items-center gap-2">
                {activeTab !== 'reports' && (
                    <>
                        {sessionStatus !== 'Open' && sessionStatus !== 'Closed' && (
                        <button onClick={() => toggleSession('start')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm">
                            <Play className="h-4 w-4 fill-current" /> Start
                        </button>
                        )}
                        {sessionStatus === 'Open' && (
                        <button onClick={() => toggleSession('complete')} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm">
                            <Lock className="h-4 w-4" /> Complete
                        </button>
                        )}
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block"></div>
                        
                        <button onClick={() => setIsViewModalOpen(true)} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-gray-700 dark:text-gray-200 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm">
                        <Eye className="h-4 w-4" /> Sheet
                        </button>
                    </>
                )}
             </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>All Staff</button>
                <button onClick={() => setActiveTab('p')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${activeTab === 'p' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-emerald-50'}`}>Present</button>
                <button onClick={() => setActiveTab('l')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${activeTab === 'l' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-amber-50'}`}>Late</button>
                <button onClick={() => setActiveTab('a')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${activeTab === 'a' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-rose-50'}`}>Absent</button>
                <div className="w-px bg-gray-200 mx-1"></div>
                <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${activeTab === 'reports' ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    <FileText className="h-4 w-4 inline mr-2"/>
                    Logs & Reports
                </button>
           </div>

          {/* REPORTS TAB CONTENT */}
          {activeTab === 'reports' ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 min-h-[400px]">
                  <h3 className="text-lg font-bold mb-4">Attendance Logs History</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {reportSessions.map((sess) => (
                          <div key={sess._id} onClick={() => { setActiveTab('all'); fetchData(sess.date); }} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all group">
                              <div className="flex justify-between items-start mb-2">
                                  <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                                      {new Date(sess.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      sess.status === 'Open' ? 'bg-green-100 text-green-700' : 
                                      'bg-red-100 text-red-700'
                                   }`}>
                                      {sess.status}
                                   </span>
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                  <p>Started: {sess.startedBy?.name || 'Admin'}</p>
                                  <p>Closed: {sess.completedBy?.name || '-'}</p>
                              </div>
                              <div className="mt-3 text-right">
                                  <span className="text-xs font-bold text-[var(--primary)] group-hover:underline">View Report →</span>
                              </div>
                          </div>
                      ))}
                      {reportSessions.length === 0 && <p className="text-gray-500 col-span-full">No history found.</p>}
                  </div>
              </div>
          ) : (
            // MAIN ATTENDANCE TABLE CONTENT
            <>
                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                        <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase">Present</p>
                        <p className="text-xl font-bold text-emerald-600">{stats.present}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] text-amber-500 font-bold uppercase">Late</p>
                        <p className="text-xl font-bold text-amber-600">{stats.late}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                        <p className="text-[10px] text-rose-500 font-bold uppercase">Absent</p>
                        <p className="text-xl font-bold text-rose-600">{stats.absent}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                    type="text" 
                    placeholder="Search employee..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none w-full"
                    />
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Employee</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 hidden sm:table-cell">Shift</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 hidden sm:table-cell">Time</th>
                                <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                            {filteredData.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white max-w-[120px] truncate sm:max-w-none">{user.name}</p>
                                            <p className="text-[10px] text-gray-500">{user.designation}</p>
                                        </div>
                                    </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500 hidden sm:table-cell">{user.shift || 'A'}</td>
                                    <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(user.status)}`}>
                                        {user.status}
                                    </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500 hidden sm:table-cell">
                                    {user.clockIn ? new Date(user.clockIn).toLocaleTimeString([], { hour:'2-digit', minute: '2-digit' }) : '--:--'}
                                    </td>
                                    <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button disabled={sessionStatus !== 'Open'} onClick={() => markStatus(user._id, 'Present')} className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed" title="P">P</button>
                                        <button disabled={sessionStatus !== 'Open'} onClick={() => markStatus(user._id, 'Late')} className="h-8 w-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-colors border border-amber-100 disabled:opacity-50 disabled:cursor-not-allowed" title="L">L</button>
                                        <button disabled={sessionStatus !== 'Open'} onClick={() => markStatus(user._id, 'Absent')} className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white transition-colors border border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed" title="A">A</button>
                                    </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </div>
            </>
          )}

          {/* Confirmation Modal */}
          <AnimatePresence>
              {isConfirmModalOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
                      >
                          <div className="p-6">
                              <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
                                  <AlertTriangle className="h-6 w-6" />
                              </div>
                              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">{confirmAction?.title}</h3>
                              <p className="text-center text-sm text-gray-500 mb-6">{confirmAction?.message}</p>
                              
                              <div className="grid grid-cols-2 gap-3">
                                  <button onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors">
                                      Cancel
                                  </button>
                                  <button onClick={() => toggleSession('complete')} className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-rose-500/20">
                                      Confirm Complete
                                  </button>
                              </div>
                          </div>
                      </motion.div>
                  </div>
              )}
          </AnimatePresence>

          {/* Printable Modal (Unchanged) */}
          <AnimatePresence>
             {isViewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:absolute print:inset-0 print:bg-white print:z-[9999]">
                   <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden print:h-auto print:shadow-none print:max-w-none print:rounded-none"
                   >
                      <div className="p-4 border-b flex items-center justify-between bg-gray-50 print:hidden">
                         <h3 className="font-bold text-gray-900">Attendance Sheet View</h3>
                         <div className="flex gap-2">
                            <button onClick={handlePrint} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-800">
                               <Printer className="h-4 w-4" /> Print / Save PDF
                            </button>
                            <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-200 rounded-lg text-sm font-bold">
                               Close
                            </button>
                         </div>
                      </div>
                      
                      <div className="flex-1 overflow-auto bg-gray-100 p-8 print:p-0 print:bg-white print:overflow-visible">
                         <div id="printable-sheet" className="bg-white p-8 mx-auto shadow-sm max-w-[210mm] min-h-[297mm] text-black print:shadow-none print:w-full print:max-w-none print:p-0">
                            <div className="text-center mb-6">
                               <div className="flex justify-between items-start mb-4">
                                  <div className="text-[10px]">Page 1 of 1</div>
                                  <div className="text-[10px] text-right">{new Date().toLocaleString()}</div>
                               </div>
                               <h1 className="text-lg font-bold underline mb-1 uppercase tracking-wide">United Movement Contracting Company</h1>
                               <h2 className="text-md font-semibold mb-4 underline">List of all Acting Employees</h2>
                               
                               <div className="flex justify-between text-[11px] font-bold border-b-2 border-black pb-1 mb-2 mt-6">
                                  <span>Project: HAJJ TERMINAL JEDDAH</span>
                                  <span>Group: GROUP A</span>
                                  <span>Date: {todayStr}</span>
                               </div>
                            </div>
                            
                            <table className="w-full border-collapse border border-black text-[10px]">
                               <thead>
                                  <tr className="bg-gray-50">
                                     <th className="border border-black px-1 py-2 w-8 text-center">S.NO</th>
                                     <th className="border border-black px-2 py-2 text-left">NAME</th>
                                     <th className="border border-black px-1 py-2 w-16 text-center">EMP CODE</th>
                                     <th className="border border-black px-2 py-2 text-center">IQAMA NO</th>
                                     <th className="border border-black px-2 py-2 text-center">DESIGNATION</th>
                                     <th className="border border-black px-2 py-2 w-20 text-center">PASSPORT NO</th>
                                     <th className="border border-black px-2 py-2 w-16 text-center">SHIFT</th>
                                     <th className="border border-black px-2 py-2 w-16 text-center">ATTEND.</th>
                                  </tr>
                               </thead>
                               <tbody>
                                  {adminData.map((user, index) => (
                                     <tr key={user._id}>
                                        <td className="border border-black px-1 py-1.5 text-center">{index + 1}</td>
                                        <td className="border border-black px-2 py-1.5 font-semibold">{user.name}</td>
                                        <td className="border border-black px-1 py-1.5 text-center">{user.empCode || '-'}</td>
                                        <td className="border border-black px-2 py-1.5 text-center">{user.iqamaNumber || '-'}</td>
                                        <td className="border border-black px-2 py-1.5 text-center capitalize">{user.designation?.toLowerCase() || '-'}</td>
                                        <td className="border border-black px-2 py-1.5 text-center">{user.passportNumber || '-'}</td>
                                        <td className="border border-black px-2 py-1.5 text-center">{user.shift === 'A' ? 'NIGHT HT' : user.shift === 'B' ? 'MORNING HT' : 'NIGHT HT'}</td>
                                        <td className="border border-black px-2 py-1.5 text-center text-sm font-handwriting">
                                           {user.status === 'Present' || user.status === 'On Duty' ? 'P' : 
                                            user.status === 'Late' ? 'L' : 
                                            user.status === 'Absent' ? 'A' : ''}
                                        </td>
                                     </tr>
                                  ))}
                                  {Array.from({ length: Math.max(0, 15 - adminData.length) }).map((_, i) => (
                                     <tr key={`empty-${i}`}>
                                        <td className="border border-black px-1 py-1.5 text-center">&nbsp;</td>
                                        <td className="border border-black px-1 py-1.5">&nbsp;</td>
                                        <td className="border border-black px-1 py-1.5">&nbsp;</td>
                                        <td className="border border-black px-1 py-1.5">&nbsp;</td>
                                        <td className="border border-black px-1 py-1.5">&nbsp;</td>
                                        <td className="border border-black px-1 py-1.5">&nbsp;</td>
                                        <td className="border border-black px-1 py-1.5">&nbsp;</td>
                                        <td className="border border-black px-1 py-1.5">&nbsp;</td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>

                            <div className="mt-12 flex justify-between text-[11px] font-bold">
                               <div>Verified By: __________________________</div>
                               <div>Approved By: __________________________</div>
                            </div>
                         </div>
                      </div>
                   </motion.div>
                </div>
             )}
          </AnimatePresence>
          
          <style jsx global>{`
             @media print {
                body * {
                   visibility: hidden;
                }
                .print\\:block {
                   visibility: visible;
                }
                .print\\:absolute {
                    position: absolute;
                    left: 0;
                    top: 0;
                }
                #printable-sheet, #printable-sheet * {
                   visibility: visible;
                }
                #printable-sheet {
                   position: absolute;
                   left: 0;
                   top: 0;
                   width: 100%;
                   margin: 0;
                   padding: 20px;
                }
             }
          `}</style>
       </div>
    );
  }

  // --- USER VIEW ---
  // ... (Identical to previous User View code)
  const presents = history.filter(h => h.status === 'Present' || h.status === 'On Duty' || h.status === 'Late').length;
  const lates = history.filter(h => h.status === 'Late').length;
  const totalHours = history.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);

  return (
    <div className="space-y-8">
      
      {/* Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Clock In/Out Card */}
         <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="flex flex-col h-full justify-between">
               <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">My Duty Status</h3>
                  <div className="text-4xl font-black text-gray-900 dark:text-white font-mono tracking-tight">
                     {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <p className="text-sm font-medium text-gray-500 mt-1">
                     {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
               </div>

               <div className="mt-8">
                  {todayRecord?.clockOut ? (
                     <div className="w-full py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 text-center">
                        <p className="text-gray-500 font-medium">Shift Completed</p>
                        <p className="text-xs text-gray-400 mt-1">Total: {formatDuration(todayRecord.durationMinutes)}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Done for Today</span>
                     </div>
                  ) : todayRecord?.clockIn ? (
                     <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-gray-500">Started at:</span>
                           <span className="font-mono font-bold">{new Date(todayRecord.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <button 
                           onClick={handleClockOut}
                           disabled={actionLoading}
                           className="w-full py-4 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all"
                        >
                           {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Square className="h-5 w-5 fill-current" /> End Shift</>}
                        </button>
                        <p className="text-center text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                           <span className="relative flex h-2 w-2">
                             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                           </span>
                           Currently On Duty
                        </p>
                     </div>
                  ) : (
                     <div className="space-y-3">
                        <button 
                           onClick={handleClockIn}
                           disabled={actionLoading}
                           className="w-full py-4 bg-[var(--primary)] hover:bg-gray-800 active:scale-95 text-white rounded-2xl font-bold shadow-xl shadow-gray-900/10 flex items-center justify-center gap-2 transition-all"
                        >
                           {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Play className="h-5 w-5 fill-current" /> Start Shift</>}
                        </button>
                        <p className="text-center text-xs text-gray-400">Scheduled: 08:00 AM - 08:00 PM</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         {/* Summary Stats */}
         <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-3">
                   <Clock className="h-6 w-6" />
                </div>
                <h4 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{formatDuration(totalHours)}</h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Time (30 Days)</p>
             </div>
             
             <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center mb-3">
                   <CheckCircle className="h-6 w-6" />
                </div>
                <h4 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{presents}</h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Days Present</p>
             </div>

             <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center mb-3">
                   <AlertTriangle className="h-6 w-6" />
                </div>
                <h4 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{lates}</h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Late Arrivals</p>
             </div>
         </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
           <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
              <p className="text-sm text-gray-500">Your attendance status for the past month.</p>
           </div>
           <div className="flex gap-2">
              <button className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">Export CSV</button>
           </div>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                 <tr className="border-b border-gray-100 dark:border-gray-800 text-[11px] uppercase text-gray-400 font-bold tracking-wider">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Clock In</th>
                    <th className="px-6 py-4">Clock Out</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-center">Status</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                 {history.length === 0 ? (
                    <tr>
                       <td colSpan="6" className="px-6 py-12 text-center text-gray-500 text-sm">No attendance records found.</td>
                    </tr>
                 ) : history.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                       <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(record.date).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })}
                       </td>
                       <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                          {record.clockIn ? new Date(record.clockIn).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '-'}
                       </td>
                       <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                          {record.clockOut ? new Date(record.clockOut).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '-'}
                       </td>
                       <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {formatDuration(record.durationMinutes)}
                       </td>
                       <td className="px-6 py-4 text-xs font-medium text-gray-500">
                          <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {record.location}</div>
                       </td>
                       <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(record.status)}`}>
                             {record.status === 'Present' && <CheckCircle className="h-3 w-3" />}
                             {record.status === 'Late' && <Clock className="h-3 w-3" />}
                             {record.status}
                          </span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
