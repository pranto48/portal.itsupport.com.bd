import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * License Auto-Check Edge Function
 * Runs on a monthly schedule via pg_cron to:
 * 1. Auto-expire licenses past their expiry date
 * 2. Detect inactive licenses (no heartbeat in 30+ days)
 * 3. Re-verify all bound licenses against the verify-license endpoint
 * 4. Log a summary for admin review
 */

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

  const now = new Date();
  const summary = {
    run_at: now.toISOString(),
    total_licenses: 0,
    auto_expired: 0,
    inactive_flagged: 0,
    re_verified: 0,
    errors: 0,
    details: [] as Array<{ id: string; key_prefix: string; product: string; action: string; reason: string }>,
  };

  try {
    // Fetch all licenses with product info
    const { data: licenses, error } = await supabase
      .from("licenses")
      .select("*, products(name, category)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    summary.total_licenses = (licenses || []).length;

    const INACTIVE_THRESHOLD_DAYS = 30;
    const inactiveThreshold = new Date(now.getTime() - INACTIVE_THRESHOLD_DAYS * 86400000).toISOString();

    for (const license of licenses || []) {
      const productName = (license.products as any)?.name || "Unknown";
      const category = (license.products as any)?.category || "Unknown";
      const keyPrefix = license.license_key.slice(0, 8) + "...";

      // 1. Auto-expire licenses past expiry date
      if (
        license.expires_at &&
        new Date(license.expires_at) < now &&
        license.status === "active"
      ) {
        const { error: updateErr } = await supabase
          .from("licenses")
          .update({ status: "expired", updated_at: now.toISOString() })
          .eq("id", license.id);

        if (updateErr) {
          summary.errors++;
          summary.details.push({ id: license.id, key_prefix: keyPrefix, product: `${category}/${productName}`, action: "error", reason: `Failed to expire: ${updateErr.message}` });
        } else {
          summary.auto_expired++;
          summary.details.push({ id: license.id, key_prefix: keyPrefix, product: `${category}/${productName}`, action: "auto_expired", reason: `Expired at ${license.expires_at}` });
        }
        continue;
      }

      // 2. Flag inactive bound licenses (no heartbeat in 30+ days)
      if (
        license.bound_installation_id &&
        license.last_active_at &&
        new Date(license.last_active_at) < new Date(inactiveThreshold) &&
        (license.status === "active" || license.status === "free")
      ) {
        summary.inactive_flagged++;
        summary.details.push({
          id: license.id, key_prefix: keyPrefix, product: `${category}/${productName}`,
          action: "inactive_flagged",
          reason: `No heartbeat since ${license.last_active_at} (${Math.floor((now.getTime() - new Date(license.last_active_at).getTime()) / 86400000)} days)`,
        });
      }

      // 3. Re-verify bound active/free licenses via verify-license endpoint
      if (
        license.bound_installation_id &&
        (license.status === "active" || license.status === "free")
      ) {
        try {
          const verifyUrl = `${supabaseUrl}/functions/v1/verify-license`;
          await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              app_license_key: license.license_key,
              user_id: license.customer_id,
              current_device_count: license.current_devices,
              installation_id: license.bound_installation_id,
            }),
          });

          // Re-read to check if status changed
          const { data: refreshed } = await supabase
            .from("licenses")
            .select("status")
            .eq("id", license.id)
            .single();

          const newStatus = refreshed?.status || license.status;
          summary.re_verified++;

          if (newStatus !== license.status) {
            summary.details.push({
              id: license.id, key_prefix: keyPrefix, product: `${category}/${productName}`,
              action: "status_changed",
              reason: `${license.status} → ${newStatus}`,
            });
          }
        } catch (verifyErr) {
          summary.errors++;
          summary.details.push({
            id: license.id, key_prefix: keyPrefix, product: `${category}/${productName}`,
            action: "verify_error",
            reason: (verifyErr as Error).message,
          });
        }
      }
    }

    // Log the auto-check run to verification log
    try {
      await supabase.from("license_verification_log").insert({
        license_key_hash: "AUTO_CHECK_CRON",
        ip_address: "system",
        installation_id: null,
        result: "auto_check",
        reason: `Monthly auto-check: ${summary.total_licenses} total, ${summary.auto_expired} expired, ${summary.inactive_flagged} inactive, ${summary.re_verified} re-verified, ${summary.errors} errors`,
      });
    } catch (logErr) {
      console.error("Failed to log auto-check:", logErr);
    }

    console.log(`✅ License auto-check complete: ${JSON.stringify(summary)}`);

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("License auto-check error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
