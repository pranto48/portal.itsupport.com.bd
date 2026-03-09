import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Startup License Check Edge Function
 * Called by Docker containers (AMPNM & LifeOS) on startup/boot.
 * Returns plain JSON (not encrypted) for backend-to-backend use.
 * 
 * Validates: license key, status, expiry, product match, installation binding.
 * Also serves as a periodic heartbeat when called from cron or middleware.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ProductType = "AMPNM" | "LifeOS" | "unknown";

function detectProduct(installationId: string): ProductType {
  if (installationId.startsWith("LIFEOS-")) return "LifeOS";
  if (installationId.startsWith("AMPNM-")) return "AMPNM";
  return "AMPNM"; // Legacy fallback
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ valid: false, status: "error", message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const licenseKey = String(body.license_key ?? "").trim();
    const installationId = String(body.installation_id ?? "").trim();
    const product = String(body.product ?? "").trim() as ProductType || detectProduct(installationId);

    // Validate input
    if (!licenseKey || !installationId) {
      return new Response(
        JSON.stringify({ valid: false, status: "missing_fields", message: "license_key and installation_id are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (licenseKey.length > 500 || installationId.length > 500) {
      return new Response(
        JSON.stringify({ valid: false, status: "invalid_input", message: "Invalid input." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle FREE tier — always valid
    if (licenseKey === "FREE") {
      return new Response(
        JSON.stringify({
          valid: true,
          status: "free",
          message: "Free tier active.",
          product,
          max_devices: 5,
          expires_at: null,
          plan: "basic",
          grace_remaining_days: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch license with product info
    const { data: license, error: fetchErr } = await supabase
      .from("licenses")
      .select("*, products(id, name, category, max_devices, license_duration_days)")
      .eq("license_key", licenseKey)
      .maybeSingle();

    if (fetchErr) {
      console.error("DB error:", fetchErr.message);
      return new Response(
        JSON.stringify({ valid: false, status: "error", message: "Service error." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!license) {
      return new Response(
        JSON.stringify({ valid: false, status: "not_found", message: "License key not found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const licenseCategory = (license.products as any)?.category as string | undefined;
    const productName = (license.products as any)?.name as string | undefined;

    // Product mismatch check
    if (licenseCategory && product !== "unknown" && licenseCategory !== product) {
      return new Response(
        JSON.stringify({
          valid: false,
          status: "product_mismatch",
          message: `This license is for ${licenseCategory}, not ${product}.`,
          product,
          license_product: licenseCategory,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check status
    if (license.status !== "active" && license.status !== "free") {
      const graceRemainingDays = license.status === "expired" && license.expires_at
        ? Math.max(0, 7 - Math.floor((Date.now() - new Date(license.expires_at).getTime()) / 86400000))
        : null;

      return new Response(
        JSON.stringify({
          valid: false,
          status: license.status,
          message: `License is ${license.status}.`,
          product,
          product_name: productName,
          grace_remaining_days: graceRemainingDays,
          expires_at: license.expires_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    const now = new Date();
    if (license.expires_at && new Date(license.expires_at) < now) {
      // Auto-expire
      await supabase
        .from("licenses")
        .update({ status: "expired", updated_at: now.toISOString() })
        .eq("id", license.id);

      const daysPastExpiry = Math.floor((now.getTime() - new Date(license.expires_at).getTime()) / 86400000);
      const graceRemainingDays = Math.max(0, 7 - daysPastExpiry);

      return new Response(
        JSON.stringify({
          valid: graceRemainingDays > 0,
          status: graceRemainingDays > 0 ? "grace_period" : "expired",
          message: graceRemainingDays > 0
            ? `License expired. Grace period: ${graceRemainingDays} days remaining.`
            : "License has expired. Grace period ended.",
          product,
          product_name: productName,
          grace_remaining_days: graceRemainingDays,
          expires_at: license.expires_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Installation binding
    if (!license.bound_installation_id) {
      await supabase
        .from("licenses")
        .update({ bound_installation_id: installationId, updated_at: now.toISOString() })
        .eq("id", license.id);
    } else if (license.bound_installation_id !== installationId) {
      return new Response(
        JSON.stringify({
          valid: false,
          status: "bound_elsewhere",
          message: "License is bound to another installation.",
          product,
          product_name: productName,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update heartbeat
    await supabase
      .from("licenses")
      .update({ last_active_at: now.toISOString(), updated_at: now.toISOString() })
      .eq("id", license.id);

    // Calculate days until expiry
    const daysUntilExpiry = license.expires_at
      ? Math.floor((new Date(license.expires_at).getTime() - now.getTime()) / 86400000)
      : null;

    return new Response(
      JSON.stringify({
        valid: true,
        status: license.status,
        message: "License is active.",
        product,
        product_name: productName,
        product_category: licenseCategory,
        max_devices: license.max_devices,
        expires_at: license.expires_at,
        days_until_expiry: daysUntilExpiry,
        grace_remaining_days: null,
        warning: daysUntilExpiry !== null && daysUntilExpiry <= 7
          ? `License expires in ${daysUntilExpiry} days. Please renew soon.`
          : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Startup license check error:", err);
    return new Response(
      JSON.stringify({ valid: false, status: "error", message: "Internal error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
