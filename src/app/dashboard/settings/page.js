"use client"

import { Bell, Shield, Smartphone, Globe, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
         <h2 className="text-2xl font-bold">Settings</h2>
         <p className="text-muted-foreground">Manage your application preferences and security.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
         
         {/* Notifications */}
         <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
               <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                  <Bell className="h-5 w-5" />
               </div>
               <div>
                  <h3 className="font-semibold text-lg">Notifications</h3>
                  <p className="text-sm text-gray-500">Manage how you receive alerts.</p>
               </div>
            </div>
            <div className="space-y-4 pl-14">
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Email Alerts</span>
                  <input type="checkbox" defaultChecked className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Push Notifications</span>
                  <input type="checkbox" defaultChecked className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
               </div>
            </div>
         </div>

         {/* Appearance */}
         <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
               <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                  <Moon className="h-5 w-5" />
               </div>
               <div>
                  <h3 className="font-semibold text-lg">Appearance</h3>
                  <p className="text-sm text-gray-500">Customize the look and feel.</p>
               </div>
            </div>
            <div className="pl-14 flex gap-4">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-3 px-4 border rounded-xl text-sm font-medium transition-all ${
                     theme === 'light' ? 'border-[var(--primary)] ring-1 ring-[var(--primary)] bg-[var(--primary)] text-white' : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Light
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-3 px-4 border rounded-xl text-sm font-medium transition-all ${
                     theme === 'dark' ? 'border-[var(--primary)] ring-1 ring-[var(--primary)] bg-[var(--primary)] text-white' : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  Dark
                </button>
                <button 
                  onClick={() => setTheme('system')}
                  className={`flex-1 py-3 px-4 border rounded-xl text-sm font-medium transition-all ${
                     theme === 'system' ? 'border-[var(--primary)] ring-1 ring-[var(--primary)] bg-[var(--primary)] text-white' : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  System
                </button>
            </div>
         </div>

         {/* Security */}
         <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
               <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                  <Shield className="h-5 w-5" />
               </div>
               <div>
                  <h3 className="font-semibold text-lg">Security</h3>
                  <p className="text-sm text-gray-500">Protect your account.</p>
               </div>
            </div>
            <div className="pl-14">
                <button className="text-blue-600 hover:underline text-sm font-medium">Change Password</button>
            </div>
         </div>

      </div>
    </div>
  );
}
