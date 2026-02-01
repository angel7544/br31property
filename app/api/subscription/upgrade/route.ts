import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const supabaseServer = createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
        console.error("Upgrade API: Missing RAZORPAY_KEY_SECRET");
        return NextResponse.json({ error: "Server configuration error: Missing Razorpay Secret" }, { status: 500 });
    }

    // Verify Signature
    const shasum = crypto.createHmac("sha256", key_secret);
    shasum.update(razorpay_order_id + "|" + razorpay_payment_id);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Upgrade API: Missing Supabase credentials", { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!serviceRoleKey 
      });
      return NextResponse.json({ error: "Server configuration error: Missing Supabase Config" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // 1. Record Payment
    const { error: paymentError } = await supabaseAdmin
        .from("payments")
        .insert({
            user_id: user.id,
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            signature: razorpay_signature,
            amount: 999.00,
            status: "captured"
        });

    if (paymentError) {
        console.error("Payment record error:", paymentError);
        // We still proceed to upgrade user if payment is verified, but log this critical error
    }

    // 2. Update profiles table
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role: "owner" })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // 3. Update Auth metadata
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    if (userError) throw userError;

    const currentRoles = (userData.user.app_metadata.roles as string[]) || [];
    const newRoles = Array.from(new Set([...currentRoles, "owner"]));

    // Remove 'tenant' if present
    const finalRoles = newRoles.filter(r => r !== "tenant");
    if (finalRoles.length === 0) finalRoles.push("owner");

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: {
            roles: finalRoles
        },
        user_metadata: {
            role: "owner"
        }
    });

    if (authError) {
        throw authError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Upgrade error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
