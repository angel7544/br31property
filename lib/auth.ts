import { getSupabaseClient } from "./supabaseClient";
import { SupabaseClient, User } from "@supabase/supabase-js";

export type UserRole = "admin" | "owner" | "tenant";

export async function getUserRoles(client?: SupabaseClient, currentUser?: User | null): Promise<UserRole[]> {
  const supabase = client || getSupabaseClient();
  let user = currentUser;

  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }
  
  if (!user) return [];

  // 1. Check profiles table (Priority over metadata for real-time DB updates)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role) {
      return [profile.role as UserRole];
  }

  // 2. Check metadata (JWT) - Fallback
  const metaRoles = (user.app_metadata?.roles as string[] | undefined) || [];
  const allowedMeta = metaRoles.filter((r) => r === "admin" || r === "owner" || r === "tenant");
  if (allowedMeta.length > 0) return allowedMeta as UserRole[];

  // Default to tenant if no role found
  return ["tenant"];
}

export async function signOut() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  try {
    await fetch("/api/session", { method: "DELETE" });
  } catch {}
}
