import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const now = Date.now();
  const EXPIRY_WARN_DAYS = 7;
  const INACTIVITY_DAYS = 30;
  const summary = { expiry_alerts: 0, inactivity_alerts: 0, errors: 0 };

  try {
    const { data: licenses, error } = await supabase
      .from("licenses")
      .select("*, products(name, category)")
      .in("status", ["active", "free"]);

    if (error) throw error;

    for (const lic of licenses || []) {
      const product = (lic.products as any);
      const category = product?.category || "Unknown";
      const productName = product?.name || "Unknown";
      const keyPrefix = lic.license_key.slice(0, 12) + "...";

      // 1. Expiry warning (within N days)
      if (lic.expires_at) {
        const daysLeft = (new Date(lic.expires_at).getTime() - now) / 86400000;
        if (daysLeft > 0 && daysLeft <= EXPIRY_WARN_DAYS) {
          const severity = daysLeft <= 2 ? "critical" : "warning";
          // Check for duplicate alert
          const { data: existing } = await supabase
            .from("admin_alerts")
            .select("id")
            .eq("license_id", lic.id)
            .eq("alert_type", "expiry_warning")
            .eq("is_dismissed", false)
            .limit(1);

          if (!existing?.length) {
            await supabase.from("admin_alerts").insert({
              alert_type: "expiry_warning",
              severity,
              title: `License expiring in ${Math.ceil(daysLeft)} day(s)`,
              message: `[${category}] ${productName} — Key: ${keyPrefix} expires on ${new Date(lic.expires_at).toLocaleDateString()}. Customer: ${lic.customer_id}`,
              license_id: lic.id,
              product_category: category,
            });
            summary.expiry_alerts++;
          }
        }
      }

      // 2. Inactivity alert (no heartbeat in N days for bound licenses)
      if (lic.bound_installation_id && lic.last_active_at) {
        const inactiveDays = (now - new Date(lic.last_active_at).getTime()) / 86400000;
        if (inactiveDays >= INACTIVITY_DAYS) {
          const { data: existing } = await supabase
            .from("admin_alerts")
            .select("id")
            .eq("license_id", lic.id)
            .eq("alert_type", "inactivity")
            .eq("is_dismissed", false)
            .limit(1);

          if (!existing?.length) {
            await supabase.from("admin_alerts").insert({
              alert_type: "inactivity",
              severity: "info",
              title: `License inactive for ${Math.floor(inactiveDays)} days`,
              message: `[${category}] ${productName} — Key: ${keyPrefix} bound to ${lic.bound_installation_id.slice(0, 16)}... has not sent a heartbeat since ${new Date(lic.last_active_at).toLocaleDateString()}.`,
              license_id: lic.id,
              product_category: category,
            });
            summary.inactivity_alerts++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("License alerts error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
