import { createClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/auth";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let roles: string[] = [];
  if (user) {
    roles = await getUserRoles(supabase, user);
  }

  return <AdminDashboard roles={roles} userEmail={user?.email || "No email"} />;
}