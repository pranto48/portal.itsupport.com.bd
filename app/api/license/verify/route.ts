import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";

const ENCRYPTION_KEY = "ITSupportBD_SecureKey_2024";

// ─── Admin/Static Licenses ────────────────────────────────────────────────────
// Admin-created licenses that don't require a database lookup.
// These are provisioned directly here for admin installations.
const STATIC_LICENSES: Record<string, {
  status: string;
  expiresAt: string;
  maxDevices: number;
  orgId: string;
  productId: string;
}> = {
  "AMP256-B713A3E37B5FE53C-6F38AE70F5CC0DF6-EBB7A8AEFFB261B0-9401F60994D97223": {
    status: "active",
    expiresAt: "2027-12-31",
    maxDevices: 1,
    orgId: "admin-global",
    productId: "prod-ampos",
  },
  "AMPNM-DEVC-8F2B-9A4E-4321": {
    status: "active",
    expiresAt: "2027-01-10",
    maxDevices: 10,
    orgId: "org-bb",
    productId: "prod-cluster",
  },
  "AMPNM-DEVC-3C5D-8E1A-7654": {
    status: "active",
    expiresAt: "2027-02-15",
    maxDevices: 10,
    orgId: "org-gp",
    productId: "prod-enterprise",
  },
  "AMPNM-DEVC-5D4E-1C2A-9876": {
    status: "expired",
    expiresAt: "2026-05-12",
    maxDevices: 5,
    orgId: "org-dfn",
    productId: "prod-std",
  },
  "AMPNM-DEVC-1B2C-3D4E-5F6A": {
    status: "active",
    expiresAt: "2027-01-01",
    maxDevices: 10,
    orgId: "org-it",
    productId: "prod-cluster",
  },
};

// In-memory binding store for static licenses
const BINDING_STORE: Record<string, string> = {};

// In-memory verification cache for performance
interface CacheItem {
  response: any;
  timestamp: number;
}
const VERIFICATION_CACHE = new Map<string, CacheItem>();
const CACHE_TTL = 30000; // 30 seconds TTL for fast successive verifications

/**
 * Encrypts license data in AES-256-CBC format expected by the PHP AmPOS client.
 */
function encryptLicenseResponse(data: any): string {
  const keyBuffer = Buffer.alloc(32);
  keyBuffer.write(ENCRYPTION_KEY, "utf-8");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
  encrypted += cipher.final("base64");
  const combined = Buffer.concat([iv, Buffer.from(encrypted, "utf-8")]);
  return combined.toString("base64");
}

function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "unknown";
}

// Handle GET /api/license/verify
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key") || searchParams.get("app_license_key");
    const isPhpClient = searchParams.has("app_license_key");
    const installationId = searchParams.get("installation_id") || "";
    const currentDeviceCount = parseInt(searchParams.get("current_device_count") || "0", 10);
    const userId = searchParams.get("user_id") || "anonymous";

    if (!key) {
      const errorData = { success: false, message: "License key is required", actual_status: "invalid_request" };
      if (isPhpClient) return new Response(encryptLicenseResponse(errorData), { headers: { "Content-Type": "text/plain" } });
      return NextResponse.json({ valid: false, error: "License key is required" }, { status: 400 });
    }
    return await verifyCore(key, { isPhpClient, installationId, currentDeviceCount, userId }, request);
  } catch (error: any) {
    console.error("GET verify error:", error);
    return NextResponse.json({ valid: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Handle POST /api/license/verify
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const key = body.key || body.app_license_key;
    const isPhpClient = "app_license_key" in body;
    const installationId = body.installation_id || "";
    const currentDeviceCount = parseInt(body.current_device_count || "0", 10);
    const userId = body.user_id || "anonymous";

    if (!key) {
      const errorData = { success: false, message: "License key is required", actual_status: "invalid_request" };
      if (isPhpClient) return new Response(encryptLicenseResponse(errorData), { headers: { "Content-Type": "text/plain" } });
      return NextResponse.json({ valid: false, error: "License key is required" }, { status: 400 });
    }
    return await verifyCore(key, { isPhpClient, installationId, currentDeviceCount, userId }, request);
  } catch (error: any) {
    console.error("POST verify error:", error);
    return NextResponse.json({ valid: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Core Verification Logic
async function verifyCore(
  key: string,
  params: { isPhpClient: boolean; installationId: string; currentDeviceCount: number; userId: string },
  request: Request
) {
  const { isPhpClient, installationId } = params;

  // 1. Check cache first
  const cacheKey = `${key}:${installationId}:${isPhpClient}`;
  const cached = VERIFICATION_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const resPayload = cached.response;
    if (isPhpClient) {
      return new Response(encryptLicenseResponse(resPayload), { headers: { "Content-Type": "text/plain" } });
    }
    return NextResponse.json(resPayload, {
      status: resPayload.error ? (resPayload.status === "in_use" ? 409 : (resPayload.status === "not_found" ? 404 : 400)) : 200
    });
  }

  const clientIp = getClientIp(request);
  const now = new Date();

  // Helper to cache and return response
  const sendResponse = (payload: any, statusCode = 200) => {
    VERIFICATION_CACHE.set(cacheKey, { response: payload, timestamp: Date.now() });
    if (isPhpClient) {
      return new Response(encryptLicenseResponse(payload), { headers: { "Content-Type": "text/plain" } });
    }
    return NextResponse.json(payload, { status: statusCode });
  };

  // 2. Check static/admin licenses first
  const staticLicense = STATIC_LICENSES[key];
  if (staticLicense) {
    const expiresAt = new Date(staticLicense.expiresAt);

    if (staticLicense.status !== "active" && staticLicense.status !== "free") {
      return sendResponse(
        isPhpClient
          ? { success: false, message: `License is ${staticLicense.status}.`, actual_status: staticLicense.status }
          : { valid: false, status: staticLicense.status, error: `License is ${staticLicense.status}` }
      );
    }

    if (expiresAt < now) {
      return sendResponse(
        isPhpClient
          ? { success: false, message: "License has expired.", actual_status: "expired" }
          : { valid: false, status: "expired", error: "License has expired." }
      );
    }

    // Binding check (in-memory)
    if (installationId) {
      const boundId = BINDING_STORE[key];
      if (!boundId) {
        BINDING_STORE[key] = installationId;
      } else if (boundId !== installationId) {
        return sendResponse(
          isPhpClient
            ? { success: false, message: "License is already in use by another server.", actual_status: "in_use" }
            : { valid: false, status: "in_use", error: "License already in use by another server." },
          409
        );
      }
    }

    return sendResponse(
      isPhpClient
        ? {
            success: true,
            message: "License is active.",
            max_devices: staticLicense.maxDevices,
            actual_status: staticLicense.status,
            expires_at: staticLicense.expiresAt,
            core_key: "ITSupportBD_CoreShield_2026",
          }
        : {
            valid: true,
            status: staticLicense.status,
            expiresAt: staticLicense.expiresAt,
            orgId: staticLicense.orgId,
            productId: staticLicense.productId,
            lastIp: clientIp,
            lastVerifiedAt: new Date().toISOString(),
          }
    );
  }

  // 3. Query Firestore for other license keys
  try {
    const db = getAdminDb();
    const licSnap = await db.collection("licenses").where("key", "==", key).limit(1).get();

    if (!licSnap.empty) {
      const licDoc = licSnap.docs[0];
      const licData = licDoc.data();
      const expiresAt = new Date(licData.expiresAt);

      if (licData.status !== "active" && licData.status !== "free") {
        return sendResponse(
          isPhpClient
            ? { success: false, message: `License is ${licData.status}.`, actual_status: licData.status }
            : { valid: false, status: licData.status, error: `License is ${licData.status}` }
        );
      }

      if (expiresAt < now) {
        return sendResponse(
          isPhpClient
            ? { success: false, message: "License has expired.", actual_status: "expired" }
            : { valid: false, status: "expired", error: "License has expired." }
        );
      }

      // Binding check (write back to Firestore or in-memory)
      if (installationId) {
        if (!licData.installationId) {
          await licDoc.ref.update({
            installationId,
            lastIp: clientIp,
            lastVerifiedAt: new Date().toISOString()
          });
        } else if (licData.installationId !== installationId) {
          return sendResponse(
            isPhpClient
              ? { success: false, message: "License is already in use by another server.", actual_status: "in_use" }
              : { valid: false, status: "in_use", error: "License already in use by another server." },
            409
          );
        }
      } else {
        await licDoc.ref.update({
          lastIp: clientIp,
          lastVerifiedAt: new Date().toISOString()
        });
      }

      return sendResponse(
        isPhpClient
          ? {
              success: true,
              message: "License is active.",
              max_devices: licData.maxDevices || 1,
              actual_status: licData.status,
              expires_at: licData.expiresAt,
              core_key: "ITSupportBD_CoreShield_2026",
            }
          : {
              valid: true,
              status: licData.status,
              expiresAt: licData.expiresAt,
              orgId: licData.orgId,
              productId: licData.productId,
              lastIp: clientIp,
              lastVerifiedAt: new Date().toISOString(),
            }
      );
    }
  } catch (dbError) {
    console.error("Firestore database lookup failed:", dbError);
  }

  // 4. Key not found in static list or database
  return sendResponse(
    isPhpClient
      ? { success: false, message: "Invalid or unregistered application license key.", actual_status: "not_found" }
      : { valid: false, status: "not_found", error: "License key not registered in system database" },
    404
  );
}
