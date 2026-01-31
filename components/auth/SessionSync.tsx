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
        // Always fetch latest role from DB/Auth to ensure cookie is up-to-date
        const roles = await getUserRoles(supabase, user);
        const currentRole = roles[0] || "tenant";

        // Check current cookie value
        const cookieRole = document.cookie
          .split('; ')
          .find(row => row.startsWith('sakura_role='))
          ?.split('=')[1];
        
        // If cookie doesn't exist OR role doesn't match, update it
        if (!cookieRole || cookieRole !== currentRole) {
          console.log(`Syncing session: ${cookieRole} -> ${currentRole}`);
          
          await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: currentRole }),
          });

          // If we are on the login page and just restored the session, redirect to the intended destination
          if (pathname === "/login") {
            const redirect = searchParams.get("redirect") || "/admin";
            window.location.href = redirect;
          } else if (cookieRole && cookieRole !== currentRole) {
             // If role CHANGED while on another page, might want to reload to apply new permissions
             // e.g. from tenant -> admin
             window.location.reload();
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
