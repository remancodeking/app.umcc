"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Users, CheckCircle, AlertCircle, DollarSign, Printer, Search, ArrowRight, ChevronLeft, ChevronRight, Calendar, FileText 
} from "lucide-react";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import ReceiptTemplate from "@/components/salary/ReceiptTemplate";
import PayrollSummarySheet from "@/components/salary/PayrollSummarySheet";
import { useSession } from "next-auth/react";

export default function DisbursementPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  
  // Date State - Default to today or latest found
  const [currentDate, setCurrentDate] = useState(null); 
  const [displayDate, setDisplayDate] = useState(""); // For UI display

  // Modal State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [receiverId, setReceiverId] = useState("");
  const [processing, setProcessing] = useState(false);
  
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
      if (date) url += `?date=${date}`;
      
      const res = await fetch(url);
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

  useEffect(() => { fetchData(); }, []);

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
             const receiver = selectedRoom.employees.find(e => e.user === receiverId) || { name: result.receiverName };
             
             setPrintData({
                 receiptId: result.receiptId,
                 date: result.date,
                 roomNumber: selectedRoom.roomNumber,
                 receiverId: receiverId,
                 receiverName: receiver.name, 
                 employees: selectedRoom.employees, 
                 totalAmount: selectedRoom.totalAmount,
                 adminName: session?.user?.name
             });

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
          <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-500" /> Salary Disbursement
          </h1>
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
      ) : (
          /* Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.map((room) => (
                 <div key={room.roomNumber} className={`relative p-6 rounded-2xl border transition-all ${
                     room.isPaid 
                     ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' 
                     : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:shadow-lg'
                 }`}>
                    {room.isPaid && (
                       <div className="absolute top-4 right-4">
                           <div className="bg-green-500 text-white p-1 rounded-full"><CheckCircle className="h-4 w-4"/></div>
                       </div>
                    )}
                    
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">Room Number</h3>
                    <p className="text-3xl font-black mb-4 dark:text-white">{room.roomNumber}</p> 

                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Staff</p>
                            <p className="font-bold flex items-center gap-1"><Users className="h-3 w-3"/> {room.employees.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                            <p className={`text-xl font-black ${room.isPaid ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                {Number(room.totalAmount).toLocaleString()} <span className="text-xs font-normal text-gray-400">SAR</span>
                            </p>
                        </div>
                    </div>

                    {room.isPaid ? (
                        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-bold text-green-600 uppercase">Paid</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Receiver</span><span className="font-bold truncate max-w-[100px]">{room.receiverName}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Receipt</span><span className="font-mono">{room.receiptId}</span></div>
                            <button onClick={() => {
                                 const receiver = { name: room.receiverName }; // Minimal info needed for reprint
                                 setPrintData({
                                     receiptId: room.receiptId,
                                     date: room.paidAt,
                                     roomNumber: room.roomNumber,
                                     receiverName: room.receiverName,
                                     employees: room.employees,
                                     totalAmount: room.totalAmount,
                                     adminName: session?.user?.name || 'Admin'
                                 });
                            }} className="w-full mt-2 py-1.5 bg-black text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-800">
                                 <Printer className="h-3 w-3" /> Reprint Receipt
                            </button>
                        </div>
                    ) : (
                        <button 
                           onClick={() => openPaymentModal(room)}
                           className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:-translate-y-1 transition-transform flex items-center justify-center gap-2"
                        >
                           Disburse Payment <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                 </div>
              ))}
          </div>
      )}

      {/* Payment Modal */}
      {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
              <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-6 border-b dark:border-gray-800 bg-gray-50 dark:bg-black/20">
                      <h2 className="text-xl font-bold flex items-center gap-2">
                          Payment Confirmation <span className="text-gray-400 text-sm font-normal">Room {selectedRoom.roomNumber}</span>
                      </h2>
                  </div>
                  
                  <div className="p-6 space-y-6">
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
                              {selectedRoom.employees.map(e => (
                                  <option key={e.user} value={e.user}>{e.name} ({e.empCode})</option>
                              ))}
                          </select>
                          <p className="text-xs text-gray-400">Only employees assigned to Room {selectedRoom.roomNumber} are listed.</p>
                      </div>

                      <div className="max-h-40 overflow-y-auto border rounded-xl p-2 bg-gray-50 dark:bg-gray-800/50">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Breakdown</p>
                          {selectedRoom.employees.map(e => (
                              <div key={e.user} className="flex justify-between items-center p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-sm">
                                  <span>{e.name}</span>
                                  <span className="font-mono font-bold mr-2">{['Present','On Duty'].includes(e.status) ? e.finalAmount : '-'}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="p-6 border-t dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex gap-3">
                      <button onClick={() => setSelectedRoom(null)} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors">Cancel</button>
                      <button 
                         onClick={confirmPayment} 
                         disabled={processing}
                         className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                         {processing ? 'Processing...' : (
                             <>Confirm & Print Receipt <Printer className="h-4 w-4" /></>
                         )}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
