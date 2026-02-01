import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("Razorpay keys missing");
      return NextResponse.json({ error: "Server configuration error: Missing Keys" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    // Ensure receipt is within 40 chars limit
    const shortUserId = user.id.substring(0, 8);
    const timestamp = Date.now().toString().slice(-8);
    const receiptId = `rcpt_${shortUserId}_${timestamp}`;

    const options = {
      amount: 99900, // amount in the smallest currency unit (paise)
      currency: "INR",
      receipt: receiptId,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ 
      error: error.error?.description || error.message || "Failed to create order" 
    }, { status: 500 });
  }
}
