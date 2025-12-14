"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInstall } from "@/components/providers/InstallProvider";

export default function InstallPrompt() {
  const { deferredPrompt, promptInstall, isIOS, isStandalone } = useInstall();
  const [showIOS, setShowIOS] = useState(false);
  const [showAndroid, setShowAndroid] = useState(false);

  useEffect(() => {
    // Show Android/Desktop prompt if available
    if(deferredPrompt && !isStandalone) {
        setShowAndroid(true);
    }
  }, [deferredPrompt, isStandalone]);

  useEffect(() => {
     // Show iOS instructions if appropriate
     if(isIOS && !isStandalone) {
         // Add a delay so it doesn't pop up immediately
         const timer = setTimeout(() => setShowIOS(true), 3000);
         return () => clearTimeout(timer);
     }
  }, [isIOS, isStandalone]);

  const handleInstallClick = () => {
      promptInstall();
      setShowAndroid(false);
  };

  if (isStandalone) return null; // Don't show if already installed

  return (
    <AnimatePresence>
      {/* ANDROID / DESKTOP INSTALL BUTTON */}
      {showAndroid && (
        <motion.div
           initial={{ y: 100, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: 100, opacity: 0 }}
           className="fixed bottom-6 left-6 right-6 z-50 flex justify-center"
        >
          <div className="bg-black text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between w-full max-w-sm border border-white/10 backdrop-blur-md">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                   <p className="font-bold text-sm">Install App</p>
                   <p className="text-xs text-gray-400">Add to home screen</p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                 <button onClick={() => setShowAndroid(false)} className="p-2 text-gray-400 hover:text-white"><X className="h-5 w-5"/></button>
                 <button onClick={handleInstallClick} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-200">
                    Install
                 </button>
             </div>
          </div>
        </motion.div>
      )}

      {/* IOS INSTRUCTIONS */}
      {showIOS && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-6 right-6 z-50 flex justify-center"
          >
            <div className="bg-white/90 dark:bg-black/90 text-black dark:text-white p-5 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm backdrop-blur-md">
                <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-sm">Install for iOS</p>
                    <button onClick={() => setShowIOS(false)}><X className="h-4 w-4 text-gray-500"/></button>
                </div>
                <div className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                    <p className="flex items-center gap-2">1. Tap the <Share className="h-4 w-4 text-blue-500"/> Share button</p>
                    <p className="flex items-center gap-2">2. Scroll down & select <span className="font-bold bg-gray-200 dark:bg-gray-800 px-1 rounded text-xs">Add to Home Screen</span></p>
                </div>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}
