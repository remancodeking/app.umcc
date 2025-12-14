"use client";

import { createContext, useContext, useState, useEffect } from 'react';

const InstallContext = createContext();

export function InstallProvider({ children }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // 1. Check if PWA is already installed
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsStandalone(isStandaloneMode);

        // 2. Listen for Install Prompt (Android/Desktop)
        const handlePrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handlePrompt);
        
        // 3. Check for iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(ios);

        return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
    }, []);

    const promptInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if(outcome === 'accepted') setDeferredPrompt(null);
        }
    };

    return (
        <InstallContext.Provider value={{ deferredPrompt, isIOS, isStandalone, promptInstall }}>
            {children}
        </InstallContext.Provider>
    );
}

export const useInstall = () => useContext(InstallContext);
