"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileTabBar from "@/components/layout/MobileTabBar";
import FloatingCTA from "@/components/layout/FloatingCTA";
import OfferPopup from "@/components/ui/OfferPopup";
import { ToastProvider } from "@/components/ui/Toast";
import { SettingsProvider } from "@/context/SettingsContext";
import { ReactNode, Suspense } from "react";
import { Toaster } from "sonner";
import SessionSync from "@/components/auth/SessionSync";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Safe check for pathname existence (it can be null during SSG/SSR edge cases)
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  return (
    <SettingsProvider>
      <Suspense fallback={null}>
        <SessionSync />
      </Suspense>
      <ToastProvider>
        <Toaster position="top-center" richColors />
        {!isAdmin && <Navbar />}
        
        {isAdmin ? (
          <main className="flex-grow w-full">
            {children}
          </main>
        ) : (
          <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:px-6 lg:px-8 pb-20 pt-24">
            {children}
          </main>
        )}

        {!isAdmin && <Footer />}
        {!isAdmin && <MobileTabBar />}
        {!isAdmin && <FloatingCTA />}
        {!isAdmin && <OfferPopup />}
      </ToastProvider>
    </SettingsProvider>
  );
}
