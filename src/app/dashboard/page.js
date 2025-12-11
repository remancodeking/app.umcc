"use client"

import { useTheme } from "next-themes";
import { 
  Users, CheckCircle, Clock, AlertCircle, ShoppingCart, 
  TrendingUp, TrendingDown, DollarSign, Calendar
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

const ATTENDANCE_DATA = [
  { name: 'Mon', present: 45, absent: 5, late: 2 },
  { name: 'Tue', present: 48, absent: 2, late: 1 },
  { name: 'Wed', present: 47, absent: 3, late: 2 },
  { name: 'Thu', present: 44, absent: 6, late: 5 },
  { name: 'Fri', present: 49, absent: 1, late: 0 },
  { name: 'Sat', present: 46, absent: 4, late: 2 },
  { name: 'Sun', present: 40, absent: 10, late: 0 },
];

const SHIFT_DATA = [
  { name: 'Shift A', value: 60, color: '#6366f1' },
  { name: 'Shift B', value: 40, color: '#ec4899' },
];

const StatCard = ({ title, value, subtext, icon: Icon, trend }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-gray-100">{value}</h3>
      <div className={`mt-2 flex items-center text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        <span>{subtext}</span>
      </div>
    </div>
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white">
      <Icon className="h-5 w-5" />
    </div>
  </div>
);

export default function DashboardPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
         <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
         <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back, here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value="124" subtext="+4% from last month" icon={Users} trend="up" />
        <StatCard title="On Duty" value="98" subtext="Active today" icon={CheckCircle} trend="up" />
        <StatCard title="Total Trolleys" value="2,543" subtext="-12 needing repair" icon={ShoppingCart} trend="down" />
        <StatCard title="Revenue (Daily)" value="SAR 12k" subtext="+8% increase" icon={DollarSign} trend="up" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Weekly Attendance</h3>
           <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={ATTENDANCE_DATA} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Bar dataKey="present" name="Present" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Shift Distribution */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Shift Distribution</h3>
           <div className="h-[300px] w-full flex flex-col items-center justify-center">
             <ResponsiveContainer width="100%" height={200}>
               <PieChart>
                  <Pie
                    data={SHIFT_DATA}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {SHIFT_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
               </PieChart>
             </ResponsiveContainer>
             <div className="flex gap-6 mt-4">
                {SHIFT_DATA.map((item) => (
                   <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.name} ({item.value}%)</span>
                   </div>
                ))}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
