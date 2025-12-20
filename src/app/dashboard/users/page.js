"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  UserPlus, Search, Filter, MoreHorizontal, FileText, CheckCircle, 
  XCircle, X, Loader2, LayoutGrid, List, Eye, Edit, Trash,
  DollarSign, TrendingUp, Calendar, Wallet, User as UserIcon, Upload
} from "lucide-react";
import toast from 'react-hot-toast';
import { useRef } from 'react';

export default function UserManagementPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table"); 
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false); // Add/Edit
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // View Profile
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Salary Data State
  const [salaryData, setSalaryData] = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'salary'

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Import Preview State
  const [importPreviewData, setImportPreviewData] = useState([]);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);

  // Form State
  const initialFormState = {
    id: null,
    name: "", mobile: "", email: "", password: "", role: "Employee",
    sm: "Auto Generated", empCode: "", designation: "Porter", shift: "A", 
    status: "In Work", terminal: "Hajj Terminal",
    iqamaNumber: "", passportNumber: ""
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch Users
  const fetchUsers = async () => {
    try {
        const res = await fetch('/api/users');
        if (res.ok) {
            const data = await res.json();
            setUsers(data);
        } else {
           toast.error("Failed to fetch users");
        }
    } catch (error) {
        console.error("Failed to fetch users", error);
        toast.error("Error connecting to server");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setFormData({
      id: user._id,
      name: user.name || "",
      mobile: user.mobile || "",
      email: user.email || "",
      password: "", // Leave empty to not update
      role: user.role || "Employee",
      sm: user.sm || "",
      empCode: user.empCode || "",
      designation: user.designation || "Porter",
      shift: user.shift || "A",
      status: user.status || "In Work",
      terminal: user.terminal || "Hajj Terminal",
      iqamaNumber: user.iqamaNumber || "",
      passportNumber: user.passportNumber || ""
    });
    setIsModalOpen(true);
  };

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full Name is required";
    if (!formData.iqamaNumber.trim()) newErrors.iqamaNumber = "Iqama Number is required";
    // Mobile/Email/Password no longer strict requirements for creation as per new logic
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
       toast.error("Please fix the errors in the form");
       return;
    }
    
    setIsSubmitting(true);
    
    try {
        const method = formData.id ? 'PUT' : 'POST';
        const res = await fetch('/api/users', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await res.json();
        
        if (!res.ok) {
            toast.error(data.error || "Operation failed");
        } else {
            toast.success(formData.id ? "User updated successfully!" : "Employee created successfully!");
            setIsModalOpen(false);
            fetchUsers();
            if (!formData.id) setFormData(initialFormState);
        }
    } catch (error) {
        console.error("Error saving user:", error);
        toast.error("An unexpected error occurred");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if(!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) {
         toast.error(data.error || "Failed to delete user");
      } else {
         toast.success("User deleted successfully");
         fetchUsers();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
    setSalaryData(null); // Reset prev data
    setActiveTab('overview');
    
    // Fetch Salary Data
    setSalaryLoading(true);
    try {
        const res = await fetch(`/api/users/${user._id}/salary`);
        if(res.ok) {
            setSalaryData(await res.json());
        }
    } catch(e) {
        console.error("Failed fetching salary", e);
        toast.error("Could not fetch salary history");
    } finally { 
        setSalaryLoading(false); 
    }
  }

  // Filters State
  const [filterDesignation, setFilterDesignation] = useState("All");
  const [filterShift, setFilterShift] = useState("All");
  const [filterTerminal, setFilterTerminal] = useState("All");

  // Selection State
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // ... (existing functions)

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.sm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.iqamaNumber?.includes(searchTerm);
    
    const matchesDesignation = filterDesignation === "All" || user.designation === filterDesignation;
    const matchesShift = filterShift === "All" || user.shift === filterShift;
    const matchesTerminal = filterTerminal === "All" || user.terminal === filterTerminal;

    return matchesSearch && matchesDesignation && matchesShift && matchesTerminal;
  }).sort((a, b) => {
      // Sort Current User to Top
      const email = session?.user?.email;
      if (!email) return 0;
      const isMeA = a.email === email;
      const isMeB = b.email === email;
      if (isMeA && !isMeB) return -1;
      if (!isMeA && isMeB) return 1;
      return 0;
  });

  const handleSelectAll = (e) => {
      if (e.target.checked) {
          setSelectedUserIds(filteredUsers.map(u => u._id));
      } else {
          setSelectedUserIds([]);
      }
  };

  const handleSelectUser = (id) => {
      setSelectedUserIds(prev => 
        prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
      );
  };

  const handleBulkDelete = async () => {
      if (selectedUserIds.length === 0) return;
      if (!confirm(`Are you sure you want to delete ${selectedUserIds.length} users?`)) return;

      try {
          const res = await fetch(`/api/users?id=${selectedUserIds.join(',')}`, { method: 'DELETE' });
          if (res.ok) {
              toast.success(`Deleted ${selectedUserIds.length} users.`);
              setSelectedUserIds([]);
              fetchUsers();
          } else {
              toast.error("Failed to delete selected users.");
          }
      } catch (err) {
          toast.error("Error deleting users.");
      }
  };

  const handleDeleteAllFiltered = async () => {
      // This is dangerous, so we ask for specific confirmation text
      const code = prompt("Type 'DELETE ALL' to confirm deleting ALL users (Admins are safe).");
      if (code !== 'DELETE ALL') return;

      try {
          const res = await fetch(`/api/users?all=true`, { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
              toast.success(data.message);
              fetchUsers();
          } else {
              toast.error(data.error || "Failed.");
          }
      } catch (err) {
          toast.error("Error deleting all users.");
      }
  };

  const handleBulkUpdate = async (field, value) => {
     if (selectedUserIds.length === 0) return;
     if(!confirm(`Update ${field} to "${value}" for ${selectedUserIds.length} users?`)) return;

     const toastId = toast.loading(`Updating ${selectedUserIds.length} users...`);
     
     try {
        const res = await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ids: selectedUserIds,
                [field]: value
            })
        });

        if (res.ok) {
            toast.success("Updated successfully!", { id: toastId });
            fetchUsers();
            setSelectedUserIds([]); // Optional: clear selection after update
        } else {
            const data = await res.json();
            toast.error(data.error || "Update failed", { id: toastId });
        }
     } catch(e) {
         toast.error("Bulk update failed", { id: toastId });
     }
  };

  // --- IMPORT HELPER FUNCTIONS ---
  const handleUpdatePreviewRow = (index, field, value) => {
      setImportPreviewData(prev => {
          const newData = [...prev];
          newData[index] = { ...newData[index], [field]: value };
          
          const row = newData[index];
          // Check duplicates against actual users list
          const duplicate = users.some(u => 
              (u.iqamaNumber && String(u.iqamaNumber) === String(row.iqamaNumber)) || 
              (u.empCode && row.empCode && String(u.empCode) === String(row.empCode))
          );
          
          newData[index].isValid = !!row.name && !!row.iqamaNumber && !duplicate;
          newData[index].isDuplicate = duplicate;
          
          return newData;
      });
  };

  const handleRemovePreviewRow = (index) => {
      setImportPreviewData(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalizeImport = async () => {
      const validData = importPreviewData.filter(d => d.isValid);
      if(validData.length === 0) return;
      
      setIsSubmitting(true);
      let successCount = 0;
      let failCount = 0;
      
      const toastId = toast.loading(`Starting import of ${validData.length} users...`);
      
      try {
          // Process sequentially
          for (let i = 0; i < validData.length; i++) {
             const row = validData[i];
             
             if(i % 5 === 0) toast.loading(`Importing ${i+1}/${validData.length}...`, { id: toastId });

             const payload = {
                 name: row.name,
                 iqamaNumber: String(row.iqamaNumber),
                 empCode: row.empCode ? String(row.empCode) : "",
                 designation: row.designation || "Porter",
                 shift: row.shift || "A", 
                 terminal: row.terminal || "Hajj Terminal",
                 role: "Employee",
                 status: "In Work",
                 mobile: "", 
                 email: ""
             };
             
             try {
                const res = await fetch('/api/users', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if(res.ok) successCount++;
                else failCount++;
             } catch(e) {
                failCount++;
            }
          }
          
          if(successCount > 0) {
              toast.success(`Successfully imported ${successCount} users!`, { id: toastId });
              setIsImportPreviewOpen(false);
              setImportPreviewData([]);
              fetchUsers();
          } else {
              toast.error(`Import failed. ${failCount} errors.`, { id: toastId });
          }
      } catch(e) {
          toast.error("Critical import error", { id: toastId });
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-[var(--primary)]" /> User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage employees, roles, shifts, and permissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
                 // Trigger hidden file input or open modal
                 // For now we open the preview modal directly IF we had data, 
                 // but typically we need an input. 
                 // We'll assume the user has a way to get data into 'importPreviewData' 
                 // or we can add a file input here.
                 // For this fix, let's just make it standard 'Import' button style
                 document.getElementById('excel-upload').click();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            <Upload className="h-4 w-4" /> Import Excel
          </button>
          <input 
            type="file" 
            id="excel-upload" 
            hidden 
            accept=".xlsx, .xls" 
            onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const loadToast = toast.loading("Reading Excel file...");
                try {
                    const XLSX = await import("xlsx");
                    const reader = new FileReader();
                    
                    reader.onload = (evt) => {
                        try {
                            const buffer = evt.target.result;
                            const wb = XLSX.read(buffer, { type: 'array' });
                            const wsname = wb.SheetNames[0];
                            const ws = wb.Sheets[wsname];
                            
                            // Get as array of arrays to find the header row
                            const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
                            
                            if (!rawData || rawData.length === 0) {
                                toast.error("File is empty", { id: loadToast });
                                return;
                            }

                            // 1. Find the Header Row (Look for 'Name' and 'Iqama' or 'ID')
                            let headerRowIndex = 0;
                            const searchLimit = Math.min(rawData.length, 25);

                            for (let i = 0; i < searchLimit; i++) {
                                const rowStr = rawData[i].map(c => String(c || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
                                // Check if row has 'name' AND ('code' or 'iqama' or 'id')
                                const hasName = rowStr.some(s => s.includes('name'));
                                const hasId = rowStr.some(s => s.includes('iqama') || s.includes('id') || s.includes('code'));
                                if (hasName && hasId) {
                                    headerRowIndex = i;
                                    break;
                                }
                            }

                            const headers = rawData[headerRowIndex].map(h => String(h || ''));
                            console.log("Headers found:", headers);
                            const dataRows = rawData.slice(headerRowIndex + 1);

                            // Robust Key Matcher
                            const getKeyIndex = (keys) => {
                                const cleanKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
                                return headers.findIndex(h => {
                                    const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, '');
                                    return cleanKeys.some(k => cleanH.includes(k) || k === cleanH);
                                });
                            };

                            const nameIdx = getKeyIndex(['name', 'full name', 'employee name']);
                            const iqamaIdx = getKeyIndex(['iqama', 'iqama #', 'iqama number', 'id', 'national id']);
                            const codeIdx = getKeyIndex(['code', 'emp code', 'employee code']);
                            const desigIdx = getKeyIndex(['designation', 'role', 'position']);
                            const pptIdx = getKeyIndex(['passport', 'passport #']);
                            const shiftIdx = getKeyIndex(['shift', 'shift time']);
                            const termIdx = getKeyIndex(['terminal', 'location']);

                            const mapped = dataRows.map((row, i) => {
                                 // Safe Get
                                 const val = (idx) => idx !== -1 && row[idx] ? String(row[idx]).trim() : "";

                                 const name = val(nameIdx);
                                 const iqama = val(iqamaIdx);
                                 const code = val(codeIdx);
                                 const designation = val(desigIdx);
                                 const passport = val(pptIdx);
                                 
                                 const rawShift = val(shiftIdx);
                                 const rawTerminal = val(termIdx);

                                 // Smart Parse
                                 let shift = "A";
                                 let terminal = "Hajj Terminal"; // Default

                                 const combined = (rawShift + " " + rawTerminal).toLowerCase();
                                 if (combined.includes('night') || rawShift.toUpperCase() === 'B') shift = 'B';
                                 else if (combined.includes('day') || rawShift.toUpperCase() === 'A') shift = 'A';

                                 if (combined.includes('hajj')) terminal = 'Hajj Terminal';
                                 else if (combined.includes('north')) terminal = 'North Terminal';
                                 else if (combined.includes('new')) terminal = 'New Terminal';

                                 const isDuplicate = users.some(u => 
                                    (u.iqamaNumber && iqama && String(u.iqamaNumber) === String(iqama)) || 
                                    (u.empCode && code && String(u.empCode) === String(code))
                                 );

                                 return {
                                    tempId: i,
                                    name,
                                    iqamaNumber: iqama,
                                    empCode: code,
                                    designation,
                                    passportNumber: passport,
                                    shift,
                                    terminal,
                                    isValid: !!name && !!iqama && !isDuplicate, 
                                    isDuplicate
                                 };
                            }).filter(row => row.name || row.iqamaNumber);

                            if(mapped.length === 0) {
                                toast.error(`No valid rows found. Header row ${headerRowIndex+1} had: ${headers.slice(0,3).join(', ')}`, { id: loadToast });
                            } else {
                                toast.success(`Found ${mapped.length} users`, { id: loadToast });
                                setImportPreviewData(mapped);
                                setIsImportPreviewOpen(true);
                            }
                            e.target.value = '';

                        } catch (parseErr) {
                            console.error(parseErr);
                            toast.error("Error parsing data", { id: loadToast });
                        }
                    };
                    reader.readAsArrayBuffer(file);
                } catch(err) {
                    console.error(err);
                    toast.error("Failed to load Excel processor", { id: loadToast });
                }
            }}
          />
          
           {/* JSON Input */}
           <input 
            type="file" 
            id="json-upload" 
            hidden 
            accept=".json" 
            onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const loadToast = toast.loading("Reading JSON file...");
                const reader = new FileReader();

                reader.onload = (evt) => {
                    try {
                        const json = JSON.parse(evt.target.result);
                        if (!Array.isArray(json)) {
                            toast.error("JSON must be an array of objects", { id: loadToast });
                            return;
                        }

                        const mapped = json.map((row, i) => {
                             const name = row.name || row.Name || row.full_name;
                             const iqama = row.iqamaNumber || row.iqama || row.id || row.ID;
                             const code = row.empCode || row.code;
                             const designation = row.designation || row.role;
                             const shift = row.shift;
                             const terminal = row.terminal;

                             const isDuplicate = users.some(u => 
                                (u.iqamaNumber && iqama && String(u.iqamaNumber) === String(iqama)) || 
                                (u.empCode && code && String(u.empCode) === String(code))
                             );

                             return {
                                tempId: i,
                                name,
                                iqamaNumber: iqama,
                                empCode: code,
                                designation,
                                shift: shift || "A",
                                terminal: terminal || "Hajj Terminal",
                                isValid: !!name && !!iqama && !isDuplicate,
                                isDuplicate
                             };
                        });
                        
                        if(mapped.length === 0) {
                             toast.error("No valid data found", { id: loadToast });
                        } else {
                             toast.success(`Found ${mapped.length} records`, { id: loadToast });
                             setImportPreviewData(mapped);
                             setIsImportPreviewOpen(true);
                        }
                        e.target.value = '';

                    } catch (err) {
                        toast.error("Invalid JSON file", { id: loadToast });
                    }
                };
                reader.readAsText(file);
            }}
          />

          <button 
             onClick={() => document.getElementById('json-upload').click()}
             className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
           >
             <FileText className="h-4 w-4 text-orange-500" /> Import JSON
          </button>

          <button 
             onClick={() => window.open('/import-help', '_blank') || alert("Excel Columns:\n- Name (Required)\n- Iqama / ID (Required)\n- Code\n- Designation\n- Shift\n- Terminal\n\nJSON Format:\n[ { \"name\": \"...\", \"iqama\": \"...\" }, ... ]")}
             className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
             title="How to import?"
           >
             <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-sm">?</div>
          </button>
          <button 
            onClick={openAddModal} 
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus className="h-4 w-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Filters & Search & Bulk Actions */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                type="text" 
                placeholder="Search by Name, Code, SM, or Iqama..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
                />
            </div>
            
            {/* Advanced Filters */}
            <select value={filterDesignation} onChange={(e) => setFilterDesignation(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg outline-none text-sm cursor-pointer">
                <option value="All">All Designations</option>
                <option value="Porter">Porter</option>
                <option value="Team Leader">Team Leader</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Labor">Labor</option>
                <option value="Cashier">Cashier</option>
                <option value="Hotel Incharge">Hotel Incharge</option>
                <option value="Operation Manager">Operation Manager</option>
                <option value="Transport Incharge">Transport Incharge</option>
            </select>
            <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg outline-none text-sm cursor-pointer">
                <option value="All">All Shifts</option>
                <option value="A">Shift A</option>
                <option value="B">Shift B</option>
            </select>
             <select value={filterTerminal} onChange={(e) => setFilterTerminal(e.target.value)} className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg outline-none text-sm cursor-pointer">
                <option value="All">All Terminals</option>
                <option value="Hajj Terminal">Hajj Terminal</option>
                <option value="New Terminal">New Terminal</option>
                <option value="North Terminal">North Terminal</option>
            </select>
          </div>

          {/* Bulk Action Bar */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3 mt-1">
             <div className="text-xs text-gray-500 font-medium">
                {users.length} Total Users • {filteredUsers.length} Shown
             </div>
             
             <div className="flex items-center gap-2">
                 {selectedUserIds.length > 0 && (
                     <>
                        <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2"></div>
                        
                        {/* Bulk Shift */}
                        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Set Shift:</span>
                            <select 
                                onChange={(e) => handleBulkUpdate('shift', e.target.value)} 
                                className="bg-transparent text-xs font-bold text-blue-700 outline-none cursor-pointer"
                                value=""
                            >
                                <option value="" disabled>Select</option>
                                <option value="A">Shift A</option>
                                <option value="B">Shift B</option>
                            </select>
                        </div>

                        {/* Bulk Terminal */}
                         <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg">
                            <span className="text-[10px] font-bold text-purple-600 uppercase">Set Terminal:</span>
                            <select 
                                onChange={(e) => handleBulkUpdate('terminal', e.target.value)} 
                                className="bg-transparent text-xs font-bold text-purple-700 outline-none cursor-pointer"
                                value=""
                            >
                                <option value="" disabled>Select</option>
                                <option value="Hajj Terminal">Hajj</option>
                                <option value="New Terminal">New</option>
                                <option value="North Terminal">North</option>
                            </select>
                        </div>

                     <button onClick={handleBulkDelete} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-xs font-bold hover:bg-red-100 transition-colors ml-2">
                        <Trash className="h-3.5 w-3.5" /> Delete ({selectedUserIds.length})
                     </button>
                     </>
                 )}
                 <button onClick={handleDeleteAllFiltered} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash className="h-3.5 w-3.5" /> Delete ALL Users
                 </button>
             </div>
          </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-[var(--primary)] animate-spin mb-4" />
          <p className="text-gray-500 animate-pulse">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
           <div className="h-16 w-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-gray-300" />
           </div>
           <h3 className="text-lg font-medium text-gray-900 dark:text-white">No users found</h3>
           <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-1">Try adjusting your filters or import new employees.</p>
        </div>
      ) : (
        <>
        {viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden ring-1 ring-gray-100 dark:ring-gray-800">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-[11px] uppercase text-gray-400 font-bold tracking-wider">
                         <th className="px-6 py-4 w-10">
                            <input 
                                type="checkbox" 
                                onChange={handleSelectAll} 
                                checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                                className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" 
                            />
                         </th>
                         <th className="px-6 py-4">Employee</th>
                         <th className="px-6 py-4">Status & Role</th>
                         <th className="px-6 py-4">Location & Shift</th>
                         <th className="px-6 py-4">Contact</th>
                         <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {filteredUsers.map((user) => (
                         <tr key={user._id} className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-200 group ${selectedUserIds.includes(user._id) ? 'bg-blue-50/30' : ''} ${session?.user?.email && user.email === session.user.email ? 'bg-green-50/60 dark:bg-green-900/10 border-l-4 border-l-green-500 shadow-sm' : ''}`}>
                            <td className="px-6 py-4">
                                <input 
                                    type="checkbox" 
                                    checked={selectedUserIds.includes(user._id)}
                                    onChange={() => handleSelectUser(user._id)}
                                    className="rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]" 
                                />
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                     <div className="flex items-center gap-2">
                                       <span className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</span>
                                       {session?.user?.email && user.email === session.user.email && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100">YOU</span>}
                                     </div>
                                     <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 rounded font-mono">{user.empCode || 'N/A'}</span>
                                        <span className="text-[10px] text-gray-400">•</span>
                                        <span className="text-xs text-[var(--primary)] font-medium">{user.designation || 'Staff'}</span>
                                     </div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex flex-col gap-2 items-start">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                    user.status === 'In Work' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/30' 
                                      : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-900/30'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'In Work' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                    {user.status || 'In Work'}
                                  </span>
                                  <span className="text-xs text-gray-500 px-1">{user.role}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-200">
                                     <CheckCircle className="h-3 w-3 text-gray-400" />
                                     {user.terminal || 'Hajj Terminal'}
                                  </div>
                                  <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                     user.shift === 'A' 
                                       ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' 
                                       : user.shift === 'B' 
                                       ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100 dark:bg-fuchsia-900/20 dark:text-fuchsia-300 dark:border-fuchsia-800'
                                       : 'bg-gray-50 text-gray-600 border-gray-200'
                                  }`}>
                                     SHIFT {user.shift || '-'}
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex flex-col text-xs">
                                  <span className="font-semibold text-gray-700 dark:text-gray-300">{user.sm || 'No SM#'}</span>
                                  <span className="text-gray-400 mt-0.5">ID: {user.iqamaNumber || 'N/A'}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="flex items-center justify-center gap-1">
                                  <button onClick={() => handleViewUser(user)} className="p-2 text-gray-400 hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-lg transition-all" title="View Details">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => openEditModal(user)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all" title="Edit">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => handleDeleteUser(user._id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="Delete">
                                    <Trash className="h-4 w-4" />
                                  </button>
                               </div>
                            </td>
                         </tr>
                        ))}
                   </tbody>
                </table>
             </div>
          </div>
        ) : (
          /* GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredUsers.map((user) => (
                <div key={user._id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow relative group">
                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleViewUser(user)} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-[var(--primary)] hover:text-white rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEditModal(user)} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(user._id)} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-500 hover:text-white rounded-lg transition-colors">
                        <Trash className="h-4 w-4" />
                      </button>
                   </div>

                  <div className="flex items-center gap-4 mb-4">
                     <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[var(--primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{user.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-xs text-[var(--primary)] font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">{user.designation || 'Staff'}</span>
                           {session?.user?.email === user.email && <span className="text-[10px] font-bold text-gray-400 border px-1 rounded">YOU</span>}
                        </div>
                     </div>
                  </div>
                  
                  <div className="space-y-4 text-sm mt-6">
                     <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50">
                        <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Status</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                           user.status === 'In Work' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/30' 
                              : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/10 dark:text-rose-400 dark:border-rose-900/30'
                        }`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'In Work' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                           {user.status || 'In Work'}
                        </span>
                     </div>
                     <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50">
                        <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Shift & Terminal</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{user.terminal || 'Hajj Terminal'}</span>
                           <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              user.shift === 'A' 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' 
                              : user.shift === 'B' 
                              ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100 dark:bg-fuchsia-900/20 dark:text-fuchsia-300 dark:border-fuchsia-800'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                           }`}>
                              {user.shift || '-'}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}
        </>
      )}

      {/* Add/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {formData.id ? <><Edit className="h-5 w-5 text-yellow-600" /> Edit Employee</> : <><UserPlus className="h-5 w-5 text-[var(--primary)]" /> Add New Employee</>}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formData.id ? "Update employee details, status, or role." : "Create a new user account for your organization."}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                   <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1 h-4 bg-[var(--primary)] rounded-full"></div> 
                      Basic Information
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Full Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`w-full h-10 px-3 rounded-lg border ${errors.name ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] outline-none transition-all`} placeholder="e.g. John Doe" />
                        {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Iqama / ID <span className="text-red-500">*</span></label>
                         <input type="text" name="iqamaNumber" maxLength={10} value={formData.iqamaNumber} onChange={handleInputChange} className={`w-full h-10 px-3 rounded-lg border ${errors.iqamaNumber ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none transition-all`} placeholder="10-digit ID" />
                         {errors.iqamaNumber && <p className="text-xs text-red-500 font-medium">{errors.iqamaNumber}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Mobile</label>
                        <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] outline-none transition-all" placeholder="Optional" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] outline-none transition-all" placeholder="Optional" />
                      </div>
                      
                      {/* Only Show Password Field when Editing (Optional Reset) */}
                      {formData.id && (
                          <div className="space-y-1 md:col-span-2">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Reset Password <span className="text-gray-400 font-normal">(Leave blank to keep current)</span></label>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] outline-none transition-all" placeholder="New Password" />
                          </div>
                      )}
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                      Employment Details
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-1"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300">SM Number</label><input type="text" name="sm" value={formData.sm} readOnly className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 cursor-not-allowed text-gray-500 focus:ring-0 outline-none transition-all" /></div>
                      <div className="space-y-1"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Emp Code</label><input type="text" name="empCode" value={formData.empCode} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none transition-all" /></div>
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Role</label>
                         <div className="relative">
                           <select name="role" value={formData.role} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none appearance-none cursor-pointer">
                              <option value="Admin">Admin</option><option value="Cashier">Cashier</option><option value="Employee">Employee</option>
                           </select>
                           <MoreHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none rotate-90" />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Designation</label>
                         <div className="relative">
                            <select name="designation" value={formData.designation} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none appearance-none cursor-pointer">
                                <option value="Porter">Porter</option>
                                <option value="Team Leader">Team Leader</option>
                                <option value="Supervisor">Supervisor</option>
                                <option value="Ground Operation Manager">Ground Operation Manager</option>
                                <option value="GID">GID</option>
                                <option value="Hotel Incharge">Hotel Incharge</option>
                                <option value="Cashier">Cashier</option>
                                <option value="Operation Manager">Operation Manager</option>
                                <option value="Transport Incharge">Transport Incharge</option>
                            </select>
                            <MoreHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none rotate-90" />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Shift</label>
                         <div className="relative">
                            <select name="shift" value={formData.shift} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none appearance-none cursor-pointer">
                                <option value="A">Shift A</option><option value="B">Shift B</option>
                            </select>
                            <MoreHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none rotate-90" />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Status</label>
                         <div className="relative">
                            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none text-sm font-medium appearance-none cursor-pointer">
                                <option value="In Work">In Work</option><option value="Out Work">Out Work</option>
                            </select>
                            <MoreHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none rotate-90" />
                         </div>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1">
                         <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Terminal</label>
                         <div className="relative">
                            <select name="terminal" value={formData.terminal} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none text-sm font-medium appearance-none cursor-pointer">
                                <option value="Hajj Terminal">Hajj Terminal</option><option value="New Terminal">New Terminal</option><option value="North Terminal">North Terminal</option>
                            </select>
                            <MoreHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none rotate-90" />
                         </div>
                       </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Passport</label><input type="text" name="passportNumber" value={formData.passportNumber} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none transition-all" /></div>
                   </div>
                </div>
                
                <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-600 dark:text-gray-300">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-bold bg-[var(--primary)] hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all">
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} {formData.id ? 'Save Changes' : 'Create Account'}
                    </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NEW PREMIUM VIEW USER MODAL */}
      {isViewModalOpen && selectedUser && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
               
               {/* Decorative Background */}
               <div className="h-32 bg-gray-900 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>
                  <div className="absolute top-0 right-0 p-20 bg-white/5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                  <button onClick={() => setIsViewModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors">
                    <X className="h-5 w-5" />
                  </button>
               </div>

               <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                  {/* LEFT SIDE: Identity */}
                  <div className="w-full md:w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col p-6 overflow-y-auto">
                      <div className="-mt-16 mb-4 flex flex-col items-center">
                         <div className="h-28 w-28 rounded-3xl border-4 border-white dark:border-gray-800 bg-white shadow-xl flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white transform rotate-3 hover:rotate-0 transition-transform duration-300">
                            {selectedUser.name?.[0]?.toUpperCase()}
                         </div>
                         <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4 text-center">{selectedUser.name}</h2>
                         <p className="text-sm text-gray-500 font-medium">{selectedUser.designation}</p>
                         <div className="flex gap-2 mt-3">
                             <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${selectedUser.status === 'In Work' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                 {selectedUser.status}
                             </div>
                             <div className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-gray-100 text-gray-600 border-gray-200">
                                 Shift {selectedUser.shift}
                             </div>
                         </div>
                      </div>

                      <div className="space-y-4 mt-4">
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Employee Code</p>
                              <p className="font-mono font-bold dark:text-white">{selectedUser.empCode}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Contact</p>
                              <p className="font-bold text-sm dark:text-white">{selectedUser.mobile}</p>
                              <p className="text-xs text-gray-400 truncate">{selectedUser.email}</p>
                          </div>
                          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Location</p>
                              <p className="font-bold text-sm dark:text-white flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500"/> {selectedUser.terminal}</p>
                          </div>
                       </div>
                   </div>

                   {/* RIGHT SIDE: Content Tabs */}
                   <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
                       {/* Tabs */}
                       <div className="flex border-b border-gray-100 dark:border-gray-800 px-6">
                           <button 
                             onClick={() => setActiveTab('overview')}
                             className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                           >
                               <UserIcon className="h-4 w-4" /> Overview
                           </button>
                           <button 
                             onClick={() => setActiveTab('salary')}
                             className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'salary' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                           >
                               <Wallet className="h-4 w-4" /> Salary & Finance
                           </button>
                       </div>

                       {/* Content Area */}
                       <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/50 dark:bg-gray-900">
                           {activeTab === 'overview' && (
                               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                   <div className="grid grid-cols-2 gap-4">
                                       <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                           <div className="h-8 w-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-2"><FileText className="h-4 w-4"/></div>
                                           <p className="text-xs text-gray-400 font-bold uppercase">Iqama Number</p>
                                           <p className="text-lg font-bold dark:text-white font-mono">{selectedUser.iqamaNumber || 'Not Set'}</p>
                                       </div>
                                       <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                           <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2"><FileText className="h-4 w-4"/></div>
                                           <p className="text-xs text-gray-400 font-bold uppercase">Passport Number</p>
                                           <p className="text-lg font-bold dark:text-white font-mono">{selectedUser.passportNumber || 'Not Set'}</p>
                                       </div>
                                   </div>
                                   <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                       <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><CheckCircle className="h-4 w-4"/> Employment Status</h4>
                                       <p className="text-sm text-blue-600 dark:text-blue-400">
                                           This employee is currently <span className="font-bold">{selectedUser.status}</span> and assigned to the <span className="font-bold">{selectedUser.shift} Shift</span> at <span className="font-bold">{selectedUser.terminal}</span>.
                                       </p>
                                   </div>
                               </div>
                           )}

                           {activeTab === 'salary' && (
                               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                   {salaryLoading ? (
                                       <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]"/></div>
                                   ) : !salaryData ? (
                                       <div className="text-center p-10 text-gray-400">No Salary Data Available</div>
                                   ) : (
                                       <>
                                           {/* Stats Cards */}
                                           <div className="grid grid-cols-2 gap-4">
                                               <div className="p-5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg shadow-green-500/20">
                                                   <p className="text-xs font-bold uppercase opacity-80 mb-1">Total Earnings</p>
                                                   <p className="text-2xl font-black">{salaryData.stats.totalEarned.toLocaleString()} <span className="text-sm font-normal">SAR</span></p>
                                               </div>
                                               <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                                   <p className="text-xs font-bold text-gray-400 uppercase mb-1">Present Days</p>
                                                   <p className="text-2xl font-black dark:text-white">{salaryData.stats.presentDays} <span className="text-sm font-normal text-gray-400">/ {salaryData.stats.totalDays}</span></p>
                                               </div>
                                           </div>

                                           {/* Detailed Log */}
                                           <div>
                                               <h4 className="font-bold mb-3 flex items-center gap-2 dark:text-white"><List className="h-4 w-4"/> Payment History</h4>
                                               <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                                   <div className="max-h-60 overflow-y-auto">
                                                       <table className="w-full text-left text-sm">
                                                           <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] uppercase text-gray-500 font-bold sticky top-0">
                                                               <tr>
                                                                   <th className="px-4 py-3">Date</th>
                                                                   <th className="px-4 py-3">Status</th>
                                                                   <th className="px-4 py-3">Room</th>
                                                                   <th className="px-4 py-3 text-right">Amount</th>
                                                               </tr>
                                                           </thead>
                                                           <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                                               {salaryData.history.map((log, i) => (
                                                                   <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                                       <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">{log.date.split('T')[0]}</td>
                                                                       <td className="px-4 py-3">
                                                                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${['Present','On Duty'].includes(log.status) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                               {log.status}
                                                                           </span>
                                                                       </td>
                                                                       <td className="px-4 py-3 text-gray-500">{log.roomNumber}</td>
                                                                       <td className="px-4 py-3 text-right font-bold font-mono dark:text-white">
                                                                           {log.amount > 0 ? `+${log.amount}` : '-'}
                                                                       </td>
                                                                   </tr>
                                                               ))}
                                                               {salaryData.history.length === 0 && (
                                                                   <tr><td colSpan="4" className="p-4 text-center text-gray-400 text-xs">No records found</td></tr>
                                                               )}
                                                           </tbody>
                                                       </table>
                                                   </div>
                                               </div>
                                           </div>
                                       </>
                                   )}
                               </div>
                           )}
                       </div>
                   </div>
                </div>
            </div>
         </div>
      )}

       {/* IMPORT PREVIEW MODAL */}
       {isImportPreviewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-gray-900 w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-[90vh]">
                 <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                     <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                           <Upload className="h-5 w-5 text-green-600" /> Review Import Data
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                           Review and edit users before importing. {importPreviewData.filter(d=>d.isValid).length} ready to import.
                        </p>
                     </div>
                     <button onClick={() => setIsImportPreviewOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="h-5 w-5" /></button>
                 </div>

                 <div className="flex-1 overflow-auto p-0">
                     <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                             {/* Bulk Update Header Row */}
                             <tr className="bg-blue-50/30 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/20">
                                 <td colSpan="5" className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                                    Set All To:
                                 </td>
                                 <td className="px-4 py-2">
                                     <select 
                                         onChange={(e) => {
                                             if(confirm(`Set Shift to ${e.target.value} for ALL users?`)) {
                                                 setImportPreviewData(prev => prev.map(r => ({ ...r, shift: e.target.value })));
                                             }
                                         }}
                                         className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 text-xs font-bold text-blue-600 outline-none cursor-pointer shadow-sm w-full"
                                         value=""
                                     >
                                         <option value="" disabled>Shift...</option>
                                         <option value="A">Shift A</option>
                                         <option value="B">Shift B</option>
                                     </select>
                                 </td>
                                 <td className="px-4 py-2">
                                      <select 
                                         onChange={(e) => {
                                             if(confirm(`Set Terminal to ${e.target.value} for ALL users?`)) {
                                                 setImportPreviewData(prev => prev.map(r => ({ ...r, terminal: e.target.value })));
                                             }
                                         }}
                                         className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 text-xs font-bold text-purple-600 outline-none cursor-pointer shadow-sm w-28"
                                         value=""
                                     >
                                         <option value="" disabled>Terminal...</option>
                                         <option value="Hajj Terminal">Hajj</option>
                                         <option value="New Terminal">New</option>
                                         <option value="North Terminal">North</option>
                                     </select>
                                 </td>
                                 <td className="px-4 py-2"></td>
                             </tr>
                            <tr>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Name <span className="text-red-500">*</span></th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Iqama <span className="text-red-500">*</span></th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Designation</th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Shift</th>
                                <th className="px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Terminal</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                             {importPreviewData.map((row, index) => (
                                 <tr key={row.tempId} className={`hover:bg-blue-50/50 ${row.isValid ? (row.isUpdate ? 'bg-purple-50/50' : '') : (row.isDuplicate ? 'bg-orange-50/50' : 'bg-red-50/50')}`}>
                                    <td className="px-4 py-2 text-center">
                                       {row.isValid 
                                         ? (row.isUpdate 
                                             ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">Update Available</span>
                                             : <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Pending</span>
                                           )
                                         : row.isDuplicate
                                            ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">Already Exists</span>
                                            : <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Invalid</span>
                                       }
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                          type="text" 
                                          value={row.name} 
                                          onChange={(e) => handleUpdatePreviewRow(index, 'name', e.target.value)}
                                          className={`w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold ${!row.name ? 'placeholder-red-400' : ''}`}
                                          placeholder="Required"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                          type="text" 
                                          value={row.iqamaNumber} 
                                          onChange={(e) => handleUpdatePreviewRow(index, 'iqamaNumber', e.target.value)}
                                          className={`w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-mono ${!row.iqamaNumber ? 'placeholder-red-400' : ''}`}
                                          placeholder="Required"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                          type="text" 
                                          value={row.empCode} 
                                          onChange={(e) => handleUpdatePreviewRow(index, 'empCode', e.target.value)}
                                          className="w-20 bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-500"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                          type="text" 
                                          value={row.designation} 
                                          onChange={(e) => handleUpdatePreviewRow(index, 'designation', e.target.value)}
                                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-500"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <select 
                                           value={row.shift} 
                                           onChange={(e) => handleUpdatePreviewRow(index, 'shift', e.target.value)}
                                           className="bg-transparent border-none focus:ring-0 p-0 text-xs cursor-pointer"
                                        >
                                            <option value="A">A</option><option value="B">B</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-2">
                                        <select 
                                           value={row.terminal} 
                                           onChange={(e) => handleUpdatePreviewRow(index, 'terminal', e.target.value)}
                                           className="bg-transparent border-none focus:ring-0 p-0 text-xs cursor-pointer w-24"
                                        >
                                            <option value="Hajj Terminal">Hajj</option><option value="New Terminal">New</option><option value="North Terminal">North</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button onClick={() => handleRemovePreviewRow(index)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                                    </td>
                                 </tr>
                             ))}
                        </tbody>
                     </table>
                 </div>

                 <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                     <button 
                        onClick={() => { setIsImportPreviewOpen(false); setImportPreviewData([]); }} 
                        className="px-6 py-2.5 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
                     >
                        Cancel Import
                     </button>
                     <button 
                         onClick={handleFinalizeImport} 
                         disabled={isSubmitting || importPreviewData.filter(d=>d.isValid).length === 0}
                         className="px-6 py-2.5 text-sm font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                         {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4" />}
                         Complete Import ({importPreviewData.filter(d=>d.isValid).length})
                     </button>
                 </div>
             </div>
          </div>
       )}

    </div>
  );
}
