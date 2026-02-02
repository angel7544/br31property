"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileTabBar from "@/components/layout/MobileTabBar";
import FloatingCTA from "@/components/layout/FloatingCTA";
import OfferPopup from "@/components/ui/OfferPopup";
import { ToastProvider } from "@/components/ui/Toast";
import { SettingsProvider } from "@/context/SettingsContext";
import { ReactNode, Suspense, useEffect } from "react";
import { Toaster } from "sonner";
import SessionSync from "@/components/auth/SessionSync";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Safe check for pathname existence (it can be null during SSG/SSR edge cases)
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable keyboard shortcuts for inspection
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.ctrlKey &&
        e.shiftKey &&
        (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")
      ) {
        e.preventDefault();
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <SettingsProvider>
      <Suspense fallback={null}>
        <SessionSync />
      </Suspense>
      <ToastProvider>
        <Toaster position="top-center" richColors />
        <Navbar />
        
        {isAdmin ? (
          <main className="flex-grow w-full pt-20">
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
