"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  UserPlus, Search, Filter, MoreHorizontal, FileText, CheckCircle, 
  XCircle, X, Loader2, LayoutGrid, List, Eye, Edit, Trash,
  DollarSign, TrendingUp, Calendar, Wallet, User as UserIcon
} from "lucide-react";
import toast from 'react-hot-toast';

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
  
  // Form State
  const initialFormState = {
    id: null,
    name: "", mobile: "", email: "", password: "", role: "Employee",
    sm: "", empCode: "", designation: "Porter", shift: "A", 
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
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
    if (!formData.password && !formData.id) newErrors.password = "Password is required for new users";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
       newErrors.email = "Invalid email address";
    }
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

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.empCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.sm?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage employees, roles, and shifts.</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
               <button 
                 onClick={() => setViewMode("table")}
                 className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
               >
                 <List className="h-4 w-4" />
               </button>
               <button 
                 onClick={() => setViewMode("grid")}
                 className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
               >
                 <LayoutGrid className="h-4 w-4" />
               </button>
            </div>

            <div className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full font-medium">
               {session?.user?.role || 'User'}
            </div>
            
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity font-medium shadow-lg shadow-gray-200 dark:shadow-none"
            >
               <UserPlus className="h-4 w-4" /> Add Employee
            </button>
         </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Name, Emp Code, or SM..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg focus:ring-2 focus:ring-[var(--primary)]/20 outline-none transition-all"
            />
         </div>
         <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Filter className="h-4 w-4" /> Filter
         </button>
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
           <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-1">Get started by adding a new employee to your organization.</p>
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
                         <th className="px-6 py-4">Employee</th>
                         <th className="px-6 py-4">Status & Role</th>
                         <th className="px-6 py-4">Location & Shift</th>
                         <th className="px-6 py-4">Contact</th>
                         <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {filteredUsers.map((user) => (
                         <tr key={user._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all duration-200 group">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                     <div className="flex items-center gap-2">
                                       <span className="text-sm font-bold text-gray-900 dark:text-white">{user.name}</span>
                                       {session?.user?.email === user.email && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100">YOU</span>}
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
                                  <span className="font-semibold text-gray-700 dark:text-gray-300">{user.mobile}</span>
                                  <span className="text-gray-400 mt-0.5">{user.email || 'No email'}</span>
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
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Mobile <span className="text-red-500">*</span></label>
                        <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} className={`w-full h-10 px-3 rounded-lg border ${errors.mobile ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] outline-none transition-all`} placeholder="e.g. +966..." />
                        {errors.mobile && <p className="text-xs text-red-500 font-medium">{errors.mobile}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full h-10 px-3 rounded-lg border ${errors.email ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] outline-none transition-all`} placeholder="john@example.com" />
                        {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password {formData.id && <span className="text-gray-400 font-normal">(Optional to update)</span>} {!formData.id && <span className="text-red-500">*</span>}</label>
                        <input type="password" name="password" value={formData.password} onChange={handleInputChange} className={`w-full h-10 px-3 rounded-lg border ${errors.password ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)] outline-none transition-all`} placeholder="••••••••" />
                        {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password}</p>}
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                      Employment Details
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-1"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300">SM Number</label><input type="text" name="sm" value={formData.sm} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none transition-all" /></div>
                      <div className="space-y-1"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Emp Code</label><input type="text" name="empCode" value={formData.empCode} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none transition-all" /></div>
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Role</label>
                         <div className="relative">
                           <select name="role" value={formData.role} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none appearance-none cursor-pointer">
                              <option value="Admin">Admin</option><option value="Cashier">Cashier</option><option value="Employee">Employee</option><option value="User">User</option>
                           </select>
                           <MoreHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none rotate-90" />
                         </div>
                      </div>
                      <div className="space-y-1">
                         <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Designation</label>
                         <div className="relative">
                            <select name="designation" value={formData.designation} onChange={handleInputChange} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none appearance-none cursor-pointer">
                                <option value="Porter">Porter</option><option value="Team Leader">Team Leader</option><option value="Supervisor">Supervisor</option><option value="Ground Operation Manager">Ground Operation Manager</option>
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
                       <div className="space-y-1"><label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Iqama / ID</label><input type="text" name="iqamaNumber" value={formData.iqamaNumber} onChange={handleInputChange} maxLength={10} className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-[var(--primary)]/50 outline-none transition-all" /></div>
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
    </div>
  );
}
