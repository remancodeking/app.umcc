"use client"

import { useSession } from "next-auth/react";
import { User, Mail, Phone, MapPin, Save, Camera } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Profile</h2>
        <button className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
          <div className="relative mb-4 group cursor-pointer">
            <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-1">
              <div className="h-full w-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-4xl font-bold text-gray-500 overflow-hidden">
                {session?.user?.name?.[0] || <User className="h-12 w-12" />}
              </div>
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <Camera className="h-8 w-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold">{session?.user?.name || "User Name"}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{session?.user?.role || "Role"}</p>
        </div>

        {/* Info Form */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-6">Personal Information</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 sc:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Full Name</label>
                  <div className="relative">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                     <input type="text" defaultValue={session?.user?.name} className="w-full pl-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Email Address</label>
                  <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                     <input type="email" defaultValue={session?.user?.email} className="w-full pl-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Phone Number</label>
                  <div className="relative">
                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                     <input type="tel" placeholder="+966 50 123 4567" className="w-full pl-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Location</label>
                  <div className="relative">
                     <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                     <input type="text" placeholder="Riyadh, Saudi Arabia" className="w-full pl-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
               </div>
            </div>
            
            <div className="pt-4">
                <label className="block text-sm font-medium mb-1.5 text-gray-700 dark:text-gray-300">Bio</label>
                <textarea rows="4" className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Tell us about yourself..."></textarea>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
