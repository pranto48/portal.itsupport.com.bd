#!/usr/bin/env bash
set -euo pipefail

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          LifeOS - Personal Life Management System          ║"
echo "║              Docker Version - Starting...                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# --- Startup License Auto-Check ---
PORTAL_CHECK_URL="${LICENSE_PORTAL_URL:-https://abcytwvuntyicdknpzju.supabase.co/functions/v1/startup-license-check}"
INSTALL_ID_FILE="/app/data/.installation_id"

# Get or generate installation ID
if [ -f "$INSTALL_ID_FILE" ]; then
    INSTALL_ID=$(cat "$INSTALL_ID_FILE")
else
    INSTALL_ID="LIFEOS-$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || date +%s%N)"
    mkdir -p "$(dirname "$INSTALL_ID_FILE")"
    echo "$INSTALL_ID" > "$INSTALL_ID_FILE"
fi

if [ -z "${APP_LICENSE_KEY:-}" ]; then
    echo "⚠️  WARNING: No license key provided!"
    echo "    Set APP_LICENSE_KEY in docker-compose.yml"
    echo "    Application will require license activation during setup."
    echo ""
else
    echo "→ Validating license on startup..."
    LICENSE_RESPONSE=$(curl -s -m 15 -X POST "$PORTAL_CHECK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"license_key\":\"${APP_LICENSE_KEY}\",\"installation_id\":\"${INSTALL_ID}\",\"product\":\"LifeOS\"}" \
        2>/dev/null || echo '{"valid":false,"status":"offline","message":"Portal unreachable"}')

    LICENSE_VALID=$(echo "$LICENSE_RESPONSE" | grep -o '"valid":\s*true' || true)
    LICENSE_STATUS=$(echo "$LICENSE_RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "unknown")
    LICENSE_MSG=$(echo "$LICENSE_RESPONSE" | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    LICENSE_WARNING=$(echo "$LICENSE_RESPONSE" | grep -o '"warning":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

    if [ -n "$LICENSE_VALID" ]; then
        echo "✓ License validated: ${LICENSE_STATUS}"
        if [ -n "$LICENSE_WARNING" ]; then
            echo "  ⚠️  ${LICENSE_WARNING}"
        fi
        echo "$(date -Iseconds)" > /app/data/.last_license_check
        echo "$LICENSE_STATUS" > /app/data/.license_status
    else
        echo "⚠️  License check: ${LICENSE_STATUS} - ${LICENSE_MSG}"
        if [ -f "/app/data/.license_status" ]; then
            CACHED_STATUS=$(cat /app/data/.license_status)
            if [ "$CACHED_STATUS" = "active" ] || [ "$CACHED_STATUS" = "free" ]; then
                echo "  → Using cached license status: ${CACHED_STATUS}"
                echo "  → Application will continue in offline mode"
            else
                echo "  ✗ No valid cached license. Application may require re-activation."
            fi
        fi
    fi
    echo ""
fi

# Check for headless admin setup
if [ -n "${ADMIN_EMAIL:-}" ] && [ -n "${ADMIN_PASSWORD:-}" ]; then
    echo "✓ Admin credentials detected (headless setup mode)"
    echo "  Admin account will be created automatically"
    echo ""
fi

# Verify critical files exist
echo "→ Verifying application integrity..."
CRITICAL_FILES=(
    "/app/server.js"
    "/app/package.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "✗ CRITICAL ERROR: Missing file: $file"
        echo "  Application cannot start without all core files."
        exit 1
    fi
done
echo "✓ All critical files present"
echo ""

# Set secure permissions
echo "→ Setting secure file permissions..."
chmod 644 /app/server.js
chmod 644 /app/package.json
echo "✓ Permissions configured"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "  LifeOS is starting on port ${API_PORT:-3001}"
echo "  Backend API: http://localhost:${API_PORT:-3001}"
echo ""
echo "  On first run, visit the frontend to complete setup:"
echo "    1. Create admin account"
echo "    2. Enter license key"
echo "════════════════════════════════════════════════════════════"
echo ""

exec node /app/server.js
