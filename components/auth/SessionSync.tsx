"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getUserRoles } from "@/lib/auth";
import { usePathname, useSearchParams } from "next/navigation";

export default function SessionSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const syncSession = async () => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Check if cookie exists
        const hasSessionCookie = document.cookie.split(';').some((c) => c.trim().startsWith('sakura_session='));
        
        if (!hasSessionCookie) {
          console.log("Restoring session cookie...");
          const roles = await getUserRoles(supabase, user);
          const role = roles[0] || "tenant";
          
          await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
          });

          // If we are on the login page and just restored the session, redirect to the intended destination
          if (pathname === "/login") {
            const redirect = searchParams.get("redirect") || "/admin";
            // Force a hard reload to ensure cookies are recognized by the server
            window.location.href = redirect;
          }
        }
      }
    };

    syncSession();
    
    // Optional: Listen for auth changes
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        syncSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
