// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(url, key);

serve(async (req) => {
  if (req.method === "POST") {
    const body = await req.json();
    const { data, error } = await supabase.from("quotations").insert({
      name: body.name,
      phone: body.phone,
      dates: body.dates,
      message: body.message
    }).select().single();
    if (error) return new Response(error.message, { status: 400 });
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  return new Response("Method Not Allowed", { status: 405 });
});
