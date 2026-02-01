import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let supabaseQueryClient;

    if (supabaseUrl && serviceRoleKey) {
      // Best case: Use Service Role to bypass RLS
      supabaseQueryClient = createClient(supabaseUrl, serviceRoleKey);
    } else {
      console.warn("SUPABASE_SERVICE_ROLE_KEY missing. Falling back to authenticated user context. RLS policies must be correct for this to work.");
      supabaseQueryClient = createServerClient();
    }

    // 1. Verify Authorization
    const supabaseServer = createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check roles using the query client (if service role) or server client
    const roles = await getUserRoles(supabaseQueryClient, user);
    if (!roles.includes("admin") && !roles.includes("owner")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    if (!role || (role !== 'owner' && role !== 'tenant')) {
         return NextResponse.json({ error: "Invalid role parameter" }, { status: 400 });
    }

    // Fetch profiles with payments
    let query = supabaseQueryClient
        .from("profiles")
        .select(`
            *,
            payments (
                id, amount, status, created_at, payment_id
            )
        `)
        .eq("role", role)
        .order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
        console.error("Database error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });

  } catch (e: any) {
    console.error("API Error:", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
