"use client"

import { useState, Suspense } from 'react'; // Suspense یہاں امپورٹ کیا ہے
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// 1. آپ کا اصل کوڈ اب ایک الگ کمپوننٹ ہے (LoginForm کے نام سے)
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
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      setError('An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-white dark:bg-gray-900">
      
      {/* Left Side - Visual & Brand - Animated Gradient */}
      <div className="relative hidden lg:flex flex-col justify-between p-16 text-white overflow-hidden">
         {/* Animated Background */}
         <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#2563eb] animate-gradient-slow z-0"></div>
         <div className="absolute inset-0 bg-grid-white/[0.05] z-[1]"></div>
         
         {/* Content */}
         <div className="relative z-10">
             <div className="flex items-center gap-3 font-bold text-3xl tracking-tight">
                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/10">
                  <LayoutDashboard className="h-8 w-8 text-white" />
                </div>
                UMCC
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
                  <span className="text-white/80">Operations.</span>
               </h1>
               <p className="text-lg text-blue-100 font-medium leading-relaxed">
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
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-[#6366f1] bg-white/20 backdrop-blur-sm" />
                   ))}
                </div>
                <div className="text-sm font-medium text-blue-100">Trusted by 120+ Staff Members</div>
            </motion.div>
         </div>

         <div className="relative z-10 text-sm font-medium text-blue-200">
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
                    className="flex h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/50 focus:border-[#4f46e5] transition-all shadow-sm"
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
                      className="flex h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/50 focus:border-[#4f46e5] transition-all shadow-sm pr-10"
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
                     <Link href="#" className="text-sm font-medium text-[#4f46e5] hover:text-[#4338ca] transition-colors">
                        Forgot password?
                     </Link>
                  </div>
               </div>
               
               <button 
                  type="submit" 
                  disabled={loading}
                  className="group relative w-full h-12 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-base font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 overflow-hidden"
               >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Sign In 
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
                  <Link href="/auth/signup" className="font-semibold text-[#4f46e5] hover:text-[#4338ca] transition-colors">
                     Sign up
                  </Link>
               </p>
            </div>
         </motion.div>
      </div>
    </div>
  );
}

// 2. یہ مین ایکسپورٹ ہے جو Suspense لگا کر ایرر روکتا ہے
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
