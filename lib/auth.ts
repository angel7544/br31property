import { getSupabaseClient } from "./supabaseClient";
import { SupabaseClient, User } from "@supabase/supabase-js";

export type UserRole = "admin" | "owner" | "tenant" | "staff";

export async function getUserRoles(client?: SupabaseClient, currentUser?: User | null): Promise<UserRole[]> {
  const supabase = client || getSupabaseClient();
  let user = currentUser;

  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }
  
  if (!user) return [];

  const roles: UserRole[] = [];

  // 1. Check profiles table (Priority over metadata for real-time DB updates)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role) {
      roles.push(profile.role as UserRole);
  }

  // 2. Check staff table by email (since user_id might not be linked)
  if (user.email) {
    const { data: staff } = await supabase
      .from("staff")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
      
    if (staff) {
      roles.push("staff");
    }
  }

  // 3. Check metadata (JWT) - Fallback
  const metaRoles = (user.app_metadata?.roles as string[] | undefined) || [];
  const allowedMeta = metaRoles.filter((r) => r === "admin" || r === "owner" || r === "tenant" || r === "staff");
  
  if (allowedMeta.length > 0) {
    allowedMeta.forEach(r => {
      if (!roles.includes(r as UserRole)) roles.push(r as UserRole);
    });
  }

  // Return gathered roles, or default to tenant
  if (roles.length > 0) return Array.from(new Set(roles));
  
  return ["tenant"];
}

export async function signOut() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  try {
    await fetch("/api/session", { method: "DELETE" });
  } catch {}
}
