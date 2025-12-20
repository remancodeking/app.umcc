"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Calendar, CheckCircle, XCircle, Users, Clock, Filter, 
  Trash2, Save, Loader2, ChevronLeft, ChevronRight,
  Search, CheckSquare, Square
} from "lucide-react";
import toast from "react-hot-toast";

export default function AttendancePage() {
  const { data: session } = useSession();
  
  // State
  // Default Date: Saudi Arabia (Asia/Riyadh)
  const getTodaySA = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
  const [selectedDate, setSelectedDate] = useState(getTodaySA());
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [records, setRecords] = useState([]); // Combined user + attendance
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, leave: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Filters
  const [filterShift, setFilterShift] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Data
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${selectedDate}&shift=${filterShift}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
        {/* Recalculate stats locally if needed or use API stats */}
        setStats(data.stats || { total: 0, present: 0, absent: 0, leave: 0 });
        setSelectedIds([]); 
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, filterShift]);

  // Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
        // Select all currently visible filtered records
        setSelectedIds(filteredRecords.map(r => r.user._id));
    } else {
        setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = async (status) => {
    if (selectedIds.length === 0) return toast.error("Select users first");
    
    if (!confirm(`Mark ${selectedIds.length} users as ${status}?`)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedIds,
          date: selectedDate,
          status: status,
          shift: filterShift !== 'All' ? filterShift : 'A' // Default to A if mixed
        })
      });

      if (res.ok) {
        toast.success(`Marked ${selectedIds.length} users as ${status}`);
        fetchAttendance();
      } else {
        toast.error("Failed to update");
      }
    } catch (err) {
      toast.error("Error updating attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLogs = async () => {
    if (selectedIds.length === 0) return toast.error("Select users first");
    if (!confirm(`Delete attendance logs for ${selectedIds.length} users?`)) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/attendance?date=${selectedDate}&ids=${selectedIds.join(',')}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success("Logs deleted");
        fetchAttendance();
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      toast.error("Error deleting logs");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSingleStatus = async (userId, status) => {
     try {
       // Optimistic Update
       setRecords(prev => prev.map(r => r.user._id === userId ? { ...r, attendance: { ...r.attendance, status } } : r));
       
       const res = await fetch('/api/attendance', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ userId, date: selectedDate, status })
       });
       
       if (!res.ok) {
         toast.error("Failed to update status");
         fetchAttendance(); // Revert
       } else {
         // Quiet success or update stats
         const data = await res.json();
         // Update real record with server response just in case
         setRecords(prev => prev.map(r => r.user._id === userId ? { ...r, attendance: data.record } : r));
       }
     } catch (e) {
       fetchAttendance();
     }
  };

  // Derived State
  const filteredRecords = records.filter(item => {
     const nameMatch = item.user.name.toLowerCase().includes(searchTerm.toLowerCase());
     const codeMatch = item.user.empCode?.toLowerCase().includes(searchTerm.toLowerCase());
     return nameMatch || codeMatch;
  });

  // Calculate quick stats for filtered view
  const presCount = filteredRecords.filter(r => r.attendance?.status === 'Present').length;
  const absCount = filteredRecords.filter(r => r.attendance?.status === 'Absent').length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto min-h-screen pb-20 space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
         <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Clock className="h-8 w-8 text-[var(--primary)]" />
              Daily Attendance
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Manage daily logs, shifts, and view analytics.</p>
         </div>

         {/* DATE CONTROL */}
         <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <button onClick={() => {
                 const d = new Date(selectedDate);
                 d.setDate(d.getDate() - 1);
                 setSelectedDate(d.toISOString().split('T')[0]);
             }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300"/>
             </button>
             
             <div className="relative">
                 <input 
                   type="date" 
                   value={selectedDate} 
                   onChange={(e) => setSelectedDate(e.target.value)}
                   className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl font-bold text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                 />
                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--primary)] pointer-events-none"/>
             </div>

             <button onClick={() => {
                 const d = new Date(selectedDate);
                 d.setDate(d.getDate() + 1);
                 setSelectedDate(d.toISOString().split('T')[0]);
             }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300"/>
             </button>
             
             <button onClick={() => setSelectedDate(getTodaySA())} className="ml-2 px-3 py-1.5 text-xs font-bold bg-[var(--primary)] text-white rounded-lg hover:bg-blue-700 transition-colors">
                Today
             </button>
         </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Staff</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Users className="h-6 w-6" />
              </div>
          </div>
          <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
              <div>
                  <p className="text-emerald-600/70 text-xs font-bold uppercase tracking-wider">Present</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{stats.present}</p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" />
              </div>
          </div>
          <div className="p-5 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-800 flex items-center justify-between">
              <div>
                  <p className="text-rose-600/70 text-xs font-bold uppercase tracking-wider">Absent</p>
                  <p className="text-2xl font-black text-rose-700 mt-1">{stats.absent}</p>
              </div>
              <div className="h-12 w-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
                  <XCircle className="h-6 w-6" />
              </div>
          </div>
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Selected</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{selectedIds.length}</p>
              </div>
              <div className="h-12 w-12 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center">
                  <CheckSquare className="h-6 w-6" />
              </div>
          </div>
      </div>

      {/* ACTION BAR */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-2 z-30">
          
          {/* Left: Search & Filter */}
          <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <input 
                      type="text" 
                      placeholder="Search employees..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-[var(--primary)]/20 text-sm font-medium"
                   />
              </div>
              <select 
                  value={filterShift} 
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl outline-none text-sm font-bold cursor-pointer hover:bg-gray-100 transition-colors"
              >
                  <option value="All">All Shifts</option>
                  <option value="A">Shift A</option>
                  <option value="B">Shift B</option>
              </select>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {selectedIds.length > 0 && (
                  <>
                    <button 
                        onClick={() => handleDeleteLogs()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors"
                        disabled={isSubmitting}
                    >
                         <Trash2 className="h-4 w-4" /> Delete Logs ({selectedIds.length})
                    </button>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                  </>
              )}
              
              <button 
                onClick={() => handleSelectAll({ target: { checked: true } })}
                className="btn-ghost text-xs hidden md:block" // Helper
              >Select All</button>

              <button 
                 onClick={() => handleBulkAction('Absent')}
                 disabled={isSubmitting || selectedIds.length === 0}
                 className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 active:scale-95 transition-all text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  Aapnsa All
              </button>
              <button 
                 onClick={() => handleBulkAction('Present')}
                 disabled={isSubmitting || selectedIds.length === 0}
                 className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  Paddin (Present)
              </button>
          </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
         {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                 <Loader2 className="h-10 w-10 animate-spin mb-4 text-[var(--primary)]" />
                 <p>Fetching records...</p>
             </div>
         ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-100 dark:border-gray-700 text-[11px] uppercase text-gray-500 font-bold sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 w-16 text-center">
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll}
                                    checked={filteredRecords.length > 0 && selectedIds.length === filteredRecords.length}
                                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
                                />
                            </th>
                            <th className="px-6 py-4">Employee Details</th>
                            <th className="px-6 py-4">Shift</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center text-gray-400">
                                    No employees found matching filters.
                                </td>
                            </tr>
                        ) : filteredRecords.map((item) => {
                            const status = item.attendance?.status;
                            const isSelected = selectedIds.includes(item.user._id);
                            
                            // Row Color Logic
                            let rowClass = "hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors";
                            if (isSelected) rowClass = "bg-blue-50/50 dark:bg-blue-900/10";
                            else if (status === 'Present') rowClass = "bg-emerald-50/30 dark:bg-emerald-900/5";
                            else if (status === 'Absent') rowClass = "bg-rose-50/30 dark:bg-rose-900/5";

                            return (
                                <tr key={item.user._id} className={rowClass}>
                                    <td className="px-6 py-4 text-center">
                                         <input 
                                            type="checkbox" 
                                            checked={isSelected} 
                                            onChange={() => handleSelectRow(item.user._id)}
                                            className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4 cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                                                {item.user.name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{item.user.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 rounded">{item.user.empCode}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-medium">{item.user.designation}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                                            (item.attendance?.shift || item.user.shift) === 'A' 
                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                            : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                                        }`}>
                                            SHIFT {(item.attendance?.shift || item.user.shift) || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                       <div className="flex justify-center">
                                           <div className="relative group/status">
                                               <select 
                                                   value={status || 'None'}
                                                   onChange={(e) => handleSingleStatus(item.user._id, e.target.value)}
                                                   className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border-2 outline-none cursor-pointer transition-all ${
                                                       status === 'Present' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                                                       status === 'Absent' ? 'bg-rose-50 border-rose-500 text-rose-700' :
                                                       status === 'Leave' ? 'bg-amber-50 border-amber-500 text-amber-700' :
                                                       'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                                   }`}
                                               >
                                                   <option value="None" disabled>Mark Status</option>
                                                   <option value="Present">Present</option>
                                                   <option value="Absent">Absent</option>
                                                   <option value="Leave">Leave</option>
                                                   <option value="On Duty">On Duty</option>
                                               </select>
                                               <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                   <div className={`w-2 h-2 rounded-full ${status === 'Present' ? 'bg-emerald-500' : status === 'Absent' ? 'bg-rose-500' : 'bg-gray-300'}`}></div>
                                               </div>
                                           </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {item.attendance ? (
                                            <span className="text-[10px] font-mono text-gray-400">
                                                LOGGED
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-gray-300 uppercase tracking-widest font-medium">Pending</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
         )}
      </div>

    </div>
  );
}
