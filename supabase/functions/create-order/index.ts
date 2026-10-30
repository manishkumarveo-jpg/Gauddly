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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return json({ error: "Not authenticated" }, 401);
    }
    const user = userData.user;

    const { items, shipping } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return json({ error: "Cart is empty" }, 400);
    }
    if (!shipping?.name || !shipping?.email || !shipping?.address || !shipping?.city) {
      return json({ error: "Missing shipping details" }, 400);
    }
    if (!/^[6-9]\d{9}$/.test(shipping.phone ?? "") || !/^\d{6}$/.test(shipping.pincode ?? "") || !shipping.state) {
      return json({ error: "Enter a valid mobile number, pin code and state" }, 400);
    }

    // Re-price and validate every line item from the database - never trust a client-sent price
    const orderItems = [];
    let subtotal = 0;
    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("id, name, price, is_published, product_sizes(size, in_stock)")
        .eq("id", item.productId)
        .single();

      if (!product || !product.is_published) {
        return json({ error: `${item.productId} is not available` }, 400);
      }
      const sizeRow = product.product_sizes.find((s) => s.size === item.size);
      if (!sizeRow || !sizeRow.in_stock) {
        return json({ error: `${product.name} (${item.size}) is out of stock` }, 400);
      }
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return json({ error: `Invalid quantity for ${product.name}` }, 400);
      }
      subtotal += product.price * quantity;
      orderItems.push({ product_id: product.id, product_name: product.name, size: item.size, unit_price: product.price, quantity });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        email: shipping.email,
        name: shipping.name,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state ?? null,
        pincode: shipping.pincode ?? null,
        phone: shipping.phone ?? null,
        status: "pending",
        subtotal,
        total: subtotal,
      })
      .select()
      .single();

    if (orderError) {
      return json({ error: orderError.message }, 500);
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));

    if (itemsError) {
      return json({ error: itemsError.message }, 500);
    }

    // Prices are whole rupees; Razorpay wants paise
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
      return json({ error: "Payments are not configured" }, 500);
    }
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: Math.round(order.total * 100), currency: "INR", receipt: order.id }),
    });
    const rzpOrder = await rzpRes.json();
    if (!rzpRes.ok) {
      await supabase.from("orders").update({ status: "failed" }).eq("id", order.id);
      return json({ error: "Payment could not be started" }, 502);
    }

    const { error: linkError } = await supabase
      .from("orders")
      .update({ razorpay_order_id: rzpOrder.id })
      .eq("id", order.id);
    if (linkError) {
      return json({ error: "Payment could not be started" }, 500);
    }

    return json({ orderId: order.id, razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, keyId });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
