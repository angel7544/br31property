import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

function sha1Hex(input: string) {
  const key = new TextEncoder().encode(input);
  const hash = new Uint8Array(key.length);
  for (let i = 0; i < key.length; i++) hash[i] = key[i];
  return Array.from(hash).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const ts = Math.floor(Date.now() / 1000);
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET")!;
  const paramsToSign = `timestamp=${ts}`;
  const signature = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(paramsToSign + apiSecret)).then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""));
  return new Response(JSON.stringify({ timestamp: ts, signature }), { headers: { "Content-Type": "application/json" } });
});
