"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Calendar, Printer, X, ArrowRight, Save, Coins, Loader2, Eye, Trash2, Pen, Users
} from "lucide-react";
import toast from 'react-hot-toast';

export default function MoneyPage() {
  const { data: session } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  // React Hook Form
  const { register, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      shift: 'Day',
      revenue: {
        groupsDepartureAlfiyah: 0, groupsArrivalAlfiyah: 0,
        groupsDepartureRahman: 0, groupsArrivalRahman: 0,
        groupsDepartureBugis: 0, groupsArrivalBugis: 0,
        groupsArrivalIbrahim: 0, groupsDepartureIbrahim: 0,
        groupsDepartureGeneric: 0, groupsArrivalGeneric: 0,
        zamzam: 0, bZamzam: 0,
        passengerCollection: 0, porterCollection: 0, trolley: 0
      },
      adjustments: {
        crossShiftTrolleyReceipts: 0, crossShiftTrolleyPayments: 0,
        terminalExpenses: 0, fcUnexchangeable: 0
      },
      companySettlement: {
        groupsArrDepAlfiyah: 0, groupsArrDepBugis: 0,
        groupsArrDepRahman: 0, groupsArrDepIbrahim: 0
      },
      cashDenominations: {
         c500: 0, c200: 0, c100: 0, c50: 0, c20: 0, c10: 0, c5: 0, c2: 0, c1: 0
      },
      foreignCurrency: {
         kwd: { sar: 0 }, aed: { sar: 0 }, qar: { sar: 0 }, pkr: { sar: 0 },
         idr: { sar: 0 }, try: { sar: 0 }, usd: { sar: 0 }, other: { sar: 0 }
      },
      bankDeposit: 0, currencyDeposit: 0,
      staffStats: { totalEmp: 0, empAbsent: 0, empOnLeave: 0, empPresent: 0 }
    }
  });

  const formData = watch();

  // --- CALCULATIONS ---
  const rev = formData.revenue || {};
  const totalSalesAmount = Object.values(rev).reduce((acc, val) => acc + Number(val || 0), 0);
  const grossSalesAmount = totalSalesAmount + Number(formData.adjustments?.crossShiftTrolleyReceipts || 0);
  const adj = formData.adjustments || {};
  const deductions = Number(adj.crossShiftTrolleyPayments || 0) + Number(adj.terminalExpenses || 0) + Number(adj.fcUnexchangeable || 0);
  const netSalesAmount = grossSalesAmount - deductions;
  const laborPercent = formData.shift === 'Day' ? 0.45 : 0.55;
  const companyPercent = formData.shift === 'Day' ? 0.55 : 0.45;
  const laborAmount = netSalesAmount * laborPercent;
  const companyAmount = netSalesAmount * companyPercent;
  const compSet = formData.companySettlement || {};
  const totalArrivalDepartureCR = Object.values(compSet).reduce((acc, val) => acc + Number(val || 0), 0);
  const denoms = formData.cashDenominations || {};
  const totalCashDenom = 
    (Number(denoms.c500 || 0) * 500) + (Number(denoms.c200 || 0) * 200) +
    (Number(denoms.c100 || 0) * 100) + (Number(denoms.c50 || 0) * 50) +
    (Number(denoms.c20 || 0) * 20) + (Number(denoms.c10 || 0) * 10) +
    (Number(denoms.c5 || 0) * 5) + (Number(denoms.c2 || 0) * 2) + (Number(denoms.c1 || 0) * 1);
  const fc = formData.foreignCurrency || {};
  const totalForeignCashInSar = Object.values(fc).reduce((acc, val) => acc + Number(val?.sar || 0), 0);
  const totalBankAndCurrency = Number(formData.bankDeposit || 0) + Number(formData.currencyDeposit || 0);
  const netCashInHand = netSalesAmount - totalArrivalDepartureCR - totalBankAndCurrency;

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/sales');
      if (res.ok) setReports(await res.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const prepareFormData = (r) => {
      // Helper to safely extract nested values or default to 0/empty
      const v = (val) => val === undefined || val === null ? 0 : val;
      
      setValue("date", r.date ? new Date(r.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setValue("shift", r.shift || 'Day');
      
      // Revenue
      const rvn = r.revenue || {};
      Object.keys(rvn).forEach(k => setValue(`revenue.${k}`, v(rvn[k])));
      
      // Adjustments
      const ad = r.adjustments || {};
      Object.keys(ad).forEach(k => setValue(`adjustments.${k}`, v(ad[k])));
      
      // Company Settlement
      const cs = r.companySettlement || {};
      Object.keys(cs).forEach(k => setValue(`companySettlement.${k}`, v(cs[k])));

      // Cash Denoms
      const cd = r.cashDenominations || {};
      [500,200,100,50,20,10,5,2,1].forEach(d => setValue(`cashDenominations.c${d}`, v(cd[`c${d}`])));
      
      // Foreign Currency - Nested Structure Handling
      const fcur = r.foreignCurrency || {};
      ['kwd','aed','qar','pkr','idr','try','usd','other'].forEach(c => {
          // If structure is { kwd: { sar: 10 } } vs flattened
          const currencyObj = fcur[c];
          const val = currencyObj ? (currencyObj.sar || 0) : 0;
          setValue(`foreignCurrency.${c}.sar`, val);
      });

      setValue("bankDeposit", v(r.bankDeposit));
      setValue("currencyDeposit", v(r.currencyDeposit));
      
      const ss = r.staffStats || {};
      setValue("staffStats.totalEmp", v(ss.totalEmp));
      setValue("staffStats.empAbsent", v(ss.empAbsent));
      setValue("staffStats.empOnLeave", v(ss.empOnLeave));
      setValue("staffStats.empPresent", v(ss.empPresent));
  };

  const handleEdit = (report) => {
      setEditMode(true);
      setEditId(report._id);
      prepareFormData(report);
      setIsModalOpen(true);
      setCurrentStep(1);
  };

  const handleDelete = async (id) => {
      if(!confirm("Are you sure you want to delete this report?")) return;
      try {
          const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
          if(res.ok) {
              toast.success("Deleted");
              fetchReports();
          } else {
              toast.error("Failed to delete");
          }
      } catch(e) {
          toast.error("Error deleting");
      }
  };

  const fetchAttendanceStats = async () => {
    const date = formData.date;
    const toastId = toast.loading("Fetching attendance...");
    try {
        const res = await fetch(`/api/attendance/admin?date=${date}`);
        if(res.ok) {
            const data = await res.json();
            const users = data.users || [];
            if(users.length === 0) {
                toast.error("No attendance data found for this date", { id: toastId });
                return;
            }
            const total = users.length;
            const present = users.filter(u => ['Present', 'On Duty', 'Late', 'Half Day'].includes(u.status)).length;
            const absent = users.filter(u => u.status === 'Absent').length;
            const leave = users.filter(u => u.status === 'Leave' || u.status === 'On Leave').length;

            setValue('staffStats.totalEmp', total);
            setValue('staffStats.empPresent', present);
            setValue('staffStats.empAbsent', absent);
            setValue('staffStats.empOnLeave', leave);
            toast.success("Attendance fetched", { id: toastId });
        } else {
           toast.error("Failed to fetch", { id: toastId });
        }
    } catch(e) {
        toast.error("Error fetching", { id: toastId });
    }
 };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      totalSalesAmount, grossSalesAmount, netSalesAmount,
      distribution: { laborPercentage: laborPercent * 100, companyPercentage: companyPercent * 100, laborAmount, companyAmount },
      totalArrivalDepartureCR, totalBankAndCurrency, netCashInHand,
      cashDenominations: { ...data.cashDenominations, totalCash: totalCashDenom },
      foreignCurrency: { ...data.foreignCurrency, totalForeignCashInSar },
    };
    
    try {
      let res;
      if (editMode && editId) {
          res = await fetch(`/api/sales/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
          res = await fetch('/api/sales', { method: 'POST', body: JSON.stringify(payload) });
      }

      if(res.ok) {
        toast.success(editMode ? "Report Updated" : "Report Saved"); 
        setIsModalOpen(false); 
        reset(); 
        setEditMode(false); 
        setEditId(null); 
        setCurrentStep(1); 
        fetchReports();
      } else {
         toast.error("Failed");
      }
    } catch(e) { toast.error("Error"); }
  };

  const openPreview = (r) => { setSelectedReport(r); setIsPreviewOpen(true); };
  const openPrint = (r) => { setSelectedReport(r); setTimeout(() => window.print(), 300); };
  const openNew = () => { reset(); setEditMode(false); setEditId(null); setIsModalOpen(true); setCurrentStep(1); };

  const canEdit = session?.user?.role === 'Admin' || session?.user?.role === 'Cashier';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold dark:text-white">Daily Sales</h2><p className="text-gray-500 text-sm">Hajj Terminal</p></div>
        <button onClick={openNew} className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[var(--primary)]/90 transition-colors shadow-lg shadow-[var(--primary)]/30">
           <Plus className="h-5 w-5" /> New Report
        </button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)]" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((r) => (
                <div key={r._id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group relative">
                    <div className="flex justify-between mb-4">
                        <div>
                            <p className="font-bold text-lg dark:text-white">{new Date(r.date).toLocaleDateString()}</p>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 dark:text-gray-300">{r.shift} Shift</span>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => openPreview(r)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40" title="View"><Eye className="h-4 w-4" /></button>
                             <button onClick={() => openPrint(r)} className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Print"><Printer className="h-4 w-4" /></button>
                             {canEdit && (
                                <>
                                  <button onClick={() => handleEdit(r)} className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40" title="Edit"><Pen className="h-4 w-4" /></button>
                                  <button onClick={() => handleDelete(r._id)} className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                </>
                             )}
                        </div>
                    </div>
                    <div className="space-y-2 text-sm border-t border-gray-100 dark:border-gray-800 pt-3">
                        <div className="flex justify-between dark:text-gray-300"><span>Net Sales:</span> <span className="font-bold font-mono">{r.netSalesAmount?.toLocaleString()}</span></div>
                        <div className="flex justify-between dark:text-gray-300"><span>Cash In Hand:</span> <span className="font-bold font-mono">{r.netCashInHand?.toLocaleString()}</span></div>
                    </div>
                </div>
            ))}
        </div>
      )}

       {/* MODAL */}
       <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur p-4">
             <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] rounded-3xl flex flex-col border dark:border-gray-700 shadow-2xl">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between bg-white dark:bg-gray-900 rounded-t-3xl">
                   <h2 className="font-bold text-lg dark:text-white">{editMode ? 'Edit Report' : 'New Report'} - Step {currentStep}/4</h2>
                   <button onClick={() => setIsModalOpen(false)} className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded-full"><X className="h-5 w-5 text-gray-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950/50 custom-scrollbar">
                   <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {currentStep === 1 && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="font-bold border-b dark:border-gray-700 pb-2 dark:text-white">Basic Info</h3>
                                    <div className="flex gap-4">
                                        <input type="date" {...register("date")} className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold dark:text-white focus:ring-2 focus:ring-[var(--primary)] outline-none" />
                                        <select {...register("shift")} className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold dark:text-white focus:ring-2 focus:ring-[var(--primary)] outline-none"><option value="Day">Day Shift</option><option value="Night">Night Shift</option></select>
                                    </div>
                                    <h3 className="font-bold border-b dark:border-gray-700 pb-2 mt-4 dark:text-white">Revenue</h3>
                                    {['groupsDepartureAlfiyah','groupsArrivalAlfiyah','groupsDepartureRahman','groupsArrivalRahman','groupsDepartureBugis','groupsArrivalBugis','groupsArrivalIbrahim','groupsDepartureIbrahim','groupsDepartureGeneric','groupsArrivalGeneric'].map(k => (
                                        <div key={k} className="flex justify-between items-center"><label className="text-xs text-gray-600 dark:text-gray-400 font-medium">{k.replace(/([A-Z])/g, ' $1').trim()}</label><input type="number" {...register(`revenue.${k}`)} className="w-28 p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-right dark:text-white font-mono" /></div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-bold border-b dark:border-gray-700 pb-2 dark:text-white">Collections</h3>
                                    {['zamzam','bZamzam','passengerCollection','porterCollection','trolley'].map(k => (
                                        <div key={k} className="flex justify-between items-center"><label className="text-xs text-gray-600 dark:text-gray-400 font-medium">{k.replace(/([A-Z])/g, ' $1').trim()}</label><input type="number" {...register(`revenue.${k}`)} className="w-28 p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-right dark:text-white font-mono" /></div>
                                    ))}
                                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl text-center border border-gray-100 dark:border-gray-700 shadow-sm mt-4"><p className="text-xs text-gray-500 uppercase font-bold">Total Revenue</p><p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{totalSalesAmount.toLocaleString()}</p></div>
                                </div>
                            </div>
                        )}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-bold border-b dark:border-gray-700 pb-2 dark:text-white">Adjustments</h3>
                                        <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20"><label className="text-sm text-emerald-900 dark:text-emerald-300 font-bold">Cross Shift (+)</label><input type="number" {...register(`adjustments.crossShiftTrolleyReceipts`)} className="w-28 p-1.5 border border-emerald-200 dark:border-emerald-800 rounded text-right bg-white dark:bg-gray-900 dark:text-white font-bold" /></div>
                                        {['crossShiftTrolleyPayments','terminalExpenses','fcUnexchangeable'].map(k => (
                                            <div key={k} className="flex justify-between items-center p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/20"><label className="text-sm text-rose-900 dark:text-rose-300 font-medium">{k.replace(/([A-Z])/g, ' $1').trim()} (-)</label><input type="number" {...register(`adjustments.${k}`)} className="w-28 p-1.5 border border-rose-200 dark:border-rose-800 rounded text-right bg-white dark:bg-gray-900 dark:text-white" /></div>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-bold border-b dark:border-gray-700 pb-2 dark:text-white">Distribution</h3>
                                        <div className="bg-gray-900 dark:bg-white p-4 rounded-xl text-center shadow-lg mb-4">
                                            <p className="text-xs text-gray-400 dark:text-gray-600 uppercase font-bold">Net Sales Amount</p>
                                            <p className="text-3xl font-black text-white dark:text-gray-900">{netSalesAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex justify-between items-center"><span className="text-blue-900 dark:text-blue-100 font-bold text-sm">Labor ({Math.round(laborPercent*100)}%)</span><span className="font-mono font-bold text-blue-900 dark:text-white text-lg">{Math.round(laborAmount).toLocaleString()}</span></div>
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center"><span className="text-indigo-900 dark:text-indigo-100 font-bold text-sm">Company ({Math.round(companyPercent*100)}%)</span><span className="font-mono font-bold text-indigo-900 dark:text-white text-lg">{Math.round(companyAmount).toLocaleString()}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-bold border-b dark:border-gray-700 pb-2 dark:text-white">Settlement</h3>
                                        {['groupsArrDepAlfiyah','groupsArrDepBugis','groupsArrDepRahman','groupsArrDepIbrahim'].map(k => (
                                             <div key={k} className="flex justify-between items-center"><label className="text-xs text-gray-600 dark:text-gray-400 font-medium">{k.replace('groupsArrDep', '').trim()}</label><input type="number" {...register(`companySettlement.${k}`)} className="w-28 p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-right dark:text-white font-mono" /></div>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-bold border-b dark:border-gray-700 pb-2 dark:text-white">Cash Final</h3>
                                        <div className="flex justify-between items-center"><label className="text-gray-700 dark:text-gray-300 font-medium text-sm">Bank Deposit</label><input type="number" {...register('bankDeposit')} className="w-32 p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-right dark:text-white font-mono" /></div>
                                        <div className="flex justify-between items-center"><label className="text-gray-700 dark:text-gray-300 font-medium text-sm">Currency Deposit</label><input type="number" {...register('currencyDeposit')} className="w-32 p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-right dark:text-white font-mono" /></div>
                                        <div className="p-5 bg-gray-900 dark:bg-black text-white rounded-xl text-center shadow-lg mt-4 border border-gray-700">
                                            <p className="text-xs text-gray-400 uppercase font-bold text-[var(--primary)]">Net Cash In Hand</p>
                                            <p className="text-4xl font-black tracking-tight">{Math.round(netCashInHand).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-bold border-b dark:border-gray-700 pb-2 dark:text-white">Denominations</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[500,200,100,50,20,10,5,2,1].map(d => (
                                                <div key={d} className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded border border-gray-200 dark:border-gray-700"><span className="w-8 font-bold text-center text-gray-500 dark:text-gray-400 text-sm">{d}</span><input type="number" {...register(`cashDenominations.c${d}`)} className="w-full bg-transparent text-center font-bold outline-none text-gray-900 dark:text-white" placeholder="0" /></div>
                                            ))}
                                        </div>
                                        <p className="mt-3 font-bold text-gray-900 dark:text-white text-right border-t dark:border-gray-700 pt-2">Total: {Math.round(totalCashDenom).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-bold border-b dark:border-gray-700 pb-2 dark:text-white">Foreign (SAR)</h3>
                                        {['kwd','aed','qar','pkr','idr','try','usd','other'].map(c => (
                                             <div key={c} className="flex justify-between items-center mb-1.5 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"><label className="uppercase w-12 font-bold text-gray-500 text-sm">{c}</label><input type="number" {...register(`foreignCurrency.${c}.sar`)} className="w-full p-1 border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded text-right dark:text-white text-sm" placeholder="SAR" /></div>
                                        ))}
                                        <p className="mt-3 font-bold text-gray-900 dark:text-white text-right border-t dark:border-gray-700 pt-2">Total Foreign: {Math.round(totalForeignCashInSar).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                     <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold dark:text-white">Staff Stats</h3>
                                        <button 
                                            type="button"
                                            onClick={fetchAttendanceStats}
                                            className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-bold"
                                        >
                                            <Users className="h-3 w-3" /> Fetch Attendance
                                        </button>
                                     </div>
                                     <div className="grid grid-cols-4 gap-4">
                                        {['totalEmp','empAbsent','empOnLeave','empPresent'].map(k => (
                                            <div key={k}><label className="text-[10px] uppercase font-bold block mb-1 text-gray-500 dark:text-gray-400">{k.replace('emp','').replace('total','Total ')}</label><input type="number" {...register(`staffStats.${k}`)} className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-center font-bold text-gray-900 dark:text-white" /></div>
                                        ))}
                                     </div>
                                </div>
                            </div>
                        )}
                   </form>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between bg-white dark:bg-gray-900 rounded-b-3xl">
                   <button onClick={() => setCurrentStep(Math.max(1, currentStep-1))} disabled={currentStep===1} className="px-6 py-2 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors">Back</button>
                   {currentStep < 4 ? <button onClick={() => setCurrentStep(s=>s+1)} className="px-6 py-2 bg-[var(--primary)] text-white rounded-xl font-bold hover:brightness-110 flex items-center gap-2 shadow-lg shadow-[var(--primary)]/20 transition-all">Next <ArrowRight className="h-4 w-4" /></button> : <button onClick={handleSubmit(onSubmit)} className="px-8 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all"><Save className="h-4 w-4" /> {editMode ? 'Update Report' : 'Submit Report'}</button>}
                </div>
             </motion.div>
          </div>
        )}
       </AnimatePresence>

       {/* PREVIEW MODAL */}
       <AnimatePresence>
         {isPreviewOpen && selectedReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 print:hidden">
                <div className="bg-white text-black w-full max-w-[210mm] max-h-[90vh] overflow-y-auto rounded relative p-8">
                     <button onClick={() => setIsPreviewOpen(false)} className="absolute top-2 right-2 p-2 bg-gray-200 rounded-full hover:bg-red-100"><X className="h-4 w-4" /></button>
                     <PrintViewContent r={selectedReport} />
                </div>
            </div>
         )}
       </AnimatePresence>

       {/* PRINT VIEW */}
       {selectedReport && (
         <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-0 font-sans text-black overflow-hidden left-0 top-0 w-full h-full">
            <div className="w-[210mm] h-[297mm] mx-auto p-4 text-[11px] leading-tight relative"><PrintViewContent r={selectedReport} /></div>
         </div>
       )}

      <style jsx global>{`@media print { @page { margin: 0; size: A4; } body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: black !important; } }`}</style>
    </div>
  );
}

function PrintViewContent({ r }) {
    if(!r) return null;
    const safe = (v) => Number(v||0);
    const fmt = (v) => safe(v).toLocaleString();
    const fmtC = (v) => v ? safe(v).toLocaleString() : '';
    // Fix foreign total safely
    let foreignTotal = 0;
    if(r.foreignCurrency && typeof r.foreignCurrency === 'object') {
       // Check if nested style or flat
       Object.values(r.foreignCurrency).forEach(val => {
           if(typeof val === 'object' && val.sar) foreignTotal += safe(val.sar);
           else if (typeof val === 'number') foreignTotal += val; // fallback
       });
    }
    const cashTotal = safe(r.cashDenominations?.totalCash);
    const totalCashInSar = cashTotal + foreignTotal;

    return (
        <>
           <div className="text-center mb-1">
                 <h1 className="font-bold text-xl uppercase tracking-wider">United Movement Company Ltd</h1>
                 <h2 className="font-bold text-md">Daily Sales Report Hajj Terminal</h2>
                 <div className="flex justify-between px-0 font-bold mt-2 border-b-2 border-black pb-1">
                     <div className="flex gap-2 items-end"><span>Shift:</span> <span className="min-w-[120px] border-b border-dotted border-black px-2">{r.shift} Shift</span> <span className="uppercase ml-4">Night Shift</span></div>
                     <div className="flex gap-2 items-end"><span>Date:</span> <span className="min-w-[120px] border-b border-dotted border-black px-2 text-right">{new Date(r.date).toLocaleDateString()}</span></div>
                 </div>
           </div>
           <div className="flex border-2 border-black mt-2">
               {/* LEFT */}
               <div className="w-1/2 border-r-2 border-black flex flex-col">
                   <div className="bg-gray-300 font-bold text-center border-b border-black py-1">Cash Sales</div>
                   <div className="flex-1">
                       {[
                           ['Groups Departure ALFIYAH:', r.revenue?.groupsDepartureAlfiyah], ['Groups Arrival ALFIYAH:', r.revenue?.groupsArrivalAlfiyah],
                           ['Groups Departure RAHMAN:', r.revenue?.groupsDepartureRahman], ['Groups Arrival RAHMAN:', r.revenue?.groupsArrivalRahman],
                           ['Groups Departure BUGIS:', r.revenue?.groupsDepartureBugis], ['Groups Arrival BUGIS:', r.revenue?.groupsArrivalBugis],
                           ['Groups Arrival IBRAHIM:', r.revenue?.groupsArrivalIbrahim], ['Groups Departure IBRAHIM:', r.revenue?.groupsDepartureIbrahim],
                           ['Groups Departure:', r.revenue?.groupsDepartureGeneric], ['Groups Arrival:', r.revenue?.groupsArrivalGeneric],
                           ['Zamzam:', r.revenue?.zamzam], ['B. Zamzam:', r.revenue?.bZamzam],
                           ['Passenger Collection:', r.revenue?.passengerCollection], ['Porter Collection:', r.revenue?.porterCollection],
                           ['Trolley:', r.revenue?.trolley],
                       ].map(([l, v], i) => (
                           <div key={i} className="flex border-b border-black h-[18px] items-center text-[10px]">
                               <div className="w-[65%] px-1 truncate border-r border-black h-full flex items-center">{l}</div>
                               <div className="w-[35%] text-right px-1 font-mono font-bold flex items-center justify-end">{fmtC(v)}</div>
                           </div>
                       ))}
                       <div className="flex border-b border-black h-[18px] items-center bg-gray-200 font-bold text-[10px]">
                           <div className="w-[65%] text-right pr-2 px-1 border-r border-black h-full flex items-center justify-end">Total Sales Amount:</div>
                           <div className="w-[35%] text-right px-1 flex items-center justify-end">{fmt(r.totalSalesAmount)}</div>
                       </div>
                       <div className="flex border-b border-black h-[18px] items-center text-[10px]">
                           <div className="w-[65%] px-1 border-r border-black h-full flex items-center">Cross Shift Trolley Receipts</div>
                           <div className="w-[35%] text-right px-1 font-mono flex items-center justify-end">{fmtC(r.adjustments?.crossShiftTrolleyReceipts)}</div>
                       </div>
                       <div className="flex border-b border-black h-[18px] items-center bg-gray-200 font-bold text-[10px]">
                           <div className="w-[65%] text-right pr-2 px-1 border-r border-black h-full flex items-center justify-end">Gross Sales Amount:</div>
                           <div className="w-[35%] text-right px-1 flex items-center justify-end">{fmt(r.grossSalesAmount)}</div>
                       </div>
                       {[ ['Cross Shift Trolley Payments', r.adjustments?.crossShiftTrolleyPayments], ['Terminal Expenses', r.adjustments?.terminalExpenses], ['FC Un exchangeable', r.adjustments?.fcUnexchangeable] ].map(([l, v], i) => (
                           <div key={i} className="flex border-b border-black h-[18px] items-center text-[10px]">
                               <div className="w-[65%] px-1 border-r border-black h-full flex items-center">{l}</div>
                               <div className="w-[35%] text-right px-1 font-mono flex items-center justify-end">{fmtC(v)}</div>
                           </div>
                       ))}
                       <div className="flex border-b border-black h-[18px] items-center bg-gray-200 font-bold text-[10px]">
                           <div className="w-[65%] text-right pr-2 px-1 border-r border-black h-full flex items-center justify-end">Net Sales Amount:</div>
                           <div className="w-[35%] text-right px-1 flex items-center justify-end">{fmt(r.netSalesAmount)}</div>
                       </div>
                       <div className="flex border-b border-black h-[18px] items-center text-[10px]">
                           <div className="w-[65%] px-1 border-r border-black h-full flex items-center">Total Labour ({Math.round(r.distribution?.laborPercentage)}%):</div>
                           <div className="w-[35%] text-right px-1 font-mono flex items-center justify-end">{fmt(Math.round(r.distribution?.laborAmount))}</div>
                       </div>
                       <div className="flex border-b-2 border-black h-[18px] items-center text-[10px]">
                           <div className="w-[65%] px-1 border-r border-black h-full flex items-center">Company Payment ({Math.round(r.distribution?.companyPercentage)}%):</div>
                           <div className="w-[35%] text-right px-1 font-mono flex items-center justify-end">{fmt(Math.round(r.distribution?.companyAmount))}</div>
                       </div>
                       
                       <div className="bg-gray-300 font-bold text-center border-b border-black py-1 text-[10px]">Company Settlement</div>
                       {[['Groups ARR/DEP ALFIYAH:', r.companySettlement?.groupsArrDepAlfiyah], ['Groups ARR/DEP BUGIS:', r.companySettlement?.groupsArrDepBugis], ['Groups ARR/DEP RAHMAN:', r.companySettlement?.groupsArrDepRahman], ['Groups ARR/DEP IBRAHIM:', r.companySettlement?.groupsArrDepIbrahim]].map(([l, v], i) => (
                           <div key={i} className="flex border-b border-black h-[18px] items-center text-[10px]">
                               <div className="w-[65%] px-1 border-r border-black h-full flex items-center">{l}</div>
                               <div className="w-[35%] text-right px-1 font-mono flex items-center justify-end">{fmtC(v)}</div>
                           </div>
                       ))}
                       
                       <div className="flex border-b border-black h-[20px] items-center font-bold text-[10px]">
                           <div className="w-[65%] text-right pr-2 px-1 border-r border-black h-full flex items-center justify-end">Total Arrival/Departure CR.</div>
                           <div className="w-[35%] text-right px-1 flex items-center justify-end">{fmt(r.totalArrivalDepartureCR)}</div>
                       </div>
                       <div className="flex border-b border-black h-[20px] items-center font-bold text-[10px]">
                           <div className="w-[65%] text-right pr-2 px-1 border-r border-black h-full flex items-center justify-end">Total Bank & Currency</div>
                           <div className="w-[35%] text-right px-1 flex items-center justify-end">{fmt(r.totalBankAndCurrency)}</div>
                       </div>
                       <div className="flex h-[24px] items-center font-bold bg-gray-200 text-[10px]">
                           <div className="w-[65%] text-right pr-2 px-1 border-r border-black h-full flex items-center justify-end">Net Cash in Hand:</div>
                           <div className="w-[35%] text-right px-1 flex items-center justify-end">{fmt(r.netCashInHand)}</div>
                       </div>
                   </div>
               </div>

               {/* RIGHT */}
               <div className="w-1/2 flex flex-col font-sans">
                   <div className="bg-gray-300 font-bold text-center border-b border-black py-1 text-[10px]">Cash Denomination</div>
                   {/* Denoms */}
                   {[500,200,100,50,20,10,5,2,1].map(d => (
                       <div key={d} className="flex border-b border-black h-[22px] items-center text-[10px]">
                           <div className="w-14 border-r border-black text-center font-bold">{d}</div>
                           <div className="w-20 border-r border-black text-center font-handwriting text-blue-900 font-bold">{r.cashDenominations?.[`c${d}`] || ''}</div>
                           <div className="w-14 border-r border-black text-center text-gray-500 text-[9px]">SAR</div>
                           <div className="flex-1 text-right px-2 font-bold">{(r.cashDenominations?.[`c${d}`] || 0) > 0 ? ((r.cashDenominations?.[`c${d}`] || 0) * d).toLocaleString() : ''}</div>
                       </div>
                   ))}
                   <div className="bg-gray-200 font-bold text-center border-b border-black h-[24px] flex items-center justify-center text-[10px]">Total Cash</div>
                   
                   <div className="bg-gray-300 font-bold text-center border-b border-black py-1 text-[10px]">Foreign Currency</div>
                   {['KWD','AED','QAR','PKR','IDR','TRY'].map(c => (
                       <div key={c} className="flex border-b border-black h-[22px] items-center text-[10px]">
                           <div className="w-14 border-r border-black text-center font-bold">{c}</div>
                           <div className="w-20 border-r border-black text-center"></div>
                           <div className="w-14 border-r border-black text-center text-gray-500 text-[9px]">SAR</div>
                           <div className="flex-1 text-right px-2 font-bold">{r.foreignCurrency?.[c.toLowerCase()]?.sar || ''}</div>
                       </div>
                   ))}
                   
                   <div className="flex border-b border-black h-[24px] items-center font-bold text-[10px]">
                         <div className="w-1/2 text-center border-r border-black h-full flex items-center justify-center">Total Cash In SAR</div>
                         <div className="w-1/2 text-right px-2 h-full flex items-center justify-end">{fmt(totalCashInSar)}</div>
                   </div>
                   <div className="flex border-b border-black h-[22px] items-center text-[10px]">
                          <div className="w-14 px-1 border-r border-black h-full flex items-center">Bank:</div>
                          <div className="flex-1 border-r border-black h-full px-1 flex items-center justify-end font-mono">{fmtC(r.bankDeposit)}</div>
                   </div>
                   <div className="flex border-b-2 border-black h-[22px] items-center text-[10px]">
                          <div className="w-16 px-1 border-r border-black h-full flex items-center">Currency:</div>
                          <div className="flex-1 border-r border-black h-full px-1 flex items-center justify-end font-mono">{fmtC(r.currencyDeposit)}</div>
                   </div>
                   
                   <div className="bg-gray-300 font-bold text-center border-b border-black py-1 text-[10px]">Amount Received</div>
                   {['Arrival','Departure','Zamzam'].map((l,i)=><div key={i} className="flex border-b border-black h-[22px] items-center text-[10px]"><div className="w-1/2 px-2 border-r border-black font-bold text-left">{l}:</div><div className="w-14 border-r border-black text-center text-[9px] text-gray-500">SAR</div><div className="flex-1"></div></div>)}
                   <div className="flex border-b border-black h-[24px] items-center font-bold text-[10px]"><div className="w-1/2 px-2 border-r border-black text-left">Total Cash</div><div className="w-14 border-r border-black text-center text-[9px] text-gray-500">SAR</div><div className="flex-1"></div></div>
               </div>
           </div>
           
           <div className="mt-4 text-[10px] space-y-6">
                <div className="flex font-bold justify-between max-w-2xl">
                    <span>Total Emp: {r.staffStats?.totalEmp}</span> <span>Absent: {r.staffStats?.empAbsent}</span> <span>Leave: {r.staffStats?.empOnLeave}</span> <span>Present: {r.staffStats?.empPresent}</span>
                </div>
                <div className="grid grid-cols-2 gap-10">
                    <div className="flex justify-between items-end"><span>Submitted By:</span> <span className="border-b border-black flex-1 ml-2 text-center">{r.submittedBy?.name}</span></div>
                    <div className="flex justify-between items-end"><span>Signature:</span> <span className="border-b border-black flex-1 ml-2"></span></div>
                </div>
                <div className="grid grid-cols-2 gap-10">
                    <div className="flex justify-between items-end"><span>Received By:</span> <span className="border-b border-black flex-1 ml-2"></span></div>
                    <div className="flex justify-between items-end"><span>Signature:</span> <span className="border-b border-black flex-1 ml-2"></span></div>
                </div>
           </div>
        </>
    );
}
