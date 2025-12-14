"use client";

import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineHandler() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        if(!navigator.onLine) setIsOffline(true);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-[9999] p-4 flex justify-center pointer-events-none"
                >
                    <div className="bg-black/80 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 pointer-events-auto border border-white/10">
                        <div className="bg-red-500/20 p-2 rounded-full">
                            <WifiOff className="h-5 w-5 text-red-500 animate-pulse" />
                        </div>
                        <div>
                            <p className="font-bold text-sm">No Internet Connection</p>
                            <p className="text-xs text-gray-400">Please check your network.</p>
                        </div>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1"
                        >
                           <RefreshCw className="h-3 w-3" /> Retry
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
