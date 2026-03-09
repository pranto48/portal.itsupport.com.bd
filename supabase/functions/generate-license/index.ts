import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function generateLicenseKey(category: string | null): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const segment = () =>
    Array.from(
      { length: 5 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  const key = Array.from({ length: 4 }, segment).join("-");

  // Prefix with product category for product-aware routing
  const prefix =
    category?.toUpperCase() === "LIFEOS"
      ? "LIFEOS"
      : category?.toUpperCase() === "AMPNM"
      ? "AMPNM"
      : "GEN";

  return `${prefix}-${key}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role OR auto_fulfill for free orders
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const body = await req.json();
    const { order_id, auto_fulfill } = body;
    const isAdmin = !!roleData;

    // Non-admins can only auto-fulfill their own free orders
    if (!isAdmin && !auto_fulfill) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!order_id || typeof order_id !== "string") {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate order_id format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(order_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid order_id format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch order
    const { data: order, error: orderErr } = await adminClient
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Non-admin auto_fulfill: verify order belongs to user and is free
    if (!isAdmin && auto_fulfill) {
      if (order.customer_id !== user.id) {
        return new Response(
          JSON.stringify({ error: "Unauthorized — order does not belong to you" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (Number(order.total_amount) > 0) {
        return new Response(
          JSON.stringify({ error: "Only free orders can be auto-fulfilled" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (order.status === "completed") {
      return new Response(
        JSON.stringify({ error: "Order already completed — licenses already issued" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch order items with product details
    const { data: items, error: itemsErr } = await adminClient
      .from("order_items")
      .select("*, products(name, category, max_devices, license_duration_days)")
      .eq("order_id", order_id);

    if (itemsErr || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No order items found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const generatedLicenses: Array<{
      item_id: string;
      product_name: string;
      license_key: string;
      expires_at: string | null;
      max_devices: number;
    }> = [];

    for (const item of items) {
      // Skip if license already generated for this item
      if (item.license_key_generated) {
        generatedLicenses.push({
          item_id: item.id,
          product_name: (item.products as any)?.name || "Unknown",
          license_key: item.license_key_generated,
          expires_at: null,
          max_devices: 0,
        });
        continue;
      }

      const product = item.products as any;
      const category = product?.category || null;
      const maxDevices = product?.max_devices || 1;
      const durationDays = product?.license_duration_days || null;

      const licenseKey = generateLicenseKey(category);
      const expiresAt = durationDays
        ? new Date(Date.now() + durationDays * 86400000).toISOString()
        : null;

      // Create license record
      const { error: licErr } = await adminClient.from("licenses").insert({
        customer_id: order.customer_id,
        product_id: item.product_id,
        license_key: licenseKey,
        status: "active",
        max_devices: maxDevices,
        expires_at: expiresAt,
      });

      if (licErr) {
        console.error(`Failed to create license for item ${item.id}:`, licErr.message);
        return new Response(
          JSON.stringify({
            error: `Failed to create license: ${licErr.message}`,
            partial_results: generatedLicenses,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update order item with generated key
      await adminClient
        .from("order_items")
        .update({ license_key_generated: licenseKey })
        .eq("id", item.id);

      generatedLicenses.push({
        item_id: item.id,
        product_name: product?.name || "Unknown",
        license_key: licenseKey,
        expires_at: expiresAt,
        max_devices: maxDevices,
      });
    }

    // Mark order as completed
    await adminClient
      .from("orders")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        licenses: generatedLicenses,
        message: `${generatedLicenses.length} license(s) generated and activated`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("generate-license error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
