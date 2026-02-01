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
    const { userId, name, role, email, phone, property_id, department, shift_start, shift_end, joining_date } = body;

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing required fields (userId, role)" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 2. Update Profile Role
    // We update the profile first. If this fails due to constraint, we catch it.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "staff" }) // Normalize to lowercase 'staff' for profiles
      .eq("id", userId);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return NextResponse.json({ error: "Failed to update profile role: " + profileError.message }, { status: 400 });
    }

    // 3. Update Auth Metadata (optional but recommended)
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: "staff" },
      app_metadata: { roles: ["staff"] }
    });

    if (authError) {
      console.warn("Auth metadata update warning:", authError);
      // Continue even if auth update fails, as profile is the source of truth for RLS usually
    }

    // 4. Check if already in staff table
    const { data: existingStaff } = await supabase
        .from("staff")
        .select("id")
        .eq("user_id", userId)
        .single();

    if (existingStaff) {
        // Update existing staff record
        const { error: updateStaffError } = await supabase
            .from("staff")
            .update({
                name,
                role, // Keep original casing for staff table (e.g. "Receptionist")
                email,
                phone,
                property_id: property_id || null,
                department,
                shift_start,
                shift_end,
                joining_date,
                status: "Active"
            })
            .eq("id", existingStaff.id);

        if (updateStaffError) {
            return NextResponse.json({ error: "Failed to update staff record: " + updateStaffError.message }, { status: 400 });
        }
    } else {
        // Insert into staff table
        const { error: insertStaffError } = await supabase
            .from("staff")
            .insert([
              {
                user_id: userId,
                name,
                role,
                email,
                phone,
                status: "Active",
                property_id: property_id || null,
                department,
                shift_start,
                shift_end,
                joining_date
              },
            ]);

        if (insertStaffError) {
            return NextResponse.json({ error: "Failed to create staff record: " + insertStaffError.message }, { status: 400 });
        }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
