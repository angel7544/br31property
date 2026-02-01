import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch profile
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // 2. Auto-heal: Create profile if missing
  if (!profile) {
    // Determine role based on email
    const isAdminEmail = user.email === "info@br31tech.live" || user.email === "angel@br31tech.live";
    const initialRole = isAdminEmail ? "owner" : "tenant";

    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0],
        role: initialRole, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!error && newProfile) {
      profile = newProfile;
    }
  } else {
    // Check if role update is needed for known admins (safety check)
    if ((user.email === "info@br31tech.live" || user.email === "angel@br31tech.live") && 
        (profile.role !== "owner" && profile.role !== "admin")) {
        // Silently upgrade role
        await supabase.from("profiles").update({ role: "owner" }).eq("id", user.id);
        profile.role = "owner";
    }
  }

  return <ProfileForm user={user} profile={profile} />;
}
