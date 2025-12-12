"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Edit2, Trash2, X, Users, Home, User, Check, Loader2, Save, Eye, Printer
} from "lucide-react";
import toast from 'react-hot-toast';

export default function RoomPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'Admin' || session?.user?.role === 'Cashier';

  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]); // All available users
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  
  // Print State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [printMode, setPrintMode] = useState('all'); // 'all' or 'single'
  const [printData, setPrintData] = useState(null);

  // Form State
  const [roomNumber, setRoomNumber] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  const fetchData = async () => {
    try {
        const [resRooms, resUsers] = await Promise.all([
            fetch('/api/rooms'),
            fetch('/api/attendance/admin') 
        ]);
        
        if (resRooms.ok) setRooms(await resRooms.json());
        
        const userRes = await fetch('/api/attendance/admin');
        if (userRes.ok) {
            const data = await userRes.json();
            setUsers(data.users || []);
        }

    } catch (error) {
        console.error("Error fetching data", error);
        toast.error("Failed to load data");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (room = null) => {
      if (room) {
          setEditMode(true);
          setCurrentRoom(room);
          setRoomNumber(room.roomNumber);
          setSelectedUserIds(room.users.map(u => u._id));
      } else {
          setEditMode(false);
          setCurrentRoom(null);
          setRoomNumber("");
          setSelectedUserIds([]);
      }
      setIsModalOpen(true);
  };

  const handleSave = async () => {
      if (!roomNumber) return toast.error("Room Number is required");

      const payload = { roomNumber, users: selectedUserIds };
      
      try {
          let res;
          if (editMode && currentRoom) {
              res = await fetch(`/api/rooms/${currentRoom._id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              });
          } else {
              res = await fetch('/api/rooms', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
              });
          }

          if (res.ok) {
              toast.success(editMode ? "Room Updated" : "Room Created");
              setIsModalOpen(false);
              fetchData();
          } else {
              const err = await res.json();
              toast.error(err.error || "Operation failed");
          }
      } catch (error) {
          toast.error("Error saving room");
      }
  };

  const handleDelete = async (id) => {
      if (!confirm("Delete this room?")) return;
      try {
          const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
          if(res.ok) {
              toast.success("Room deleted");
              fetchData();
          } else {
              toast.error("Failed to delete");
          }
      } catch(e) { toast.error("Error deleting"); }
  };

  const toggleUserSelection = (userId) => {
      setSelectedUserIds(prev => 
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
  };

  const handlePrintAll = () => {
      setPrintMode('all');
      setPrintData(filteredRooms); 
      setIsPreviewOpen(true);
  };

  const handlePrintSingle = (room) => {
      setPrintMode('single');
      setPrintData(room);
      setIsPreviewOpen(true);
  };

  const triggerPrint = () => {
      setTimeout(() => window.print(), 300);
  };

  // Logic to filter users who are ALREADY assigned to OTHER rooms
  const getAssignedUserIds = () => {
      const assigned = new Set();
      rooms.forEach(r => {
          // If we are editing, don't count the users in the current room as "assigned" (so they show up to be unselected/re-selected)
          if (editMode && currentRoom && r._id === currentRoom._id) return;
          r.users.forEach(u => assigned.add(u._id));
      });
      return assigned;
  };

  const assignedUserIds = getAssignedUserIds();

  // Filter Rooms for Display
  const filteredRooms = rooms.filter(r => 
      r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.users.some(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.empCode?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter Users for Selection (Remove assigned users)
  const filteredUsersForSelect = users.filter(u => {
      // 1. Must match search term
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                            u.empCode?.toLowerCase().includes(userSearch.toLowerCase());
      // 2. Must NOT be assigned to another room
      const isNotAssignedOthers = !assignedUserIds.has(u._id);
      
      return matchesSearch && isNotAssignedOthers;
  });

  return (
    <div className="space-y-6">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
               <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                   <Home className="h-6 w-6 text-[var(--primary)]" /> Room Grouping
               </h2>
               <p className="text-gray-500 text-sm">Manage employee accommodation and room assignments.</p>
           </div>
           <div className="flex gap-2">
               <button onClick={handlePrintAll} className="bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                   <Printer className="h-5 w-5" /> Print All
               </button>
               {isAdmin && (
                   <button onClick={() => handleOpenModal()} className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[var(--primary)]/90 transition-colors shadow-lg shadow-[var(--primary)]/30">
                       <Plus className="h-5 w-5" /> Add Room
                   </button>
               )}
           </div>
       </div>

       {/* Search */}
       <div className="relative max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input 
               type="text" 
               placeholder="Search rooms or employees..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
           />
       </div>

       {/* Loading */}
       {loading ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[var(--primary)] h-8 w-8" /></div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {filteredRooms.map(room => (
                   <div key={room._id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--primary)]/10 to-transparent rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                       
                       <div className="flex justify-between items-start mb-4 relative z-10">
                           <div>
                               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Room Number</p>
                               <h3 className="text-3xl font-black text-gray-900 dark:text-white">{room.roomNumber}</h3>
                           </div>
                           <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => handlePrintSingle(room)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300" title="View/Print"><Eye className="h-4 w-4" /></button>
                               {isAdmin && (
                                   <>
                                       <button onClick={() => handleOpenModal(room)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-blue-600"><Edit2 className="h-4 w-4" /></button>
                                       <button onClick={() => handleDelete(room._id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-rose-600"><Trash2 className="h-4 w-4" /></button>
                                   </>
                               )}
                           </div>
                       </div>

                       <div className="space-y-3">
                           <div className="flex items-center gap-2 text-sm font-medium text-gray-500 border-b border-gray-100 dark:border-gray-800 pb-2">
                               <Users className="h-4 w-4" /> 
                               <span>Residents ({room.users.length})</span>
                           </div>
                           
                           {room.users.length > 0 ? (
                               <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                                   {room.users.map(user => (
                                       <div key={user._id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                           <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                               {user.name?.[0]}
                                           </div>
                                           <div className="flex-1 min-w-0">
                                               <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                                               <p className="text-[10px] text-gray-500 font-mono">{user.empCode || "No ID"}</p>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <div className="text-center py-4 text-gray-400 text-sm italic">No user assigned</div>
                           )}
                       </div>
                   </div>
               ))}
           </div>
       )}

       {/* Create/Edit Modal */}
       <AnimatePresence>
           {isModalOpen && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                   <motion.div 
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       className="bg-white dark:bg-gray-900 w-full max-w-2xl h-[85vh] rounded-3xl shadow-2xl flex flex-col border dark:border-gray-800"
                   >
                       <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                           <h3 className="text-xl font-bold dark:text-white">{editMode ? 'Edit Room' : 'Add New Room'}</h3>
                           <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X className="h-5 w-5" /></button>
                       </div>
                       
                       <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                           <div className="space-y-6">
                               <div>
                                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Room Number</label>
                                   <input 
                                       type="text" 
                                       value={roomNumber}
                                       onChange={(e) => setRoomNumber(e.target.value)}
                                       className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-[var(--primary)] outline-none"
                                       placeholder="e.g. A-101"
                                   />
                               </div>

                               <div>
                                   <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Assign Employees</label>
                                   <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                                       <div className="mb-3 relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Filter users..." 
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 rounded-lg text-sm border-none focus:ring-1 focus:ring-[var(--primary)]"
                                            />
                                       </div>
                                       <div className="max-h-[300px] overflow-y-auto space-y-1 custom-scrollbar">
                                           {filteredUsersForSelect.map(user => {
                                               const isSelected = selectedUserIds.includes(user._id);
                                               return (
                                                   <div 
                                                       key={user._id} 
                                                       onClick={() => toggleUserSelection(user._id)}
                                                       className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-[var(--primary)] text-white' : 'hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                                                   >
                                                       <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                                           {user.name?.[0]}
                                                       </div>
                                                       <div className="flex-1">
                                                           <p className="text-sm font-bold">{user.name}</p>
                                                           <p className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{user.empCode || "NO CODE"}</p>
                                                       </div>
                                                       {isSelected && <Check className="h-4 w-4" />}
                                                   </div>
                                               );
                                           })}
                                            {filteredUsersForSelect.length === 0 && (
                                                <p className="text-center text-gray-400 text-xs py-4">No available users found.</p>
                                            )}
                                       </div>
                                       <p className="text-right text-xs text-gray-400 mt-2">{selectedUserIds.length} selected</p>
                                   </div>
                               </div>
                           </div>
                       </div>

                       <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                           <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                           <button onClick={handleSave} className="px-6 py-2.5 rounded-xl font-bold bg-[var(--primary)] text-white hover:brightness-110 shadow-lg shadow-[var(--primary)]/30 transition-all flex items-center gap-2">
                               <Save className="h-4 w-4" /> Save Room
                           </button>
                       </div>
                   </motion.div>
               </div>
           )}
       </AnimatePresence>

       {/* Preview Modal for Printing */}
       <AnimatePresence>
           {isPreviewOpen && (
               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 print:hidden">
                    <div className="bg-white text-black w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded relative p-8">
                        <button onClick={() => setIsPreviewOpen(false)} className="absolute top-2 right-2 p-2 bg-gray-200 rounded-full hover:bg-red-100"><X className="h-4 w-4" /></button>
                        <div className="flex justify-between mb-4 print:hidden">
                            <h2 className="font-bold text-lg">Print Preview</h2>
                            <button onClick={triggerPrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"><Printer className="h-4 w-4" /> Print</button>
                        </div>
                        <div className="min-h-[500px]">
                            {printMode === 'all' ? <PrintAllView rooms={printData} /> : <PrintSingleView room={printData} />}
                        </div>
                    </div>
               </div>
           )}
       </AnimatePresence>

        {/* Hidden Print Area */}
        {isPreviewOpen && (
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black left-0 top-0 w-full h-full">
                {printMode === 'all' ? <PrintAllView rooms={printData} /> : <PrintSingleView room={printData} />}
            </div>
        )}

      <style jsx global>{`@media print { @page { margin: 10mm; } body { background: white !important; color: black !important; } }`}</style>
    </div>
  );
}

function PrintAllView({ rooms }) {
    if (!rooms) return null;
    return (
        <div className="w-full">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
                 <h1 className="text-2xl font-bold uppercase tracking-widest">United Movement Company Ltd.</h1>
                 <h2 className="text-lg font-medium text-gray-600">Employee Accommodation Report - All Rooms</h2>
                 <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
                {rooms.map((room, idx) => (
                    <div key={idx} className="border-2 border-black p-3 break-inside-avoid shadow-sm rounded-lg flex flex-col h-full bg-white">
                        <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-2">
                            <h3 className="text-xl font-black">{room.roomNumber}</h3>
                            <span className="text-sm font-bold bg-black text-white px-2 py-0.5 rounded-full">{room.users.length} Occupants</span>
                        </div>
                        <div className="flex-1">
                            {room.users.length > 0 ? (
                                <ul className="space-y-1.5">
                                    {room.users.map(u => (
                                        <li key={u._id} className="flex justify-between items-center text-xs">
                                            <span className="font-bold truncate max-w-[70%] uppercase">{u.name}</span>
                                            <span className="font-mono bg-gray-100 px-1 rounded">{u.empCode}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-400 italic text-xs py-4">VACANT</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function PrintSingleView({ room }) {
    if(!room) return null;
    return (
        <div className="w-full max-w-2xl mx-auto border-2 border-black p-8 min-h-[800px]">
             <div className="text-center border-b-2 border-black pb-4 mb-8">
                 <h1 className="text-2xl font-bold uppercase tracking-widest">United Movement Company Ltd.</h1>
                 <h2 className="text-lg font-medium text-gray-600">Room Assignment Detail</h2>
            </div>
            
            <div className="flex justify-between items-center mb-8 bg-gray-100 p-6 rounded-lg border border-gray-300">
                <div>
                     <p className="text-sm text-gray-500 uppercase font-bold">Room Number</p>
                     <p className="text-5xl font-black">{room.roomNumber}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase font-bold">Total Residents</p>
                    <p className="text-4xl font-bold">{room.users.length}</p>
                </div>
            </div>

            <h3 className="font-bold text-lg border-b-2 border-black mb-4 pb-2">Resident List</h3>
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-black">
                        <th className="py-2 w-12">#</th>
                        <th className="py-2">Name</th>
                        <th className="py-2 text-right">Employee Code</th>
                        <th className="py-2 text-right">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {room.users.map((u, i) => (
                        <tr key={u._id} className="border-b border-gray-200">
                            <td className="py-3 font-bold text-gray-500">{i+1}</td>
                            <td className="py-3 font-bold uppercase">{u.name}</td>
                            <td className="py-3 font-mono text-right font-bold">{u.empCode}</td>
                            <td className="py-3 text-right">
                                <span className="border border-black px-2 py-0.5 text-xs rounded-full">ACTIVE</span>
                            </td>
                        </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 8 - room.users.length) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="border-b border-dashed border-gray-200">
                             <td className="py-3 text-gray-200">{room.users.length + i + 1}</td>
                             <td className="py-3 text-gray-300 italic">Verify Vacancy</td>
                             <td className="py-3"></td>
                             <td className="py-3"></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-12 pt-8 border-t-2 border-black flex justify-between text-xs font-bold uppercase">
                <div className="text-center">
                    <p className="mb-8">Camp Boss</p>
                    <div className="w-32 border-b border-black"></div>
                </div>
                <div className="text-center">
                    <p className="mb-8">HR Manager</p>
                    <div className="w-32 border-b border-black"></div>
                </div>
            </div>
        </div>
    );
}
