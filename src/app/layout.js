import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import OfflineHandler from "@/components/OfflineHandler";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata = {
  title: "UMCC - Sharakat Al Harak",
  description: "Premier Airport Logistics & Trolley Services",
  manifest: "/manifest.json",
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

import { InstallProvider } from "@/components/providers/InstallProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
       cz-shortcut-listen="true"
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <InstallProvider>
                {children}
                <OfflineHandler />
                <InstallPrompt />
                <Toaster position="top-center" reverseOrder={false} />
            </InstallProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
