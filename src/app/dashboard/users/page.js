"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  UserPlus, Search, Filter, MoreHorizontal, FileText, CheckCircle, 
  XCircle, X, Loader2, LayoutGrid, List, Eye, Edit, Trash
} from "lucide-react";
import toast from 'react-hot-toast';

export default function UserManagementPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table"); 
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false); // Unified modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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

  // ... (existing helper functions)

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

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
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
                     <div className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50">
                        <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">Role</span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{user.role}</span>
                     </div>
                  </div>

                  <div className="mt-5 pt-4 flex items-center justify-between text-xs text-gray-400 font-mono bg-gray-50 dark:bg-gray-800/50 -mx-6 -mb-6 px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                     <span>Code: {user.empCode || 'N/A'}</span>
                     <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {user.mobile}</span>
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

      {/* View User Modal */}
      {isViewModalOpen && selectedUser && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
               
               {/* Header Background */}
               <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative">
                  <button onClick={() => setIsViewModalOpen(false)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-gray-900 dark:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
               </div>

               <div className="px-6 pb-6 -mt-12 relative flex-1 overflow-y-auto custom-scrollbar">
                  {/* Profile Header */}
                  <div className="flex flex-col items-center mb-6">
                     <div className="h-24 w-24 rounded-full border-[4px] border-white dark:border-gray-900 bg-white shadow-lg flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-[var(--primary)] to-indigo-600 text-white">
                        {selectedUser.name?.[0]?.toUpperCase()}
                     </div>
                     <div className="text-center mt-3">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                           {selectedUser.name}
                        </h2>
                        <div className="flex items-center justify-center gap-2 mt-2">
                           <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                              {selectedUser.designation}
                           </span>
                           <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                              selectedUser.status === 'In Work' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' 
                              : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400'
                           }`}>
                              {selectedUser.status}
                           </span>
                        </div>
                     </div>
                  </div>
                  
                  {/* Details Grid */}
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-[var(--primary)]/20 transition-colors">
                           <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Role</span>
                           <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{selectedUser.role}</p>
                        </div>
                        <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-[var(--primary)]/20 transition-colors">
                           <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Shift</span>
                           <p className="font-semibold text-gray-900 dark:text-white mt-0.5 flex items-center gap-2">
                              Shift {selectedUser.shift}
                              <span className={`w-2 h-2 rounded-full ${selectedUser.shift === 'A' ? 'bg-indigo-500' : 'bg-pink-500'}`}></span>
                           </p>
                        </div>
                        <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-[var(--primary)]/20 transition-colors col-span-2">
                           <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Terminal Location</span>
                           <p className="font-semibold text-gray-900 dark:text-white mt-0.5 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-[var(--primary)]" />
                              {selectedUser.terminal}
                           </p>
                        </div>
                     </div>
                     
                     <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-1">
                        <div className="space-y-1">
                           <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><UserPlus className="h-4 w-4" /></div>
                                 <div>
                                    <p className="text-xs text-gray-500">Employee Codes</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">SM:{selectedUser.sm} • {selectedUser.empCode}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg"><CheckCircle className="h-4 w-4" /></div>
                                 <div className="flex-1">
                                    <p className="text-xs text-gray-500">Contact Info</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedUser.mobile}</p>
                                    <p className="text-xs text-gray-400">{selectedUser.email || 'No email provided'}</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><FileText className="h-4 w-4" /></div>
                                 <div>
                                    <p className="text-xs text-gray-500">Documents</p>
                                    <div className="flex gap-4">
                                       <div>
                                          <span className="text-[10px] text-gray-400 uppercase">Iqama</span>
                                          <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{selectedUser.iqamaNumber || '-'}</p>
                                       </div>
                                       <div>
                                          <span className="text-[10px] text-gray-400 uppercase">Passport</span>
                                          <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{selectedUser.passportNumber || '-'}</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
