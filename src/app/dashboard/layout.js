"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, Users, ShoppingCart, Filter, Settings, LogOut, Menu, X, Sun, Moon, Laptop,
  User, CalendarClock, Briefcase, FileText, MessageSquare, ClipboardList, Search, Bell
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

function ModeToggle() {
  const { setTheme } = useTheme()
  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      <button onClick={() => setTheme("light")} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label="Light Mode"><Sun className="h-3.5 w-3.5" /></button>
      <button onClick={() => setTheme("dark")} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label="Dark Mode"><Moon className="h-3.5 w-3.5" /></button>
      <button onClick={() => setTheme("system")} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label="System Mode"><Laptop className="h-3.5 w-3.5" /></button>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Links based on the user request
  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/attendance", label: "Attendance management", icon: CalendarClock },
    { href: "/dashboard/users", label: "User management", icon: Users },
    { href: "/dashboard/salary", label: "Salary management", icon: Briefcase },
    { href: "/dashboard/money", label: "Money management", icon: Filter }, // Using Filter as placeholder, maybe change to something generic like Wallet/Banknote
    { href: "/dashboard/trolley", label: "Total management", icon: ShoppingCart }, // User said "Totel", assumed Total/Trolley. prompt says "Totel management"
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f3f4f6] dark:bg-slate-950">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[var(--sidebar)] text-white shadow-md z-50">
        <div className="font-bold text-lg flex items-center gap-2">
           <LayoutDashboard className="h-6 w-6" /> UMCC
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar - Matching Reference but with requested Theme colors */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } border-r border-gray-100 dark:border-gray-800`}
      >
        <div className="h-full flex flex-col">
          {/* Brand */}
          <div className="h-20 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-[var(--primary)] p-2 rounded-lg text-white">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-xl leading-none">UMCC</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Trolley Services</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href; // Using strict equality for demo, technically startsWith might be better
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                    isActive 
                      ? "bg-gray-100 dark:bg-gray-800 text-[var(--primary)] dark:text-white shadow-sm font-bold" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-[var(--primary)] dark:text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"} transition-colors`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User & Toggle */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
             <div className="flex items-center justify-between mb-4">
                 <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Theme</span>
                 <ModeToggle />
             </div>
             <button
               onClick={() => signOut({ callbackUrl: '/' })}
               className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
        {/* Top Header */}
        <header className="h-20 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-between px-6 md:px-10 shadow-sm z-20 border-b border-gray-100 dark:border-gray-800">
            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                       type="text" 
                       placeholder="Search..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                </button>
                
                <div className="flex items-center gap-3 pl-6 border-l border-gray-100 dark:border-gray-800">
                    <div className="h-9 w-9 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-white dark:ring-gray-800">
                        {session?.user?.name?.[0] || "U"}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-semibold leading-tight">{session?.user?.name || "Luke Asote"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Admin for Associations</p>
                    </div>
                </div>
            </div>
        </header>
        
        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f9fc] dark:bg-slate-900 scroll-smooth">
            {children}
        </div>
      </main>
    </div>
  );
}
