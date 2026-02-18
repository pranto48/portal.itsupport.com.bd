import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Encryption config - MUST match the Docker app's license_manager.php
const ENCRYPTION_KEY = "ITSupportBD_SecureKey_2024";
const CIPHER_METHOD = "aes-256-cbc";

async function encryptLicenseData(data: Record<string, unknown>): Promise<string> {
  const jsonStr = JSON.stringify(data);
  
  // Generate random IV (16 bytes for AES-256-CBC)
  const iv = crypto.getRandomValues(new Uint8Array(16));
  
  // PHP openssl_encrypt pads the key with null bytes to 32 bytes for aes-256-cbc
  const keyBytes = new Uint8Array(32);
  const rawKey = new TextEncoder().encode(ENCRYPTION_KEY);
  keyBytes.set(rawKey.slice(0, 32));
  // Remaining bytes stay 0 (null-padded) - matches PHP behavior
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  
  // PHP openssl_encrypt with options=0 uses PKCS7 padding (default) and returns base64
  // Web Crypto also uses PKCS7 padding by default for AES-CBC
  const plainBytes = new TextEncoder().encode(jsonStr);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    plainBytes
  );
  
  // PHP openssl_encrypt with options=0 returns base64-encoded ciphertext
  const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  
  // PHP code does: base64_encode($iv . $encrypted_base64_string)
  // $iv is raw bytes, $encrypted is the base64 string from openssl_encrypt
  const ivStr = String.fromCharCode(...iv);
  const combined = ivStr + encryptedBase64;
  
  return btoa(combined);
}

Deno.serve(async (req) => {
  // This endpoint must be accessible without auth (Docker app calls it directly)
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(
      await encryptLicenseData({
        success: false,
        message: "Method not allowed.",
        actual_status: "invalid_request",
      }),
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  try {
    const input = await req.json();
    console.log("License verification received input:", JSON.stringify(input));

    const appLicenseKey = input.app_license_key ?? null;
    const userId = input.user_id ?? null;
    const currentDeviceCount = input.current_device_count ?? 0;
    const installationId = input.installation_id ?? null;

    if (!appLicenseKey || !userId || !installationId) {
      console.log("License verification failed: Missing required fields.");
      const encrypted = await encryptLicenseData({
        success: false,
        message: "Missing application license key, user ID, or installation ID.",
        actual_status: "invalid_request",
      });
      return new Response(encrypted, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Connect to Supabase with service role key for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Fetch the license
    const { data: license, error: fetchError } = await supabase
      .from("licenses")
      .select("*")
      .eq("license_key", appLicenseKey)
      .maybeSingle();

    if (fetchError) {
      console.error("DB error fetching license:", fetchError.message);
      const encrypted = await encryptLicenseData({
        success: false,
        message: "An internal error occurred during license verification.",
        actual_status: "error",
      });
      return new Response(encrypted, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (!license) {
      const encrypted = await encryptLicenseData({
        success: false,
        message: "Invalid or expired application license key.",
        actual_status: "not_found",
      });
      return new Response(encrypted, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 2. Check license status
    if (license.status !== "active" && license.status !== "free") {
      const encrypted = await encryptLicenseData({
        success: false,
        message: `License is ${license.status}.`,
        actual_status: license.status,
      });
      return new Response(encrypted, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 3. Check expiry
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await supabase
        .from("licenses")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", license.id);

      const encrypted = await encryptLicenseData({
        success: false,
        message: "License has expired.",
        actual_status: "expired",
      });
      return new Response(encrypted, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 4. Enforce one-to-one binding using installation_id
    if (!license.bound_installation_id) {
      await supabase
        .from("licenses")
        .update({
          bound_installation_id: installationId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", license.id);
      console.log(`License '${appLicenseKey}' bound to installation: ${installationId}`);
    } else if (license.bound_installation_id !== installationId) {
      const encrypted = await encryptLicenseData({
        success: false,
        message: "License is already in use by another server.",
        actual_status: "in_use",
      });
      return new Response(encrypted, {
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 5. Update current_devices and last_active_at
    await supabase
      .from("licenses")
      .update({
        current_devices: currentDeviceCount,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", license.id);

    // 6. Return encrypted success
    const encrypted = await encryptLicenseData({
      success: true,
      message: "License is active.",
      max_devices: license.max_devices ?? 1,
      actual_status: license.status,
      expires_at: license.expires_at,
    });

    console.log(`License verification successful for key: ${appLicenseKey}`);
    return new Response(encrypted, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err) {
    console.error("License verification error:", err);
    const encrypted = await encryptLicenseData({
      success: false,
      message: "An internal error occurred during license verification.",
      actual_status: "error",
    });
    return new Response(encrypted, {
      headers: { "Content-Type": "text/plain" },
    });
  }
});
