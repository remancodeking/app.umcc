"use client"

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { Home, Wallet, CalendarClock, User, Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export default function EmployeeLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
    } else if (session.user.role !== 'Employee' && session.user.role !== 'Admin') {
       // Allow Admins to preview, but primarily for Employees
       // If strictly restricting:
       // router.push('/dashboard'); 
    }
  }, [session, status, router]);

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
         <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!session) return null;

  const navItems = [
    { href: '/employee', label: 'Home', icon: Home },
    { href: '/employee/money', label: 'Money', icon: Wallet },
    { href: '/employee/attendance', label: 'Time', icon: CalendarClock },
    { href: '/employee/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black font-sans flex justify-center">
       {/* Main Content Container - iPhone styled frame on Desktop, Full on Mobile */}
       <div className="w-full max-w-md bg-white dark:bg-black min-h-screen relative shadow-2xl flex flex-col">
           <Toaster position="top-center" />
           
           {/* Scrollable Content Area */}
           <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
              {children}
           </main>

           {/* Bottom Navigation */}
           <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
              <div className="max-w-md mx-auto pointer-events-auto">
                  <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 flex items-center justify-around h-20 pb-4 safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                     {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                           <Link 
                             key={item.href} 
                             href={item.href}
                             replace
                             className={`relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 group`}
                           >
                              {/* Active Indicator Line */}
                              {isActive && (
                                <span className="absolute -top-[1px] w-12 h-[3px] bg-indigo-500 rounded-b-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                              )}
                              
                              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? '-translate-y-1' : 'group-hover:bg-gray-50 dark:group-hover:bg-gray-800'}`}>
                                <Icon 
                                  className={`w-6 h-6 transition-all duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-900/30' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} 
                                  strokeWidth={isActive ? 2.5 : 2} 
                                />
                              </div>
                              <span className={`text-[10px] font-bold transition-all duration-300 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                                {item.label}
                              </span>
                           </Link>
                        );
                     })}
                  </div>
              </div>
           </nav>
       </div>
    </div>
  );
}
