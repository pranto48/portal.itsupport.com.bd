import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify caller is admin
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = claims.claims.sub as string;
  const adminClient = createClient(supabaseUrl, serviceKey);

  const { data: roleData } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch all licenses with their product info
    const { data: licenses, error: fetchErr } = await adminClient
      .from("licenses")
      .select("*, products(name, category)")
      .order("created_at", { ascending: false });

    if (fetchErr) throw fetchErr;

    const verifyUrl = `${supabaseUrl}/functions/v1/verify-license`;
    const results: Array<{
      license_id: string;
      license_key: string;
      product_name: string;
      category: string;
      previous_status: string;
      new_status: string;
      message: string;
      changed: boolean;
    }> = [];

    for (const license of licenses || []) {
      const productName = (license.products as any)?.name || "Unknown";
      const category = (license.products as any)?.category || "Unknown";

      // Skip licenses without bound installations (never activated)
      if (!license.bound_installation_id) {
        results.push({
          license_id: license.id,
          license_key: license.license_key,
          product_name: productName,
          category,
          previous_status: license.status,
          new_status: license.status,
          message: "Skipped — no bound installation",
          changed: false,
        });
        continue;
      }

      // Call verify-license to check current state
      try {
        const verifyRes = await fetch(verifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app_license_key: license.license_key,
            user_id: license.customer_id,
            current_device_count: license.current_devices,
            installation_id: license.bound_installation_id,
          }),
        });

        // The verify-license returns encrypted data, but we can check the HTTP status
        // and also re-read the license from DB to see if verify-license updated it
        const { data: refreshed } = await adminClient
          .from("licenses")
          .select("status")
          .eq("id", license.id)
          .single();

        const newStatus = refreshed?.status || license.status;
        const changed = newStatus !== license.status;

        results.push({
          license_id: license.id,
          license_key: license.license_key,
          product_name: productName,
          category,
          previous_status: license.status,
          new_status: newStatus,
          message: changed
            ? `Status changed: ${license.status} → ${newStatus}`
            : `Verified — status unchanged (${newStatus})`,
          changed,
        });
      } catch (verifyErr) {
        results.push({
          license_id: license.id,
          license_key: license.license_key,
          product_name: productName,
          category,
          previous_status: license.status,
          new_status: license.status,
          message: `Verification error: ${(verifyErr as Error).message}`,
          changed: false,
        });
      }
    }

    const summary = {
      total: results.length,
      verified: results.filter((r) => !r.changed && !r.message.includes("Skipped")).length,
      changed: results.filter((r) => r.changed).length,
      skipped: results.filter((r) => r.message.includes("Skipped")).length,
      errors: results.filter((r) => r.message.includes("error")).length,
    };

    return new Response(
      JSON.stringify({ success: true, summary, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Reconciliation error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
