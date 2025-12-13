"use client"

import { useState, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        mobile,
        password,
      });

      if (res?.error) {
        setError('Invalid credentials');
        setLoading(false);
      } else {
        // Redirect Logic based on Role
        const session = await getSession();
        
        // If role is strictly 'User', send to Landing Page
        if (session?.user?.role === 'User') {
            router.push('/');
        } else {
            // Admin, Cashier, Employee -> Dashboard
            // (Assumes Admin/Cashier/Employee all use the main dashboard now)
            router.push('/dashboard');
        }
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-white dark:bg-gray-900">
      
      {/* Left Side - Visual & Brand - Animated Gradient with Premium Gold Theme */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 text-white overflow-hidden">
         {/* Animated Background */}
         <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black animate-gradient-slow z-0"></div>
         {/* Gold Shine Effect */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/20 rounded-full blur-[120px] pointer-events-none"></div>
         <div className="absolute inset-0 bg-grid-white/[0.05] z-[1]"></div>
         
         {/* Content */}
         <div className="relative z-10">
             <div className="flex items-center gap-3 font-bold text-3xl tracking-tight">
                <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/10 text-[#D4AF37]">
                  <LayoutDashboard className="h-8 w-8" />
                </div>
                <div>
                    <span className="text-white">UMCC</span>
                    <span className="block text-[10px] text-[#D4AF37] tracking-[0.2em] font-medium leading-none mt-1">SHARAKAT AL HARAK</span>
                </div>
             </div>
         </div>

         <div className="relative z-10 max-w-lg space-y-6">
            <motion.div 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }} 
               transition={{ delay: 0.2 }}
            >
               <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white mb-6">
                  Streamline Your <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">Operations.</span>
               </h1>
               <p className="text-lg text-gray-300 font-medium leading-relaxed">
                  Manage airport trolley services, staff shifts, and operational logistics all in one unified, intelligent platform.
               </p>
            </motion.div>
            
            <motion.div
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ delay: 0.4 }}
               className="flex items-center gap-4 pt-4"
            >
                <div className="flex -space-x-3">
                   {[1,2,3,4].map(i => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-gray-800 bg-gray-700" />
                   ))}
                </div>
                <div className="text-sm font-medium text-gray-300">Trusted by 120+ Staff Members</div>
            </motion.div>
         </div>

         <div className="relative z-10 text-sm font-medium text-gray-400">
            © 2025 UMCC Services. All rights reserved.
         </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 relative">
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md space-y-8"
         >
            <div className="text-center lg:text-left space-y-2">
               <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Welcome back</h2>
               <p className="text-gray-500 dark:text-gray-400">Please enter your details to sign in.</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
               <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Mobile Number</label>
                  <input 
                    type="tel" 
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all shadow-sm"
                    placeholder="05..."
                  />
               </div>
               
               <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="flex h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all shadow-sm pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                     <Link href="#" className="text-sm font-medium text-[#D4AF37] hover:text-[#c4a02e] transition-colors">
                        Forgot password?
                     </Link>
                  </div>
               </div>
               
               <button 
                  type="submit" 
                  disabled={loading}
                  className="group relative w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl text-base font-semibold transition-all shadow-lg shadow-gray-900/20 hover:shadow-gray-900/30 flex items-center justify-center gap-2 overflow-hidden border border-[#D4AF37]/50"
               >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
                  ) : (
                    <>
                      Sign In 
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-[#D4AF37]" />
                    </>
                  )}
               </button>
            </form>

            <div className="relative">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
               </div>
               <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">Or continue with</span>
               </div>
            </div>

            <div className="text-center">
               <p className="text-gray-500 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link href="/auth/signup" className="font-semibold text-[#D4AF37] hover:text-[#c4a02e] transition-colors">
                     Sign up
                  </Link>
               </p>
            </div>
         </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
