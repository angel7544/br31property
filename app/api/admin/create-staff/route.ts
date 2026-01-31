import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role, phone, hotel_id, image_url } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Create User in Supabase Auth
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: role === "Manager" ? "owner" : "staff", // Managers are owners
      },
      app_metadata: {
        roles: role === "Manager" ? ["owner"] : ["staff"],
      }
    });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    if (!userData.user) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // 2. Insert into staff table
    const { error: dbError } = await supabase.from("staff").insert([
      {
        user_id: userData.user.id,
        name,
        role,
        email,
        phone,
        status: "Active",
        hotel_id: hotel_id || null,
        image_url: image_url || null,
      },
    ]);

    if (dbError) {
      // Cleanup: delete the user if DB insert fails? 
      // For now, let's just report the error. 
      // Ideally we should delete the auth user to keep consistency.
      await supabase.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json({ error: "Database error: " + dbError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: userData.user });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
