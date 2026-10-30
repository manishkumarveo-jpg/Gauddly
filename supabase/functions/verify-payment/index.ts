import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return json({ error: "Not authenticated" }, 401);
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: "Missing payment details" }, 400);
    }

    // Fail closed: an unset secret would otherwise mean an empty, guessable HMAC key
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) return json({ error: "Payments are not configured" }, 500);

    const expected = await hmacHex(secret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (!safeEqual(expected, String(razorpay_signature))) {
      return json({ error: "Payment could not be verified" }, 400);
    }

    // Only the caller's own pending order can be marked paid
    const { data: order, error } = await supabase
      .from("orders")
      .update({ status: "paid", razorpay_payment_id, razorpay_signature })
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", userData.user.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!order) return json({ error: "Order not found" }, 404);

    return json({ orderId: order.id });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
