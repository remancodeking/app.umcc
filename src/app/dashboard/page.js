"use client"

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, ComposedChart, Line
} from 'recharts';
import { Calendar, Printer, TrendingUp, Users, DollarSign, Briefcase, AlertTriangle, ArrowDownRight, ArrowUpRight, Coins } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Date State
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
     setLoading(true);
     try {
       const res = await fetch(`/api/dashboard/analytics?start=${startDate}&end=${endDate}`);
       if (res.ok) {
          setData(await res.json());
       } else {
          toast.error("Failed to load analytics");
       }
     } catch (e) {
       console.error(e);
     } finally {
       setLoading(false);
     }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

  if (loading && !data) return <div className="p-10 flex justify-center"><div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>;

  return (
    <div className="space-y-8 pb-20">
       {/* Header & Controls */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
             <h1 className="text-3xl font-black text-gray-900 dark:text-white">Executive Dashboard</h1>
             <p className="text-gray-500 dark:text-gray-400">Detailed operational intelligence & financial reporting.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="bg-transparent text-sm font-medium outline-none text-gray-700 dark:text-gray-200"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-sm font-medium outline-none text-gray-700 dark:text-gray-200"
                />
             </div>
             
             <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all print:hidden"
             >
                <Printer className="w-4 h-4" />
                Print Report
             </button>
          </div>
       </div>

       {/* Printable Header */}
       <div className="hidden print:block mb-8 border-b pb-4">
           <div className="flex justify-between items-end">
               <div>
                 <h1 className="text-4xl font-black text-black">UMCC Operational Report</h1>
                 <p className="text-gray-600 mt-2">Analytical Overview & Financial Statement</p>
               </div>
               <div className="text-right">
                   <p className="font-bold text-sm text-gray-500">PERIOD</p>
                   <p className="text-xl font-bold">{format(new Date(startDate), 'dd MMM yyyy')} - {format(new Date(endDate), 'dd MMM yyyy')}</p>
               </div>
           </div>
       </div>

       <div className="space-y-8">
          
          {/* TOP TIER: CRITICAL KPI Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {/* Total Revenue */}
             <div className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-indigo-100 dark:border-gray-800 shadow-xl shadow-indigo-100/50 dark:shadow-none relative overflow-hidden group print:border-gray-300">
                 <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                         <DollarSign className="w-6 h-6" />
                     </div>
                     <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase rounded-lg">High Priority</span>
                 </div>
                 <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{data?.kpi?.totalRevenue?.toLocaleString()}</h3>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
             </div>

             {/* Net Profit */}
             <div className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-emerald-100 dark:border-gray-800 shadow-xl shadow-emerald-100/50 dark:shadow-none relative overflow-hidden print:border-gray-300">
                 <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
                         <Briefcase className="w-6 h-6" />
                     </div>
                 </div>
                 <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">{data?.kpi?.totalNet?.toLocaleString()}</h3>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Net Profit</p>
                 <p className="text-[10px] text-gray-400 mt-2">After all deductions</p>
             </div>

             {/* Staff Efficiency */}
             <div className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-amber-100 dark:border-gray-800 shadow-xl shadow-amber-100/50 dark:shadow-none relative overflow-hidden print:border-gray-300">
                 <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600 dark:text-amber-400">
                         <TrendingUp className="w-6 h-6" />
                     </div>
                     <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{data?.kpi?.attendanceRate}%</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Attendance</span>
                     </div>
                 </div>
                 <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{data?.kpi?.staffEfficiency?.toLocaleString()} <span className="text-sm text-gray-400 font-normal">SAR</span></h3>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Revenue / Staff</p>
             </div>

             {/* Foreign Currency */}
             <div className="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-blue-100 dark:border-gray-800 shadow-xl shadow-blue-100/50 dark:shadow-none relative overflow-hidden print:border-gray-300">
                 <div className="flex justify-between items-start mb-4">
                     <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
                         <Coins className="w-6 h-6" />
                     </div>
                 </div>
                 <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{data?.kpi?.foreignCurrencyTotal?.toLocaleString()} <span className="text-sm text-gray-400 font-normal">SAR</span></h3>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Foreign Currency</p>
                 <p className="text-[10px] text-gray-400 mt-2">Est. Conversion Value</p>
             </div>
          </div>

          {/* SECOND TIER: Detailed Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block print:space-y-8">
             
             {/* Trend & Cost Analysis */}
             <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm print:break-inside-avoid print:border-gray-300">
                 <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Financial Performance Trend</h3>
                    <p className="text-sm text-gray-500">Revenue (Primary) vs Operational Expenses (Secondary)</p>
                 </div>
                 <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={data?.charts?.dailyTrend}>
                          <defs>
                             <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(str) => format(new Date(str), 'd MMM')} />
                          <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                          <Legend />
                          <Area yAxisId="left" type="monotone" dataKey="amount" name="Revenue" stroke="#6366f1" strokeWidth={3} fill="url(#colorRev)" />
                          <Line yAxisId="right" type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                       </ComposedChart>
                    </ResponsiveContainer>
                 </div>
             </div>

             {/* Sources Breakdown */}
             <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm print:break-inside-avoid print:border-gray-300">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Revenue Streams</h3>
                 <p className="text-sm text-gray-500 mb-8">Breakdown by operation zone & type</p>
                 <div className="h-[300px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie
                             data={data?.charts?.revenuePieData}
                             cx="50%"
                             cy="50%"
                             innerRadius={80}
                             outerRadius={100}
                             paddingAngle={2}
                             dataKey="value"
                          >
                             {data?.charts?.revenuePieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                          </Pie>
                          <Tooltip />
                       </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-3xl font-black text-gray-900 dark:text-white">{data?.charts?.revenuePieData?.length}</span>
                       <span className="text-xs font-bold text-gray-400 uppercase">Sources</span>
                    </div>
                 </div>
                 
                 {/* Legend */}
                 <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {data?.charts?.revenuePieData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-100 dark:border-gray-700">
                            <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                            {entry.name}
                        </div>
                    ))}
                 </div>
             </div>
          </div>

          {/* THIRD TIER: Detailed Matrix Table */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden print:border-gray-300">
             <div className="p-8 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Detailed Operational Log</h3>
                <p className="text-sm text-gray-500">Comprehensive daily breakdown of all metrics.</p>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold uppercase text-gray-500">
                      <tr>
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Revenue</th>
                         <th className="px-6 py-4 text-right">Expenses</th>
                         <th className="px-6 py-4 text-right">Net Profit</th>
                         <th className="px-6 py-4 text-center">Staff (Pres/Tot)</th>
                         <th className="px-6 py-4 text-right text-indigo-600">Company Share</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data?.rawReports?.map((report, idx) => {
                          // Local calc
                          const rev = report.totalSalesAmount || 0;
                          const adj = report.adjustments || {};
                          const exp = (adj.terminalExpenses || 0) + (adj.fcUnexchangeable || 0);
                          const net = report.netSalesAmount || 0;
                          const comp = report.distribution?.companyAmount || 0;
                          
                          return (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                    {format(new Date(report.date), 'dd MMM yyyy')}
                                    <span className="block text-[10px] text-gray-400 font-normal uppercase">{report.shift} Shift</span>
                                </td>
                                <td className="px-6 py-4">
                                   <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase border border-emerald-100">
                                      {report.status}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium">{rev.toLocaleString()}</td>
                                <td className="px-6 py-4 text-right text-red-500">
                                   {exp > 0 ? `-${exp.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 text-right font-bold">{net.toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                   <span className="text-gray-900 dark:text-white font-bold">{report.staffStats?.empPresent}</span>
                                   <span className="text-gray-400"> / {report.staffStats?.totalEmp}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                                   {comp.toLocaleString()}
                                </td>
                            </tr>
                          );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
       </div>
    </div>
  );
}
