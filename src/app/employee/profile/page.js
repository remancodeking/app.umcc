"use client"

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, User, Phone, Shield, FileText, CreditCard, Hash } from 'lucide-react';
import Link from 'next/link';
import toast from "react-hot-toast";

export default function EmployeeProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
       // We'll reuse the existing /api/users endpoint to fetch full details
       // Assuming /api/users returns { users: [...] }
       fetch(`/api/users?search=${session.user.mobile || ''}`) // Try to filter if possible, or just fetch all and find (not efficient but works for now)
         .then(res => res.json())
         .then(data => {
            if (data.users) {
               const found = data.users.find(u => u._id === session.user.id);
               if (found) setProfile(found);
            }
         })
         .catch(err => console.error("Failed to load profile", err));
    }
  }, [session]);

  const user = profile || session?.user || {};

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen pb-24">
       {/* Header */}
       <header className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 px-6 pt-12 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
             <Link href="/employee" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
             </Link>
             <h1 className="text-xl font-black text-gray-900 dark:text-white">Profile</h1>
          </div>
       </header>

       <div className="px-6 mt-8">
          {/* Avatar Area */}
          <div className="flex flex-col items-center justify-center py-8">
             <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/30 mb-4">
                {user.name?.[0]}
             </div>
             <h2 className="text-2xl font-black text-gray-900 dark:text-white">{user.name}</h2>
             <p className="text-gray-500 font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs mt-2">{user.role}</p>
          </div>

          {/* Details */}
          <div className="space-y-4">
             <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500"><Hash className="w-5 h-5"/></div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase">Employee Code</p>
                   <p className="font-bold text-gray-900 dark:text-white">{user.empCode || 'N/A'}</p>
                </div>
             </div>

             <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500"><Phone className="w-5 h-5"/></div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase">Mobile</p>
                   <p className="font-bold text-gray-900 dark:text-white">{user.mobile || 'N/A'}</p>
                </div>
             </div>

             <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500"><FileText className="w-5 h-5"/></div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase">Iqama Number</p>
                   <p className="font-bold text-gray-900 dark:text-white">{user.iqamaNumber || 'N/A'}</p>
                </div>
             </div>

             <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500"><CreditCard className="w-5 h-5"/></div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase">Passport Number</p>
                   <p className="font-bold text-gray-900 dark:text-white">{user.passportNumber || 'N/A'}</p>
                </div>
             </div>
             
             <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500"><Shield className="w-5 h-5"/></div>
                <div>
                   <p className="text-xs font-bold text-gray-400 uppercase">Role</p>
                   <p className="font-bold text-gray-900 dark:text-white">{user.role}</p>
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="mt-8">
             <button 
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/10 dark:hover:bg-rose-900/20 text-rose-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
             >
                <LogOut className="w-5 h-5" />
                Sign Out
             </button>
          </div>

          <div className="text-center mt-8 px-8">
             <p className="text-xs text-gray-400">Version 1.0.0 • UMCC Application</p>
          </div>
       </div>
    </div>
  );
}
