import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, email, moveInDate, message, propertyId, roomId } = body;

    // Validate required fields
    if (!name || !phone || !moveInDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Insert into enquiries table
    const { data, error } = await supabase.from("enquiries").insert([{
      name: name,
      phone: phone,
      email: email,
      move_in_date: moveInDate,
      message: message,
      property_id: propertyId,
      room_id: roomId,
      status: "New",
    }]).select().single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error("API error:", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
