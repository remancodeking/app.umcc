"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Plane, Users, CheckCircle, Shield, ArrowRight, Star, TrendingUp, Clock, MapPin, Briefcase, LayoutDashboard, Sun, Moon, Laptop } from 'lucide-react';
import { useEffect, useState } from 'react';

function ModeToggle() {
  const { setTheme } = useTheme();
  // Ensure hydration match
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-[88px] h-[34px] bg-gray-100 rounded-lg animate-pulse"></div>;

  return (
    <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 rounded-lg">
      <button onClick={() => setTheme("light")} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"><Sun className="h-4 w-4" /></button>
      <button onClick={() => setTheme("dark")} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"><Moon className="h-4 w-4" /></button>
      <button onClick={() => setTheme("system")} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"><Laptop className="h-4 w-4" /></button>
    </div>
  )
}

export default function Home() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-amber-500/30">
      
      {/* Navbar */}
      <header className="fixed w-full top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 md:h-14 md:w-14 overflow-hidden rounded-xl shadow-lg ring-1 ring-gray-900/5 dark:ring-white/10">
               <Image 
                 src="/logo.jpg" 
                 alt="UMCC Logo" 
                 fill
                 className="object-cover"
                 priority
               />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-extrabold text-xl leading-none tracking-tight text-gray-900 dark:text-white">UMCC</span>
              <span className="text-[10px] font-medium tracking-widest text-[#D4AF37] uppercase">Sharakat Al Harak</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-500 dark:text-gray-400">
            <Link href="#services" className="hover:text-[var(--primary)] dark:hover:text-white transition-colors">Services</Link>
            <Link href="#about" className="hover:text-[var(--primary)] dark:hover:text-white transition-colors">About</Link>
            <Link href="#careers" className="hover:text-[var(--primary)] dark:hover:text-white transition-colors">Careers</Link>
            <Link href="#contact" className="hover:text-[var(--primary)] dark:hover:text-white transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block mr-2">
                <ModeToggle />
            </div>

            {isLoggedIn ? (
                <Link 
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center justify-center rounded-xl text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-all h-10 px-6 shadow-xl shadow-gray-900/10 dark:shadow-white/5 gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
            ) : (
                <>
                    <Link 
                      href="/auth/login" 
                      className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-white transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/auth/signup"
                      className="hidden sm:inline-flex items-center justify-center rounded-xl text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-all h-10 px-6 shadow-xl shadow-gray-900/10 dark:shadow-white/5"
                    >
                      Get Started
                    </Link>
                </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20">
        
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-900/50 dark:to-transparent -z-10 pointer-events-none" />
          <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10 animate-pulse" />
          <div className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] -z-10" />

          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              
              {/* Text Content */}
              <div className="flex-1 text-center lg:text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-900/30">
                  <Star className="h-3 w-3 fill-current" /> Premier Airport Logistics
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 dark:text-white leading-[1.1]">
                  Redefining <br className="hidden lg:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white">Airport Mobility</span>
                </h1>
                
                <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Experience world-class trolley management and ground support services driven by innovation, efficiency, and typical Arabian hospitality.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  {isLoggedIn ? (
                      <Link 
                        href="/dashboard"
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl text-base font-bold bg-[#D4AF37] hover:bg-[#c4a02e] text-white transition-all h-12 px-8 shadow-lg shadow-amber-500/20 gap-2"
                      >
                         <LayoutDashboard className="h-5 w-5" />
                        Go to Dashboard
                      </Link>
                  ) : (
                      <Link 
                        href="/auth/signup"
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl text-base font-bold bg-[#D4AF37] hover:bg-[#c4a02e] text-white transition-all h-12 px-8 shadow-lg shadow-amber-500/20"
                      >
                        Join Our Network
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                  )}
                  <Link
                    href="#contact" 
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl text-base font-bold border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-all h-12 px-8"
                  >
                    Contact Sales
                  </Link>
                </div>
                
                <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-gray-400 grayscale opacity-80">
                   {/* Logos or trusting partner placeholders could go here */}
                   <span className="font-bold text-sm tracking-widest uppercase">Trusted Partner</span>
                   <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
                   <span className="flex items-center gap-2 font-mono text-xs"><CheckCircle className="h-4 w-4 text-emerald-500" /> ISO Certified</span>
                   <span className="flex items-center gap-2 font-mono text-xs"><CheckCircle className="h-4 w-4 text-emerald-500" /> 24/7 Operations</span>
                </div>
              </div>

              {/* Visual/Image Side */}
              <div className="flex-1 relative w-full w-full max-w-lg lg:max-w-none">
                 <div className="relative aspect-square w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white/50 dark:border-gray-800/50 bg-gray-100 dark:bg-gray-900">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 to-gray-900/20 dark:from-white/5 dark:to-transparent z-10"></div>
                    {/* Placeholder for a nice hero image, using the logo as a fallback centerpiece for now */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                        <div className="relative w-64 h-64 md:w-80 md:h-80 opacity-90 transition-transform duration-1000 hover:scale-105">
                           <Image src="/logo.jpg" alt="Hero Logo" fill className="object-contain drop-shadow-2xl" />
                        </div>
                    </div>
                    
                    {/* Floating Info Cards */}
                    <div className="absolute bottom-8 left-8 right-8 z-20">
                       <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                             <TrendingUp className="h-6 w-6" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Efficiency Rate</p>
                             <p className="text-xl font-black text-gray-900 dark:text-white">99.8%</p>
                          </div>
                          <div className="ml-auto h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                          <div className="text-right">
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Availability</p>
                             <p className="text-xl font-black text-gray-900 dark:text-white">24/7</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="services" className="py-24 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
               <h2 className="text-3xl md:text-4xl font-black mb-4">Excellence in Motion</h2>
               <p className="text-gray-500 dark:text-gray-400 text-lg">We provide comprehensive logistics solutions tailored for high-traffic environments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 {
                   icon: <Shield className="h-6 w-6" />,
                   title: "Secure Operations",
                   desc: "Advanced monitoring systems ensuring asset security and passenger safety at all times.",
                   color: "bg-blue-500"
                 },
                 {
                   icon: <Clock className="h-6 w-6" />,
                   title: "Real-Time Tracking",
                   desc: "Live dashboard analytics for instant trolley availability and workforce distribution.",
                   color: "bg-[#D4AF37]"
                 },
                 {
                   icon: <Users className="h-6 w-6" />,
                   title: "Expert Workforce",
                   desc: "Highly trained personnel dedicated to delivering superior customer service standards.",
                   color: "bg-emerald-500"
                 }
               ].map((feature, idx) => (
                 <div key={idx} className="group p-8 rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 transition-all duration-300 hover:-translate-y-1">
                    <div className={`h-14 w-14 rounded-2xl ${feature.color} bg-opacity-10 flex items-center justify-center text-${feature.color.replace('bg-', '')} mb-6 group-hover:scale-110 transition-transform`}>
                       {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 border-y border-gray-100 dark:border-gray-800">
           <div className="container mx-auto px-4 md:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                 {[
                    { label: "Experience", value: "15+ Years" },
                    { label: "Daily Passengers", value: "50k+" },
                    { label: "Trolleys Managed", value: "12,000" },
                    { label: "Airports Served", value: "Multiple" }
                 ].map((stat, i) => (
                    <div key={i} className="text-center">
                       <p className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-2">{stat.value}</p>
                       <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 reltive overflow-hidden">
           <div className="container mx-auto px-4 md:px-8 relative z-10">
              <div className="bg-[#111827] dark:bg-white dark:text-gray-900 text-white rounded-[2.5rem] p-12 lg:p-24 text-center shadow-2xl overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                 
                 <h2 className="text-3xl md:text-5xl font-black mb-6 relative z-10">Ready to Transform Your Logistics?</h2>
                 <p className="text-gray-400 dark:text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10">
                    Join UMCC today and experience the future of airport services management.
                 </p>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                    <Link href="/auth/signup" className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#c4a02e] text-white font-bold rounded-xl transition-colors">
                       Get Started Now
                    </Link>
                    <Link href="/auth/employee/login" className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white dark:text-gray-900 dark:bg-gray-100 dark:hover:bg-gray-200 font-bold rounded-xl transition-colors">
                       Employee Portal
                    </Link>
                 </div>
              </div>
           </div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="py-16 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-900">
        <div className="container mx-auto px-4 md:px-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-2 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 relative rounded-lg overflow-hidden shrink-0">
                       <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
                    </div>
                    <span className="font-bold text-xl text-gray-900 dark:text-white">UMCC</span>
                 </div>
                 <p className="text-gray-500 max-w-sm leading-relaxed">
                    Setting the global standard for airport trolley services and passenger logistics in the Kingdom of Saudi Arabia.
                 </p>
                 <div className="flex gap-4">
                    {/* Social Placeholders */}
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer"><Briefcase className="h-4 w-4" /></div>
                    <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-[var(--primary)] hover:text-white transition-colors cursor-pointer"><MapPin className="h-4 w-4" /></div>
                 </div>
              </div>
              
              <div>
                 <h4 className="font-bold text-gray-900 dark:text-white mb-6">Company</h4>
                 <ul className="space-y-4 text-sm text-gray-500 font-medium">
                    <li><Link href="#" className="hover:text-[var(--primary)] transition-colors">About Us</Link></li>
                    <li><Link href="#" className="hover:text-[var(--primary)] transition-colors">Services</Link></li>
                    <li><Link href="#" className="hover:text-[var(--primary)] transition-colors">Careers</Link></li>
                    <li><Link href="#" className="hover:text-[var(--primary)] transition-colors">Contact</Link></li>
                 </ul>
              </div>
              
              <div>
                 <h4 className="font-bold text-gray-900 dark:text-white mb-6">Legal</h4>
                 <ul className="space-y-4 text-sm text-gray-500 font-medium">
                    <li><Link href="#" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</Link></li>
                    <li><Link href="#" className="hover:text-[var(--primary)] transition-colors">Terms & Conditions</Link></li>
                    <li><Link href="#" className="hover:text-[var(--primary)] transition-colors">Cookie Policy</Link></li>
                 </ul>
              </div>
           </div>
           
           <div className="pt-8 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} Sharakat Al Harak (UMCC). All rights reserved.</p>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-500/50 animate-pulse"></div>
                 Systems Operational
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}
