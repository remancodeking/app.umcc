"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Users, CheckCircle, AlertCircle, Briefcase, DollarSign, Printer, Search, ArrowRight, ChevronLeft, ChevronRight, Calendar, FileText, ScrollText, X 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import ReceiptTemplate from "@/components/salary/ReceiptTemplate";
import PayrollSummarySheet from "@/components/salary/PayrollSummarySheet";
import { useSession } from "next-auth/react";

export default function DisbursementPage() {
  const { data: session } = useSession();
  const userShift = session?.user?.shift; 

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  
  // Date State - Default to today or latest found
  const [currentDate, setCurrentDate] = useState(null); 
  const [displayDate, setDisplayDate] = useState(""); // For UI display

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [receiverId, setReceiverId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  
  // Print State
  const [printData, setPrintData] = useState(null);
  const [summaryPrintData, setSummaryPrintData] = useState(null);
  
  const printComponentRef = useRef();
  const summaryRef = useRef();

  const handlePrint = useReactToPrint({
      content: () => printComponentRef.current,
      onAfterPrint: () => setPrintData(null) // Clear after print
  });
  
  const handlePrintSummary = useReactToPrint({
      content: () => summaryRef.current,
      onAfterPrint: () => setSummaryPrintData(null)
  });

  // Auto-print when printData is set
  useEffect(() => {
     if(printData) {
         document.title = `Receipt_${printData.receiptId}`;
         handlePrint();
     }
  }, [printData]);

  useEffect(() => {
      if(summaryPrintData) {
          document.title = `Payroll_Sheet_${displayDate}`;
          handlePrintSummary();
      }
  }, [summaryPrintData]);

  const fetchData = async (date = null) => {
    setLoading(true);
    try {
      let url = "/api/salary/disbursement";
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (userShift && userShift !== 'All') params.append('shift', userShift);
      
      const res = await fetch(`${url}?${params.toString()}`);
      
      if (res.ok) {
          const json = await res.json();
          setData(json);
          if(json && json.date) {
            const reportDate = json.date.split('T')[0]; 
            setCurrentDate(reportDate);
            setDisplayDate(reportDate);
          } else {
              setData(null);
              if(date) setCurrentDate(date);
          }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load disbursement data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
      // Only fetch if session is loaded to ensure we have the shift
      if (session) fetchData(); 
  }, [session]);

  const changeDate = (days) => {
      const baseDate = currentDate ? new Date(currentDate) : new Date();
      baseDate.setDate(baseDate.getDate() + days);
      const newDate = baseDate.toISOString().split('T')[0];
      setDisplayDate(newDate); 
      setCurrentDate(newDate);
      fetchData(newDate);
  };
  
  const handleDateSelect = (e) => {
      const newDate = e.target.value;
      setDisplayDate(newDate);
      setCurrentDate(newDate);
      fetchData(newDate);
  }

  const generateSummarySheet = () => {
      if(!data) return;
      setSummaryPrintData({
          report: data,
          rooms: data.rooms
      });
  };

  const openPaymentModal = (room) => {
      setSelectedRoom(room);
      setReceiverId(""); // Reset
  };

  const confirmPayment = async () => {
      if(!receiverId) return toast.error("Please select who is receiving the cash");

      setProcessing(true);
      try {
          const res = await fetch('/api/salary/disbursement', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                  reportId: data._id,
                  roomNumber: selectedRoom.roomNumber,
                  receiverId,
                  totalAmount: selectedRoom.totalAmount
              })
          });

          if(res.ok) {
             const result = await res.json();
             toast.success("Payment Confirmed");
             
             // 1. Prepare Print Data
             const receiver = selectedRoom.employees.find(e => (e.user._id || e.user) === receiverId) || { name: result.receiverName };
             
             // Auto-print disabled as per request
             // setPrintData({...});
             
             // 2. Refresh Data
             fetchData(currentDate);
             setSelectedRoom(null); // Close Modal
          } else {
              toast.error("Payment Failed");
          }
      } catch (err) {
          toast.error("Error processing payment");
      } finally {
          setProcessing(false);
      }
  };

  // Filter Rooms
  const filteredRooms = data?.rooms?.filter(r => 
      r.roomNumber && r.roomNumber.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (loading && !data) return <div className="p-10 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Hidden Print Components */}
      <div className="hidden">
           <ReceiptTemplate ref={printComponentRef} data={printData} />
           <PayrollSummarySheet ref={summaryRef} data={summaryPrintData} />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-[var(--primary)]" /> Salary Disbursement
          </h2>
          <p className="text-gray-500 text-sm mt-1">
             Manage room payments and generate receipts.
          </p>
        </div>

        {/* Date Navigation & Summary Button */}
        <div className="flex gap-2">
            <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ChevronLeft className="h-4 w-4"/></button>
                <div className="border-l border-r border-gray-100 dark:border-gray-700 px-4 flex items-center font-bold gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <input
                        type="date"
                        value={displayDate || ''}
                        onChange={handleDateSelect}
                        className="bg-transparent outline-none cursor-pointer text-sm font-bold dark:text-white" 
                    />
                </div>
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><ChevronRight className="h-4 w-4"/></button>
            </div>
            
            {data && (
                <button 
                  onClick={generateSummarySheet}
                  className="bg-black text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-gray-800 transition-colors"
                  title="Print Daily Summary Sheet"
                >
                    <FileText className="h-4 w-4" /> Sheet
                </button>
            )}
        </div>

        <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
             <input 
                type="text" 
                placeholder="Search Room..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-[var(--primary)]"
             />
        </div>
      </div>

      {!data && !loading ? (
           <div className="p-20 text-center bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
               <div className="inline-flex p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4"><Calendar className="h-8 w-8 text-gray-300"/></div>
               <h3 className="text-xl font-bold text-gray-400">No Finalized Salary Sheet</h3>
               <p className="text-gray-500 text-sm mt-2">There is no approved report for <span className="text-black dark:text-white font-bold">{displayDate}</span>.</p>
           </div>
      ) : filteredRooms.length === 0 ? (
           <div className="p-20 text-center bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
               <div className="inline-flex p-4 bg-gray-50 dark:bg-gray-800 rounded-full mb-4"><Users className="h-8 w-8 text-gray-300"/></div>
               <h3 className="text-xl font-bold text-gray-400">No disbursements found</h3>
               <p className="text-gray-500 text-sm mt-2">
                   {search ? "No rooms match your search." : "There are no payable rooms for your shift in this report."}
               </p>
           </div>
      ) : (
          <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                      <p className="text-xs font-bold text-gray-400 uppercase">Total Payable</p>
                      <div className="flex justify-between items-end">
                          <p className="text-2xl font-black text-gray-900 dark:text-white">
                              {filteredRooms.reduce((acc, r) => acc + r.totalAmount, 0).toLocaleString()}
                          </p>
                          <DollarSign className="h-5 w-5 text-gray-300" />
                      </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-800 shadow-sm flex flex-col justify-between">
                      <p className="text-xs font-bold text-green-600 uppercase">Total Paid</p>
                      <div className="flex justify-between items-end">
                           <p className="text-2xl font-black text-green-700 dark:text-green-300">
                               {filteredRooms.filter(r => r.isPaid).reduce((acc, r) => acc + r.totalAmount, 0).toLocaleString()}
                           </p>
                           <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                      <p className="text-xs font-bold text-gray-400 uppercase">Total Staff</p>
                      <div className="flex justify-between items-end">
                          <p className="text-2xl font-black text-gray-900 dark:text-white">
                              {filteredRooms.reduce((acc, r) => acc + r.employees.length, 0)}
                          </p>
                          <Users className="h-5 w-5 text-gray-300" />
                      </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                      <p className="text-xs font-bold text-gray-400 uppercase">Paid Staff</p>
                      <div className="flex justify-between items-end">
                          <p className="text-2xl font-black text-gray-900 dark:text-white">
                              {filteredRooms.filter(r => r.isPaid).reduce((acc, r) => acc + r.employees.length, 0)}
                          </p>
                          <Users className="h-5 w-5 text-green-500" />
                      </div>
                  </div>
              </div>

              {/* Grid - 3 Columns Enforced as requested */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRooms.map((room) => (
                     <div key={room.roomNumber} className={`relative p-6 rounded-2xl border transition-all flex flex-col justify-between min-h-[300px] ${
                         room.isPaid 
                         ? 'bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-900 border-green-200 dark:border-green-800 shadow-sm' 
                         : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-xl'
                     }`}>
                        <div className="mb-4">
                            {room.isPaid && (
                                <div className="absolute top-4 right-4 animate-in zoom-in">
                                    <div className="bg-green-500 text-white p-1 rounded-full shadow-lg shadow-green-500/30"><CheckCircle className="h-5 w-5"/></div>
                                </div>
                            )}
                            
                            <div className="flex items-baseline gap-2 mb-2">
                                <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Room</h3>
                                <p className="text-4xl font-black dark:text-white">{room.roomNumber}</p> 
                            </div>
        
                            {/* Employee List - Showing 'dots' */}
                            <div className="space-y-1 mb-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Occupants ({room.employees.length})</p>
                                <div className="grid grid-cols-1 gap-1">
                                    {room.employees.map((e, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs font-bold p-1 hover:bg-black/5 rounded">
                                            <span className="truncate">{e.name.split(' ')[0]} {e.name.split(' ')[1] || ''}</span>
                                            <span className="text-gray-400 font-mono text-[10px]">{e.empCode}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
    
                        <div>
                            <div className="flex justify-between items-end mb-4 border-t border-dashed pt-4 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-400 uppercase">Total Payout</p>
                                <p className={`text-2xl font-black ${room.isPaid ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                    {Number(room.totalAmount).toLocaleString()} <span className="text-xs font-normal text-gray-400">SAR</span>
                                </p>
                            </div>
        
                            {room.isPaid ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                                        <span className="uppercase">Received By:</span>
                                        <span className="truncate">{room.receiverName}</span>
                                    </div>
                                    <button onClick={() => {
                                         setPrintData({
                                             receiptId: room.receiptId,
                                             date: room.paidAt,
                                             roomNumber: room.roomNumber,
                                             receiverName: room.receiverName,
                                             employees: room.employees,
                                             totalAmount: room.totalAmount,
                                             adminName: session?.user?.name || 'Admin'
                                         });
                                    }} className="w-full py-2 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 text-sm">
                                         <Printer className="h-3 w-3" /> Receipt
                                    </button>
                                </div>
                            ) : (
                                <button 
                                   onClick={() => openPaymentModal(room)}
                                   className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:-translate-y-1 transition-transform flex items-center justify-center gap-2 text-sm"
                                >
                                   Disburse Pay <ArrowRight className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                     </div>
                  ))}
              </div>
          </div>
      )}

      {/* NOTEBOOK VIEW MODAL */}
      <AnimatePresence>
        {isNotebookOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur p-4 print:p-0 print:bg-white print:static">
                <motion.div 
                    initial={{opacity:0, scale:0.95}} 
                    animate={{opacity:1, scale:1}} 
                    exit={{opacity:0, scale:0.95}} 
                    className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl flex flex-col border dark:border-gray-800 shadow-2xl print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full print:h-full"
                >
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 rounded-t-3xl print:border-b-2 print:border-black">
                        <div>
                            <h2 className="font-bold text-xl dark:text-white flex items-center gap-2"><ScrollText className="h-5 w-5"/> Disbursement Log</h2>
                            <p className="text-gray-500 text-sm">{displayDate} - {userShift && userShift !== 'All' ? `Shift ${userShift}` : 'All Shifts'}</p>
                        </div>
                        <div className="flex gap-2 print:hidden">
                            <button onClick={()=>window.print()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Printer className="h-5 w-5 text-gray-500"/></button>
                            <button onClick={()=>setIsNotebookOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="h-5 w-5 text-gray-500"/></button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950/50 print:bg-white print:p-0">
                         {/* This table is not the one user complained about, but I'll ensure it renders nicely */}
                         <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase font-bold text-xs sticky top-0 print:static print:bg-gray-200 print:text-black">
                                <tr>
                                    <th className="px-4 py-3 border dark:border-gray-700 print:border-black">SN</th>
                                    <th className="px-4 py-3 border dark:border-gray-700 print:border-black">Receiver Name</th>
                                    <th className="px-4 py-3 border dark:border-gray-700 print:border-black">Room Number</th>
                                    <th className="px-4 py-3 border dark:border-gray-700 print:border-black">Time</th>
                                    <th className="px-4 py-3 border dark:border-gray-700 print:border-black text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {data?.rooms?.filter(r => r.isPaid).length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-bold">No disbursements recorded yet.</td></tr>
                                ) : (
                                    data?.rooms?.filter(r => r.isPaid).map((r, i) => (
                                        <tr key={i} className="hover:bg-white dark:hover:bg-gray-900 border-b border-gray-100 dark:border-gray-800 print:border-black">
                                            <td className="px-4 py-2 border dark:border-gray-700 print:border-black font-mono font-bold w-12 text-center">{i + 1}</td>
                                            <td className="px-4 py-2 border dark:border-gray-700 print:border-black font-bold">{r.receiverName || 'Unknown'}</td>
                                            <td className="px-4 py-2 border dark:border-gray-700 print:border-black text-center">{r.roomNumber}</td>
                                            <td className="px-4 py-2 border dark:border-gray-700 print:border-black font-mono text-gray-500 print:text-black">{r.paidAt ? new Date(r.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                            <td className="px-4 py-2 border dark:border-gray-700 print:border-black text-right font-bold w-32">{Number(r.totalAmount).toLocaleString()} SAR</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {data?.rooms?.some(r=>r.isPaid) && (
                                <tfoot className="bg-gray-50 dark:bg-gray-900 font-bold print:bg-gray-100">
                                    <tr>
                                        <td colSpan="4" className="px-4 py-3 border dark:border-gray-700 print:border-black text-right uppercase">Total Disbursed</td>
                                        <td className="px-4 py-3 border dark:border-gray-700 print:border-black text-right">{data.rooms.filter(r=>r.isPaid).reduce((sum, r)=>sum+r.totalAmount,0).toLocaleString()} SAR</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
              <div className="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b dark:border-gray-800 bg-gray-50 dark:bg-black/20 shrink-0">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                          Payment Confirmation <span className="text-gray-400 text-sm font-normal">Room {selectedRoom.roomNumber}</span>
                      </h2>
                  </div>
                  
                  <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-900/20">
                          <div>
                              <p className="text-xs font-bold text-blue-600 uppercase mb-1">Total Payable Amount</p>
                              <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{Number(selectedRoom.totalAmount).toLocaleString()} SAR</p>
                          </div>
                          <DollarSign className="h-8 w-8 text-blue-300" />
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-bold text-gray-500 uppercase">Who is collecting the cash?</label>
                          <select 
                             value={receiverId} 
                             onChange={(e) => setReceiverId(e.target.value)}
                             className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[var(--primary)]"
                          >
                              <option value="">Select Employee...</option>
                              {selectedRoom.employees.map(e => {
                                  const uid = e.user?._id || e.user;
                                  return <option key={uid} value={uid}>{e.name} ({e.empCode})</option>;
                              })}
                          </select>
                          <p className="text-xs text-gray-400">Only employees assigned to this room are listed.</p>
                      </div>

                      {/* REMOVED max-h constraint as requested to show ALL dots/items */}
                      <div className="border rounded-xl p-2 bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Breakdown</p>
                          {selectedRoom.employees.map(e => (
                              <div key={e.user?._id || e.user} className="flex justify-between items-center p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-sm border-b border-dashed border-gray-100 last:border-0">
                                  <span>{e.name}</span>
                                  <span className="font-mono font-bold mr-2">{['Present','On Duty'].includes(e.status) ? e.finalAmount : '-'}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex gap-3 shrink-0">
                      <button onClick={() => setSelectedRoom(null)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
                      <button 
                         onClick={confirmPayment} 
                         disabled={processing}
                         className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                          {processing ? 'Processing...' : (
                             <>Confirm Payment <CheckCircle className="h-4 w-4" /></>
                          )}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
