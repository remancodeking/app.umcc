"use client"

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  LayoutDashboard, Users, ShoppingCart, Filter, Settings, LogOut, Menu, X, Sun, Moon, Laptop,
  User, CalendarClock, Briefcase, FileText, MessageSquare, ClipboardList, Search, Bell, Home,
  ChevronLeft, ChevronRight, DollarSign
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

function ModeToggle({ collapsed }) {
  const { setTheme } = useTheme()
  return (
    <div className={`flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg ${collapsed ? 'flex-col' : 'flex-row'}`}>
      <button onClick={() => setTheme("light")} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label="Light Mode"><Sun className="h-4 w-4" /></button>
      <button onClick={() => setTheme("dark")} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label="Dark Mode"><Moon className="h-4 w-4" /></button>
      <button onClick={() => setTheme("system")} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition" aria-label="System Mode"><Laptop className="h-4 w-4" /></button>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse state
  const [searchQuery, setSearchQuery] = useState("");

  // Role Protection
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
       router.push('/auth/login');
       return;
    }

    const { role } = session.user || {};
    
    // If role is 'User', redirect to homepage
    if (role === 'User') {
        router.push('/');
        return;
    }

    // Previous check for Admin/Cashier check is removed to allow Employee etc to dashboard
    // if (role !== 'Admin' && role !== 'Cashier') { ... }

  }, [session, status, router]);

  // Links based on the user request
  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/attendance", label: "Attendance management", icon: CalendarClock },
    { href: "/dashboard/users", label: "User management", icon: Users },
    { href: "/dashboard/rooms", label: "Room Grouping", icon: Home },
    { href: "/dashboard/salary", label: "Salary management", icon: Briefcase },
    { href: "/dashboard/salary/disbursement", label: "Salary Disbursement", icon: DollarSign }, // ADDED 
    { href: "/dashboard/money", label: "Money management", icon: Filter }, 
    { href: "/dashboard/trolley", label: "Total management", icon: ShoppingCart },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  if (status === "loading") {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950"><div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div></div>;
  }

  // Prevent flash of content for authorized
  if (!session) {
      return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f3f4f6] dark:bg-slate-950 transition-colors duration-300">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[var(--sidebar)] text-white shadow-md z-50">
        <div className="font-bold text-lg flex items-center gap-2">
           <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-white/20 bg-white">
               <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
           </div>
           UMCC
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-2xl transform transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-20" : "w-72"} border-r border-gray-100 dark:border-gray-800 flex flex-col`}
      >
        <div className="h-full flex flex-col">
          {/* Brand */}
          <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6'} border-b border-gray-100 dark:border-gray-800 transition-all duration-300`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative h-10 w-10 shrink-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                 <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
              </div>
              {!isCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="whitespace-nowrap"
                  >
                    <h1 className="font-bold text-xl leading-none tracking-tight">UMCC</h1>
                    <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider mt-0.5">Sharakat Al Harak</p>
                  </motion.div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  title={isCollapsed ? link.label : ""}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                    isActive 
                      ? "bg-gray-100 dark:bg-gray-800 text-[var(--primary)] dark:text-white shadow-sm font-bold" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[var(--primary)] dark:text-white" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"} transition-colors`} />
                  
                  {!isCollapsed && (
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{link.label}</span>
                  )}

                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && (
                      <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                          {link.label}
                      </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
             {/* Toggle Button */}
             <button 
                onClick={() => setIsCollapsed(!isCollapsed)} 
                className="hidden md:flex w-full items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
             >
                {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <div className="flex items-center gap-2 text-xs font-bold uppercase"><ChevronLeft className="h-4 w-4" /> <span>Collapse</span></div>}
             </button>

             <div className="flex items-center justify-center">
                 <ModeToggle collapsed={isCollapsed} />
             </div>
             
             <button
               onClick={() => signOut({ callbackUrl: '/' })}
               className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
               title="Sign Out"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-all duration-300">
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
                    <div className="h-9 w-9 bg-gradient-to-tr from-[#D4AF37] to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-white dark:ring-gray-800">
                        {session?.user?.name?.[0] || "U"}
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-semibold leading-tight">{session?.user?.name || "User"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.role || "Employee"}</p>
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
