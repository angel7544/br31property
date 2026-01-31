"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { getUserRoles } from "@/lib/auth";

export default function SessionSync() {
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
