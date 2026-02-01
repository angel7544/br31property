import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // 1. Verify Authorization
    const supabaseServer = createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = await getUserRoles(supabaseServer, user);
    if (!roles.includes("admin") && !roles.includes("owner")) {
      return NextResponse.json({ error: "Forbidden: Admin or Owner access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, role, email, phone, status, image_url, property_id, department, shift_start, shift_end, joining_date } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing staff ID" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 2. Update staff table
    const { error: dbError } = await supabase
      .from("staff")
      .update({
        name,
        role,
        email,
        phone,
        status,
        image_url,
        property_id: property_id || null,
        department,
        shift_start,
        shift_end,
        joining_date
      })
      .eq("id", id);

    if (dbError) {
      return NextResponse.json({ error: "Database error: " + dbError.message }, { status: 400 });
    }

    // 3. Optionally update the Auth user metadata if needed (e.g. if name changed)
    // We first need to find the user_id associated with this staff record
    const { data: staffRecord } = await supabase.from("staff").select("user_id").eq("id", id).single();
    
    if (staffRecord?.user_id) {
        await supabase.auth.admin.updateUserById(staffRecord.user_id, {
            user_metadata: {
                name: name,
                role: role === "Manager" ? "owner" : "staff"
            },
            app_metadata: {
                roles: role === "Manager" ? ["owner"] : ["staff"]
            }
        });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
