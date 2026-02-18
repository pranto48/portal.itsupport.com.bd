import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Encryption config - MUST match the Docker app's license_manager.php
const ENCRYPTION_KEY = "ITSupportBD_SecureKey_2024";

// Rate limiting: max failed attempts per IP within window
const MAX_FAILED_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MINUTES = 15;

async function hashString(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function encryptLicenseData(data: Record<string, unknown>): Promise<string> {
  const jsonStr = JSON.stringify(data);
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const keyBytes = new Uint8Array(32);
  const rawKey = new TextEncoder().encode(ENCRYPTION_KEY);
  keyBytes.set(rawKey.slice(0, 32));

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt"]
  );

  const plainBytes = new TextEncoder().encode(jsonStr);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv }, cryptoKey, plainBytes
  );

  const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  const ivStr = String.fromCharCode(...iv);
  return btoa(ivStr + encryptedBase64);
}

async function logVerification(
  supabase: ReturnType<typeof createClient>,
  licenseKeyHash: string,
  ip: string,
  installationId: string | null,
  result: string,
  reason: string
) {
  try {
    await supabase.from("license_verification_log").insert({
      license_key_hash: licenseKeyHash,
      ip_address: ip,
      installation_id: installationId,
      result,
      reason,
    });
  } catch (e) {
    console.error("Failed to log verification:", e);
  }
}

async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  ip: string
): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("license_verification_log")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("result", "failed")
    .gte("created_at", windowStart);

  if (error) {
    console.error("Rate limit check error:", error);
    return false; // fail open to avoid blocking legitimate users
  }

  return (count ?? 0) >= MAX_FAILED_ATTEMPTS;
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      await encryptLicenseData({ success: false, message: "Method not allowed.", actual_status: "invalid_request" }),
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const clientIp = getClientIp(req);

  try {
    // Rate limit check
    const isRateLimited = await checkRateLimit(supabase, clientIp);
    if (isRateLimited) {
      console.warn(`Rate limited IP: ${clientIp}`);
      return new Response(
        await encryptLicenseData({ success: false, message: "Too many requests. Try again later.", actual_status: "rate_limited" }),
        { status: 429, headers: { "Content-Type": "text/plain" } }
      );
    }

    // Parse input - support both JSON and form-encoded
    let input: Record<string, unknown>;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      input = Object.fromEntries(formData.entries());
    } else {
      input = await req.json();
    }

    const appLicenseKey = String(input.app_license_key ?? "").trim();
    const userId = String(input.user_id ?? "").trim();
    const currentDeviceCount = Number(input.current_device_count ?? 0);
    const installationId = String(input.installation_id ?? "").trim();

    // Validate required fields
    if (!appLicenseKey || !userId || !installationId) {
      const keyHash = appLicenseKey ? await hashString(appLicenseKey) : "empty";
      await logVerification(supabase, keyHash, clientIp, installationId || null, "failed", "missing_fields");
      return new Response(
        await encryptLicenseData({ success: false, message: "Missing required parameters.", actual_status: "invalid_request" }),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // Validate input lengths to prevent abuse
    if (appLicenseKey.length > 500 || userId.length > 500 || installationId.length > 500) {
      return new Response(
        await encryptLicenseData({ success: false, message: "Invalid request.", actual_status: "invalid_request" }),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    const licenseKeyHash = await hashString(appLicenseKey);

    // Fetch the license
    const { data: license, error: fetchError } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", appLicenseKey)
      .maybeSingle();

    if (fetchError) {
      console.error("DB error fetching license:", fetchError.message);
      await logVerification(supabase, licenseKeyHash, clientIp, installationId, "error", "db_error");
      return new Response(
        await encryptLicenseData({ success: false, message: "Verification service error.", actual_status: "error" }),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    if (!license) {
      await logVerification(supabase, licenseKeyHash, clientIp, installationId, "failed", "not_found");
      // Generic message - don't reveal whether key exists
      return new Response(
        await encryptLicenseData({ success: false, message: "License verification failed.", actual_status: "not_found" }),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // Check license status
    if (license.status !== "active" && license.status !== "free") {
      await logVerification(supabase, licenseKeyHash, clientIp, installationId, "failed", `status_${license.status}`);
      return new Response(
        await encryptLicenseData({ success: false, message: "License verification failed.", actual_status: license.status }),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // Check expiry
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await supabase
        .from("licenses")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", license.id);
      await logVerification(supabase, licenseKeyHash, clientIp, installationId, "failed", "expired");
      return new Response(
        await encryptLicenseData({ success: false, message: "License has expired.", actual_status: "expired" }),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // Enforce hardware binding
    if (!license.bound_installation_id) {
      await supabase
        .from("licenses")
        .update({ bound_installation_id: installationId, updated_at: new Date().toISOString() })
        .eq("id", license.id);
    } else if (license.bound_installation_id !== installationId) {
      await logVerification(supabase, licenseKeyHash, clientIp, installationId, "failed", "installation_mismatch");
      return new Response(
        await encryptLicenseData({ success: false, message: "License is bound to another installation.", actual_status: "in_use" }),
        { headers: { "Content-Type": "text/plain" } }
      );
    }

    // Update device count and activity
    await supabase
      .from("licenses")
      .update({
        current_devices: currentDeviceCount,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", license.id);

    // Log success
    await logVerification(supabase, licenseKeyHash, clientIp, installationId, "success", "valid");

    return new Response(
      await encryptLicenseData({
        success: true,
        message: "License is active.",
        max_devices: license.max_devices ?? 1,
        actual_status: license.status,
        expires_at: license.expires_at,
      }),
      { headers: { "Content-Type": "text/plain" } }
    );
  } catch (err) {
    console.error("License verification error:", err);
    return new Response(
      await encryptLicenseData({ success: false, message: "Verification service error.", actual_status: "error" }),
      { headers: { "Content-Type": "text/plain" } }
    );
  }
});
