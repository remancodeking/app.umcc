"use client";

import { useSession } from "next-auth/react";
import { User, Mail, Phone, Lock, Save, Camera, CheckCircle, Shield, Loader2, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPassSaving, setIsPassSaving] = useState(false);

  // Profile Form
  const { register: registerProfile, handleSubmit: handleProfileSubmit, setValue: setProfileValue, formState: { errors: profileErrors } } = useForm();
  
  // Password Form
  const { register: registerPass, handleSubmit: handlePassSubmit, reset: resetPass, watch: watchPass, formState: { errors: passErrors } } = useForm();

  // Fetch Data
  useEffect(() => {
     const fetchData = async () => {
         try {
             const res = await fetch('/api/profile');
             if(res.ok) {
                 const data = await res.json();
                 setProfileValue('name', data.name);
                 setProfileValue('email', data.email);
                 setProfileValue('mobile', data.mobile);
             }
         } catch(e) {
             console.error(e);
             toast.error("Failed to load profile data");
         } finally {
             setIsLoading(false);
         }
     };
     fetchData();
  }, [setProfileValue]);

  const onProfileUpdate = async (data) => {
      setIsSaving(true);
      try {
          const res = await fetch('/api/profile', {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(data)
          });
          
          if(res.ok) {
              const updated = await res.json();
              await updateSession({ ...session, user: { ...session?.user, name: updated.name, email: updated.email }});
              toast.success("Profile updated successfully");
          } else {
              const err = await res.json();
              toast.error(err.error || "Failed to update");
          }
      } catch(e) {
          toast.error("Error saving changes");
      } finally {
          setIsSaving(false);
      }
  };

  const onPasswordUpdate = async (data) => {
      if(data.newPassword !== data.confirmPassword) {
          toast.error("New passwords do not match");
          return;
      }
      
      setIsPassSaving(true);
      try {
          const res = await fetch('/api/profile', {
              method: 'PATCH',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ 
                  currentPassword: data.currentPassword,
                  newPassword: data.newPassword
              })
          });

          if(res.ok) {
              toast.success("Password changed successfully");
              resetPass();
          } else {
              const err = await res.json();
              toast.error(err.error || "Failed to change password");
          }
      } catch(e) {
          toast.error("Error changing password");
      } finally {
          setIsPassSaving(false);
      }
  };

  if(isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
            <h2 className="text-3xl font-bold dark:text-white">Account Settings</h2>
            <p className="text-gray-500 mt-1">Manage your profile details and security.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Avatar & Quick Stats */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-violet-600 opacity-10"></div>
                
                <div className="relative mb-4 group cursor-pointer z-10">
                    <div className="h-32 w-32 rounded-full p-1 bg-gradient-to-tr from-[var(--primary)] to-purple-500 shadow-xl">
                    <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-5xl font-bold text-gray-400 overflow-hidden">
                        {session?.user?.name?.[0]?.toUpperCase() || <User className="h-16 w-16" />}
                    </div>
                    </div>
                </div>
                
                <h3 className="text-2xl font-bold dark:text-white z-10">{session?.user?.name}</h3>
                <span className="inline-flex mt-2 items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 z-10">
                    <Shield className="h-3 w-3" /> {session?.user?.role}
                </span>

                <div className="mt-8 w-full grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <div className="text-center">
                        <p className="text-xs text-gray-400 uppercase font-bold">Shift</p>
                        <p className="font-bold text-lg dark:text-gray-200">{session?.user?.shift || 'N/A'}</p>
                    </div>
                    <div className="text-center border-l dark:border-gray-800">
                         <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                         <p className="font-bold text-lg text-green-500">Active</p>
                    </div>
                </div>
            </div>
            
            {/* Security Tip Card */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800/20">
                 <h4 className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400 mb-2">
                     <CheckCircle className="h-5 w-5" /> Account Verified
                 </h4>
                 <p className="text-sm text-emerald-700 dark:text-emerald-300 opacity-80 leading-relaxed">
                     Your account is active and fully verified. Remember to change your password regularly to keep your account secure.
                 </p>
            </div>
        </div>

        {/* RIGHT COLUMN: Forms */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Profile Information Form */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">Personal Information</h3>
                        <p className="text-sm text-gray-500">Update your personal details here.</p>
                    </div>
                </div>

                <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input 
                                    {...registerProfile("name", { required: "Name is required" })}
                                    className="w-full pl-10 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all font-medium dark:text-white" 
                                    placeholder="Enter your name"
                                />
                            </div>
                            {profileErrors.name && <p className="text-red-500 text-xs font-bold">{profileErrors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Mobile Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input 
                                    {...registerProfile("mobile", { required: "Mobile is required" })}
                                    className="w-full pl-10 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all font-medium dark:text-white" 
                                    placeholder="05..."
                                />
                            </div>
                            {profileErrors.mobile && <p className="text-red-500 text-xs font-bold">{profileErrors.mobile.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input 
                                {...registerProfile("email")}
                                type="email"
                                className="w-full pl-10 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all font-medium dark:text-white" 
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Change Form */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl">
                        <Lock className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">Security & Password</h3>
                        <p className="text-sm text-gray-500">Ensure your account is secure with a strong password.</p>
                    </div>
                </div>

                <form onSubmit={handlePassSubmit(onPasswordUpdate)} className="space-y-5">
                    <div className="space-y-2">
                         <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Current Password</label>
                         <div className="relative">
                             <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                             <input 
                                {...registerPass("currentPassword", { required: "Current password is required" })}
                                type="password" 
                                className="w-full pl-10 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all font-medium dark:text-white" 
                                placeholder="••••••••"
                             />
                         </div>
                         {passErrors.currentPassword && <p className="text-red-500 text-xs font-bold">{passErrors.currentPassword.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        <div className="space-y-2">
                             <label className="text-sm font-bold text-gray-700 dark:text-gray-300">New Password</label>
                             <div className="relative">
                                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                 <input 
                                    {...registerPass("newPassword", { 
                                        required: "New password is required",
                                        minLength: { value: 6, message: "Min 6 characters" } 
                                    })}
                                    type="password" 
                                    className="w-full pl-10 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all font-medium dark:text-white" 
                                    placeholder="••••••••"
                                 />
                             </div>
                             {passErrors.newPassword && <p className="text-red-500 text-xs font-bold">{passErrors.newPassword.message}</p>}
                        </div>
                        
                        <div className="space-y-2">
                             <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Confirm New Password</label>
                             <div className="relative">
                                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                 <input 
                                    {...registerPass("confirmPassword", { 
                                        required: "Confirm password is required",
                                        validate: (val) => val === watchPass('newPassword') || "Passwords do not match"
                                    })}
                                    type="password" 
                                    className="w-full pl-10 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all font-medium dark:text-white" 
                                    placeholder="••••••••"
                                 />
                             </div>
                             {passErrors.confirmPassword && <p className="text-red-500 text-xs font-bold">{passErrors.confirmPassword.message}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button 
                            type="submit" 
                            disabled={isPassSaving}
                            className="bg-gray-900 dark:bg-white dark:text-black text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isPassSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
