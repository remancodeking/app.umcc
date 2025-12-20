"use client"

import { useState, useEffect } from "react";
import { 
  Briefcase, History, Calculator, Users, DollarSign, 
  Calendar, CheckCircle, AlertCircle, Scissors, X, Save, Printer, Eye,
  FileText, ScrollText, Trash2, Pencil
} from "lucide-react";
import toast from "react-hot-toast";
import SalarySlipsView from "@/components/salary/SalarySlipsView";
import PayrollSheetView from "@/components/salary/PayrollSheetView"; 
import { useSession } from "next-auth/react";

export default function SalaryManagementPage() {
  const { data: session } = useSession();
  
  // Robust Role Check (Case-insensitive)
  const role = session?.user?.role;
  const userShift = session?.user?.shift; // Shift: 'A', 'B', or string
  const isAdmin = ['admin', 'ground operation manager', 'supervisor'].includes(role?.toLowerCase());
  
  const [activeTab, setActiveTab] = useState("history"); // 'history' | 'manage' | 'sheets'
  const [loading, setLoading] = useState(true);

  // --- Tab 1 Data ---
  const [historyReports, setHistoryReports] = useState([]);
  const [viewReport, setViewReport] = useState(null); // Report for Slip View
  const [sheetReport, setSheetReport] = useState(null); // Report for Sheet View

  // --- Tab 2 Data ---
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split('T')[0]);
  const [employees, setEmployees] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [perHeadRate, setPerHeadRate] = useState(0); 
  
  // Edit Mode State
  const [editingReportId, setEditingReportId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deductionReason, setDeductionReason] = useState("Fine");
  const [deductionAmount, setDeductionAmount] = useState("");


  // --- Recovery Tab Data ---
  const [recoveries, setRecoveries] = useState([]);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [newRecovery, setNewRecovery] = useState({ userId: "", totalAmount: "", reason: "Loan" });
  const [allUsersList, setAllUsersList] = useState([]); // For dropdown

  useEffect(() => { fetchHistory(); fetchRecoveries(); }, []);

  const fetchRecoveries = async () => {
      try {
          const res = await fetch('/api/recovery');
          if(res.ok) setRecoveries(await res.json());
      } catch(e) {}
  };

  const fetchAllUsers = async () => {
      if(allUsersList.length > 0) return;
      try {
         // Re-use existing endpoint or Users API. We'll use /api/users
         const res = await fetch('/api/users'); 
         if(res.ok) setAllUsersList(await res.json());
      } catch(e) {}
  };

  useEffect(() => {
    if(activeTab === 'recovery') fetchAllUsers();
  }, [activeTab]);

  const handleCreateRecovery = async () => {
      if(!newRecovery.userId || !newRecovery.totalAmount || !newRecovery.reason) return toast.error("Fill all fields");
      try {
          const res = await fetch('/api/recovery', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(newRecovery)
          });
          if(res.ok) {
              toast.success("Recovery Added");
              setIsRecoveryModalOpen(false);
              setNewRecovery({ userId: "", totalAmount: "", reason: "Loan" });
              fetchRecoveries();
          } else {
              toast.error("Failed");
          }
      } catch(e) { toast.error("Error"); }
  };

  useEffect(() => {
    // Only fetch today's data if we are NOT editing an old report
    if (activeTab === 'manage' && !editingReportId) fetchTodayData();
  }, [activeTab, todayDate]);

  const fetchHistory = async () => {
      try {
          const res = await fetch('/api/salary');
          if (res.ok) setHistoryReports(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
  };

  const deleteReport = async (id) => {
      if(!confirm("Are you sure you want to delete this report permanently?")) return;
      try {
          const res = await fetch(`/api/salary/${id}`, { method: 'DELETE' });
          if(res.ok) {
              toast.success("Report deleted");
              fetchHistory();
          } else {
              toast.error("Failed to delete");
          }
      } catch(e) { toast.error("Error deleting"); }
  };

  const handleEdit = (report) => {
      if(employees.length > 0 && !editingReportId && !confirm("Unsaved changes in calculator will be lost. Load validation report?")) return;
      
      setEditingReportId(report._id);
      setTodayDate(report.date);
      setRevenue(report.totalRevenue);
      
      // Map records back to employee format for Calculator
      const mappedEmployees = report.records.map(r => ({
            _id: r.user, // User ID
            name: r.name,
            empCode: r.empCode,
            status: r.status,
            shift: r.shift,
            deductions: r.deductions || [],
            roomNumber: r.roomNumber
      }));
      
      setEmployees(mappedEmployees);
      setActiveTab('manage');
      toast.success("Report loaded for editing");
  };

  const fetchTodayData = async () => {
      setLoading(true);
      try {
          const res = await fetch(`/api/salary/today?date=${todayDate}`);
          if (res.ok) {
              const data = await res.json();
              setEmployees(data.employees.map(e => ({
                  ...e,
                  deductions: [], 
                  netAmount: 0,
                  // roomNumber included from API
                  autoRecovery: e.recovery || null // Store recovery info for auto-calc
              })));
              setRevenue(Number(data.recommendedRevenue || 0));
          }
      } catch (err) { toast.error("Failed to load today's data"); }
      finally { setLoading(false); }
  };

  // --- Calculations ---
  // Apply Shift Filtering Logic
  const filteredEmployees = employees.filter(e => {
        if (!userShift || userShift === 'All') return true;
        return e.shift === userShift;
  });

  const presentEmployeesAll = employees.filter(e => ['Present', 'On Duty'].includes(e.status));
  const presentCountAll = presentEmployeesAll.length;
  
  useEffect(() => {
      if (presentCountAll > 0) {
          const raw = revenue / presentCountAll;
          setPerHeadRate(Math.floor(raw)); 
      } else {
          setPerHeadRate(0);
      }
  }, [revenue, presentCountAll]);

  /* Auto-apply recovery when rate changes */
  useEffect(() => {
    if (perHeadRate > 0) {
       setEmployees(prev => prev.map(e => {
           // Only apply to Present employees with active recovery
           if (e.autoRecovery && ['Present', 'On Duty'].includes(e.status)) {
               const debt = e.autoRecovery.remainingAmount;
               // Default: Take up to 100% of daily salary, but not more than debt
               const amountToTake = Math.min(debt, perHeadRate);
               
               const reason = `Recovery: ${e.autoRecovery.reason}`;
               
               // Remove existing auto-recovery deduction to avoid duplicates/stale values
               const otherDeductions = e.deductions.filter(d => d.reason !== reason && !d.reason.startsWith('Recovery:'));
               
               if (amountToTake > 0) {
                   return {
                       ...e,
                       deductions: [
                           ...otherDeductions, 
                           { 
                               reason, 
                               amount: Math.floor(amountToTake), // Keep it integer if needed 
                               recoveryId: e.autoRecovery._id
                           }
                       ]
                   };
               }
           }
           return e;
       }));
    }
  }, [perHeadRate]); // Only re-run when base rate changes

  const surplus = (revenue - (perHeadRate * presentCountAll));

  const openDeductionModal = (emp) => {
      setSelectedEmployee(emp);
      setDeductionReason("Fine");
      setDeductionAmount(""); 
      setIsModalOpen(true);
  };

  const applyDeduction = () => {
      const amount = parseFloat(deductionAmount);
      if (isNaN(amount) || amount <= 0) return toast.error("Invalid amount");

      setEmployees(prev => prev.map(e => {
          if (e._id === selectedEmployee._id) {
              return {
                  ...e,
                  deductions: [...e.deductions, { reason: deductionReason, amount }]
              };
          }
          return e;
      }));
      setIsModalOpen(false);
      toast.success("Deduction applied");
  };
  
  const applyFullCut = () => {
      if (!selectedEmployee) return;
      setDeductionReason("Full Salary Cut");
      setDeductionAmount(perHeadRate.toString());
      
      setEmployees(prev => prev.map(e => {
          if (e._id === selectedEmployee._id) {
              return {
                  ...e,
                  deductions: [...e.deductions, { reason: "Full Salary Cut", amount: perHeadRate }]
              };
          }
          return e;
      }));
      setIsModalOpen(false);
      toast.success("Full Salary Cut Applied");
  };

  const removeDeduction = (empId, idx) => {
      setEmployees(prev => prev.map(e => {
          if (e._id === empId) {
              const newDeductions = [...e.deductions];
              newDeductions.splice(idx, 1);
              return { ...e, deductions: newDeductions };
          }
          return e;
      }));
  };

  const handleFinalize = async () => {
      const action = editingReportId ? "Update" : "Finalize";
      const confirmed = window.confirm(
          `Are you sure you want to ${action} this Salary Sheet?\n\nTotal Revenue: ${revenue}\nPaid Employees: ${presentCountAll}\nPer Head: ${perHeadRate}`
      );
      if (!confirmed) return;

      const payload = {
          date: todayDate,
          totalRevenue: revenue,
          totalPresent: presentCountAll,
          perHead: perHeadRate,
          surplus: Number(surplus.toFixed(2)),
          records: employees.map(e => {
              const totalDeductions = e.deductions.reduce((sum, d) => sum + d.amount, 0);
              const isActive = ['Present', 'On Duty'].includes(e.status);
              const base = isActive ? perHeadRate : 0;
              return {
                  user: e._id,
                  name: e.name,
                  empCode: e.empCode,
                  status: e.status,
                  shift: e.shift,
                  baseAmount: base,
                  deductions: e.deductions,
                  finalAmount: Math.max(0, base - totalDeductions),
                  roomNumber: e.roomNumber
              };
          }),
          status: 'Finalized'
      };

      try {
          let res;
          if (editingReportId) {
              res = await fetch(`/api/salary/${editingReportId}`, {
                  method: 'PUT',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(payload)
              });
          } else {
              res = await fetch('/api/salary', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify(payload)
              });
          }
          
          if (res.ok) {
              toast.success(editingReportId ? "Updated Successfully!" : "Saved Successfully!");
              fetchHistory();
              setEditingReportId(null);
              setActiveTab('history');
          } else {
              toast.error("Failed to save report");
          }
      } catch (err) { toast.error("Server Error"); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
       
       {/* Full Screen View Components */}
       {viewReport && (
          <SalarySlipsView report={viewReport} onClose={() => setViewReport(null)} />
       )}
       {sheetReport && (
          <PayrollSheetView report={sheetReport} onClose={() => setSheetReport(null)} />
       )}

       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
           <div>
               <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                   <Briefcase className="h-6 w-6 text-[var(--primary)]" /> Salary Management
               </h2>
               <p className="text-gray-500 text-sm">Daily distribution & deductions.</p>
           </div>
           
           <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
               <button onClick={() => { setActiveTab('history'); setEditingReportId(null); }} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 shadow-sm text-[var(--primary)] dark:text-white' : 'text-gray-500'}`}><History className="h-4 w-4" /> History</button>
               <button onClick={() => { setActiveTab('sheets'); setEditingReportId(null); }} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 ${activeTab === 'sheets' ? 'bg-white dark:bg-gray-700 shadow-sm text-[var(--primary)] dark:text-white' : 'text-gray-500'}`}><ScrollText className="h-4 w-4" /> Notebook</button>
               <button onClick={() => { setActiveTab('recovery'); setEditingReportId(null); }} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 ${activeTab === 'recovery' ? 'bg-white dark:bg-gray-700 shadow-sm text-[var(--primary)] dark:text-white' : 'text-gray-500'}`}><Scissors className="h-4 w-4" /> Recoveries</button>
               <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-lg text-sm font-bold flex gap-2 ${activeTab === 'manage' ? 'bg-white dark:bg-gray-700 shadow-sm text-[var(--primary)] dark:text-white' : 'text-gray-500'}`}><Calculator className="h-4 w-4" /> Calculator</button>
           </div>
       </div>

       {/* HISTORY TAB */}
       {activeTab === 'history' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
               {historyReports.map(report => {
                   // Calculate filter counts for display
                   let displayPaidCount = report.totalPresent;
                   if (userShift && userShift !== 'All') {
                       displayPaidCount = report.records.filter(r => r.shift === userShift && ['Present','On Duty'].includes(r.status)).length;
                   }

                   return (
                   <div key={report._id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative flex flex-col justify-between">
                       <div>
                           <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-2 text-gray-500 font-medium"><Calendar className="h-4 w-4" />{report.date}</div>
                               <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">{report.status}</span>
                           </div>
                           
                           {/* Admin Actions moved to avoid overlap with status/content */}
                           {isAdmin && (
                               <div className="absolute top-16 right-4 flex flex-col gap-2 z-10 transition-all opacity-80 hover:opacity-100">
                                   <button 
                                       onClick={() => handleEdit(report)}
                                       className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shadow-sm border border-blue-100"
                                       title="Edit Report"
                                   >
                                       <Pencil className="h-4 w-4" />
                                   </button>
                                   <button 
                                       onClick={() => deleteReport(report._id)}
                                       className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shadow-sm border border-red-100"
                                       title="Delete Report"
                                   >
                                       <Trash2 className="h-4 w-4" />
                                   </button>
                               </div>
                           )}

                           <div className="space-y-4">
                               <div><p className="text-sm text-gray-500">Revenue</p><p className="text-2xl font-black dark:text-white">SAR {Number(report.totalRevenue).toLocaleString()}</p></div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-[10px] text-gray-500 font-bold uppercase">Per Head</p><p className="text-lg font-bold text-[var(--primary)] dark:text-white">{report.perHead}</p></div>
                                   <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-xl"><p className="text-[10px] text-green-600 font-bold uppercase">Surplus</p><p className="text-lg font-bold text-green-700 dark:text-green-300">{Number(report.surplus).toFixed(2)}</p></div>
                               </div>
                           </div>
                       </div>
                       
                       {/* Footer - Separated Layout */}
                       <div className="pt-4 mt-2 border-t dark:border-gray-800 flex justify-between items-center">
                           <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                 {displayPaidCount} Paid {userShift && userShift !== 'All' ? `(${userShift})` : ''}
                              </span>
                           </div>
                           <button 
                               onClick={() => setViewReport(report)} 
                               className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-transform"
                           >
                               <Eye className="h-3 w-3" /> Slips
                           </button>
                       </div>
                   </div>
               )})}
           </div>
       )}
       
       {/* SHEETS (NOTEBOOK) TAB */}
       {activeTab === 'sheets' && (
           <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
               <div className="p-6 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                   <h3 className="font-bold flex items-center gap-2"><ScrollText className="h-5 w-5"/> Daily Ledger Records</h3>
                   <p className="text-xs text-gray-500">View salary records in notebook/ledger format.</p>
               </div>
               <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                       <thead className="bg-gray-100 dark:bg-gray-800 uppercase text-xs font-bold text-gray-500">
                           <tr>
                               <th className="px-6 py-4">Date</th>
                               <th className="px-6 py-4">Staff Count</th>
                               <th className="px-6 py-4">Revenue</th>
                               <th className="px-6 py-4">Per Head</th>
                               <th className="px-6 py-4 text-center">Action</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                           {historyReports.map(report => (
                               <tr key={report._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                   <td className="px-6 py-4 font-bold">{report.date}</td>
                                   <td className="px-6 py-4">{report.totalPresent}</td>
                                   <td className="px-6 py-4 font-mono">{report.totalRevenue}</td>
                                   <td className="px-6 py-4 font-mono">{report.perHead}</td>
                                   <td className="px-6 py-4 text-center">
                                       <button 
                                          onClick={() => setSheetReport(report)}
                                          className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase hover:underline"
                                       >
                                           View Notebook
                                       </button>
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
       )}

        {/* RECOVERY MANAGEMENT TAB */}
        {activeTab === 'recovery' && (
            <div className="space-y-6">
                 <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-900/20">
                     <div>
                         <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300">Financial Recoveries</h3>
                         <p className="text-sm text-purple-700 dark:text-purple-400">Manage loans, penalties, and automatic salary deductions.</p>
                     </div>
                     <button onClick={()=>setIsRecoveryModalOpen(true)} className="px-5 py-2.5 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                         <DollarSign className="h-4 w-4" /> Add New Recovery
                     </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {recoveries.map(rec => (
                         <div key={rec._id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm relative group">
                             {/* Progress Bar */}
                             <div className="absolute top-0 left-0 h-1.5 bg-gray-100 dark:bg-gray-800 w-full rounded-t-2xl overflow-hidden">
                                 <div 
                                    className={`h-full ${rec.status === 'Completed' ? 'bg-green-500' : 'bg-purple-500'}`} 
                                    style={{width: `${Math.min(100, ((rec.paidAmount||0)/rec.totalAmount)*100)}%`}}
                                 ></div>
                             </div>

                             <div className="flex justify-between items-start mb-4 mt-2">
                                 <div>
                                     <h4 className="font-bold text-lg dark:text-white">{rec.user?.name || 'Unknown User'}</h4>
                                     <p className="text-xs text-gray-500">{rec.user?.empCode}</p>
                                 </div>
                                 <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${rec.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                                     {rec.status}
                                 </span>
                             </div>

                             <div className="space-y-3">
                                 <div className="flex justify-between">
                                     <span className="text-xs text-gray-400 font-bold uppercase">Reason</span>
                                     <span className="text-sm font-bold dark:text-white">{rec.reason}</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span className="text-xs text-gray-400 font-bold uppercase">Total Owed</span>
                                     <span className="text-sm font-mono font-bold dark:text-white">{rec.totalAmount.toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between">
                                     <span className="text-xs text-gray-400 font-bold uppercase">Paid</span>
                                     <span className="text-sm font-mono font-bold text-green-600">{(rec.paidAmount||0).toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between pt-2 border-t dark:border-gray-800">
                                     <span className="text-xs text-gray-400 font-bold uppercase">Remaining</span>
                                     <span className="text-lg font-mono font-black text-rose-600">
                                         {Math.max(0, rec.totalAmount - (rec.paidAmount||0)).toLocaleString()}
                                     </span>
                                 </div>
                             </div>
                         </div>
                     ))}
                     {recoveries.length === 0 && (
                         <div className="col-span-full py-10 text-center text-gray-400 font-medium bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                             No active recoveries found.
                         </div>
                     )}
                 </div>
            </div>
        )}

        {/* RECOVERY MODAL */}
        {isRecoveryModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl p-6">
                     <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                         <DollarSign className="h-5 w-5"/> New Recovery Entry
                     </h3>
                     <div className="space-y-4">
                         <div>
                             <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee</label>
                             <select 
                                 value={newRecovery.userId} 
                                 onChange={(e) => setNewRecovery({...newRecovery, userId: e.target.value})}
                                 className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                             >
                                 <option value="">Select Employee...</option>
                                 {allUsersList.map(u => (
                                     <option key={u._id} value={u._id}>{u.name} ({u.empCode})</option>
                                 ))}
                             </select>
                         </div>
                         <div>
                             <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Reason</label>
                             <div className="flex flex-wrap gap-2 mb-2">
                                 {['Loan', 'Fine', 'Haram Work', 'Damage', 'Advance'].map(r => (
                                     <button key={r} onClick={()=>setNewRecovery({...newRecovery, reason: r})} className={`px-2 py-1 text-xs font-bold border rounded ${newRecovery.reason===r?'bg-purple-600 text-white border-purple-600':'text-gray-500 border-gray-200'}`}>{r}</button>
                                 ))}
                             </div>
                             <input 
                                 type="text" 
                                 value={newRecovery.reason} 
                                 onChange={(e) => setNewRecovery({...newRecovery, reason: e.target.value})}
                                 className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
                                 placeholder="Reason details..." 
                             />
                         </div>
                         <div>
                             <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Total Amount to Recover</label>
                             <input 
                                 type="number" 
                                 value={newRecovery.totalAmount} 
                                 onChange={(e) => setNewRecovery({...newRecovery, totalAmount: e.target.value})}
                                 className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-xl outline-none focus:ring-2 focus:ring-purple-500"
                                 placeholder="0.00" 
                             />
                         </div>
                         
                         <div className="pt-4 flex gap-2">
                             <button onClick={()=>setIsRecoveryModalOpen(false)} className="flex-1 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                             <button onClick={handleCreateRecovery} className="flex-1 py-2.5 font-bold bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700">Add Recovery</button>
                         </div>
                     </div>
                </div>
            </div>
        )}

       {/* MANAGE (CALCULATOR) TAB */}
       {activeTab === 'manage' && (
           <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 print:hidden">
               {editingReportId && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 mb-4 rounded-r shadow-sm flex justify-between items-center">
                         <div>
                            <p className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-2"><Pencil className="h-4 w-4"/> Editing Mode</p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">You are enforcing updates on an existing finalized report ({todayDate}).</p>
                         </div>
                         <button onClick={() => { setEditingReportId(null); fetchTodayData(); }} className="px-3 py-1 bg-white hover:bg-gray-100 text-amber-600 text-xs font-bold rounded shadow-sm border border-amber-200">Cancel Edit</button>
                    </div>
               )}
               
               {userShift && userShift !== 'All' && (
                   <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r shadow-sm">
                        <p className="text-blue-800 font-bold">Shift Filter Active: {userShift}</p>
                        <p className="text-xs text-blue-600">You are viewing only employees in your shift.</p>
                   </div>
               )}

               <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                       <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-500 uppercase">Total Revenue</label>
                           <input type="number" value={revenue} onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)} className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-3xl font-black dark:text-white focus:ring-2 focus:ring-[var(--primary)] outline-none" />
                       </div>
                       <div className="flex gap-4">
                           <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl"><div className="flex items-center gap-2 mb-1 text-blue-600"><Users className="h-4 w-4" /><span className="text-[10px] font-bold uppercase">Present (All)</span></div><p className="text-2xl font-black text-blue-700 dark:text-blue-300">{presentCountAll}</p></div>
                           <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Per Head</label><input type="number" value={perHeadRate} onChange={(e) => setPerHeadRate(parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-lg text-xl font-bold outline-none focus:border-[var(--primary)]" /></div>
                       </div>
                       <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl"><span className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Surplus</span><p className="text-3xl font-black text-green-600 dark:text-green-400">SAR {surplus.toFixed(2)}</p></div>
                   </div>
               </div>

               <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                   <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                       <h3 className="font-bold">Employee List {userShift && userShift !== 'All' ? `(${userShift})` : ''}</h3>
                       <div className="flex gap-2"><input type="date" value={todayDate} onChange={(e) => setTodayDate(e.target.value)} className="bg-transparent font-bold text-sm outline-none dark:text-white" /></div>
                   </div>
                   <div className="overflow-x-auto">
                       <table className="w-full text-left">
                           <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] text-gray-500 uppercase font-bold">
                               <tr><th className="px-6 py-3">Details</th><th className="px-6 py-3">Room</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Shift</th><th className="px-6 py-3">Rate</th><th className="px-6 py-3">Deductions</th><th className="px-6 py-3 text-right sticky right-0 bg-white dark:bg-gray-800 shadow-xl">Net</th><th className="px-6 py-3 text-center">Action</th></tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                               {filteredEmployees.map(emp => {
                                   const isPresent = ['Present', 'On Duty'].includes(emp.status);
                                   const totalDeductions = emp.deductions.reduce((sum, d) => sum + d.amount, 0);
                                   const netAmount = isPresent ? Math.max(0, perHeadRate - totalDeductions) : 0;
                                   return (
                                       <tr key={emp._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${!isPresent ? 'bg-gray-50/50 opacity-60' : ''}`}>
                                           <td className="px-6 py-3"><p className="font-bold dark:text-white">{emp.name}</p><p className="text-xs text-gray-400">{emp.empCode}</p></td>
                                           <td className="px-6 py-3"><span className="font-bold bg-black text-white px-2 py-1 rounded text-xs">{emp.roomNumber || 'N/A'}</span></td>
                                           <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isPresent ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>{emp.status}</span></td>
                                           <td className="px-6 py-3"><span className="text-xs font-bold text-gray-500">{emp.shift || '-'}</span></td>
                                           <td className="px-6 py-3 font-mono font-bold text-gray-500">{isPresent ? perHeadRate : '-'}</td>
                                           <td className="px-6 py-3 flex flex-wrap gap-1">{emp.deductions.map((d,i)=><span key={i} className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded flex items-center gap-1">{d.amount}<X onClick={()=>removeDeduction(emp._id, i)} className="h-3 w-3 cursor-pointer hover:scale-125" /></span>)}</td>
                                           <td className="px-6 py-3 text-right font-black text-lg dark:text-white sticky right-0 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.05)]">{isPresent ? netAmount : '-'}</td>
                                           <td className="px-6 py-3 text-center">{isPresent && <button onClick={()=>openDeductionModal(emp)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Scissors className="h-4 w-4" /></button>}</td>
                                       </tr>
                                   )
                               })}
                           </tbody>
                       </table>
                   </div>
                   <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end">
                       <button onClick={handleFinalize} className="px-6 py-3 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold rounded-xl shadow-lg flex items-center gap-2 hover:-translate-y-1 transition-transform">
                           <Save className="h-4 w-4" /> {editingReportId ? "Update Report" : "Finalize Sheet"}
                       </button>
                   </div>
               </div>
           </div>
       )}

       {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
               <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl p-6">
                   <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Scissors className="h-5 w-5 text-red-500"/> Apply Cut</h3>
                   <div className="space-y-4">
                       <div><label className="text-[10px] font-bold text-gray-500 uppercase">Employee</label><p className="font-bold text-lg">{selectedEmployee?.name}</p></div>
                       <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Reason</label><div className="flex gap-2">{['Fine','Recovery','Advance'].map(r=><button key={r} onClick={()=>setDeductionReason(r)} className={`px-2 py-1 text-xs font-bold border rounded ${deductionReason===r?'bg-black text-white':'text-gray-500'}`}>{r}</button>)}</div></div>
                       <div><label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Amount</label><input type="number" autoFocus value={deductionAmount} onChange={(e)=>setDeductionAmount(e.target.value)} className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold text-xl outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="0" /></div>
                       
                        <button onClick={applyFullCut} className="w-full py-2 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors uppercase text-xs flex items-center justify-center gap-2">
                             <AlertCircle className="h-4 w-4" /> Full Salary Cut (Set to 0)
                        </button>

                       <div className="flex gap-2 pt-2 border-t dark:border-gray-800 mt-2">
                            <button onClick={()=>setIsModalOpen(false)} className="flex-1 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-xl">Cancel</button>
                            <button onClick={applyDeduction} className="flex-1 py-2 font-bold bg-red-500 text-white rounded-xl shadow-lg hover:bg-red-600">Apply</button>
                       </div>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}