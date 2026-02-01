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

      if (!user && pathname.startsWith('/admin')) {
          // If no Supabase session but on admin page, clear cookies and redirect
          await fetch("/api/session", { method: "DELETE" });
          window.location.href = "/login";
          return;
      }

      if (user) {
        // Always fetch latest role from DB/Auth to ensure cookie is up-to-date
        const roles = await getUserRoles(supabase, user);
        
        // Prioritize roles: admin > owner > staff > tenant
        let currentRole = "tenant";
        if (roles.includes("admin")) currentRole = "admin";
        else if (roles.includes("owner")) currentRole = "owner";
        else if (roles.includes("staff")) currentRole = "staff";
        else if (roles.length > 0) currentRole = roles[0];

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
            let redirect = searchParams.get("redirect");
            
            // Fix for malformed redirect URLs (e.g., %Fadmin reported by user)
            if (redirect && (redirect.includes("%F") || redirect.includes("%25F"))) {
              if (redirect.toLowerCase().includes("admin")) {
                redirect = "/admin";
              } else {
                redirect = redirect.replace(/%F/gi, "/").replace(/%25F/gi, "/");
                if (!redirect.startsWith("/")) redirect = "/" + redirect;
              }
            }

            window.location.href = redirect || "/admin";
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
