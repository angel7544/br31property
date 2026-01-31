import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/auth";

export async function POST(req: Request) {
  // We don't trust the body anymore. We verify the session.
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the REAL roles from DB
  const roles = await getUserRoles(supabase, user);
  
  // Determine the primary role to set in the cookie
  let role = "tenant";
  if (roles.includes("admin")) role = "admin";
  else if (roles.includes("owner")) role = "owner";
  else if (roles.includes("staff")) role = "staff";
  else if (roles.length > 0) role = roles[0];

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set("sakura_role", role, { path: "/", httpOnly: false, sameSite: "lax" });
  res.cookies.set("sakura_session", "1", { path: "/", httpOnly: false, sameSite: "lax" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sakura_role", "", { path: "/", httpOnly: false, sameSite: "lax", maxAge: 0 });
  res.cookies.set("sakura_session", "", { path: "/", httpOnly: false, sameSite: "lax", maxAge: 0 });
  return res;
}

