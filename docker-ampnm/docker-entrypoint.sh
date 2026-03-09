#!/usr/bin/env bash
set -euo pipefail

APACHE_PORT="${APACHE_PORT:-2266}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       AMPNM - Advanced Multi-Protocol Network Monitor     ║"
echo "║              Docker Version - Starting...                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# --- Startup License Auto-Check ---
PORTAL_CHECK_URL="${LICENSE_PORTAL_URL:-https://abcytwvuntyicdknpzju.supabase.co/functions/v1/startup-license-check}"
INSTALLATION_ID_FILE="/var/www/html/data/.installation_id"

# Get or generate installation ID
if [ -f "$INSTALLATION_ID_FILE" ]; then
    INSTALL_ID=$(cat "$INSTALLATION_ID_FILE")
else
    INSTALL_ID="AMPNM-$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || date +%s%N)"
    mkdir -p "$(dirname "$INSTALLATION_ID_FILE")"
    echo "$INSTALL_ID" > "$INSTALLATION_ID_FILE"
fi

if [ -z "${APP_LICENSE_KEY:-}" ]; then
    echo "⚠️  WARNING: No license key provided!"
    echo "    Set APP_LICENSE_KEY in docker-compose.yml"
    echo "    Application will require license activation after startup."
    echo ""
else
    echo "→ Validating license on startup..."
    LICENSE_RESPONSE=$(curl -s -m 15 -X POST "$PORTAL_CHECK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"license_key\":\"${APP_LICENSE_KEY}\",\"installation_id\":\"${INSTALL_ID}\",\"product\":\"AMPNM\"}" \
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
        # Cache successful validation timestamp
        echo "$(date -Iseconds)" > /var/www/html/data/.last_license_check
        echo "$LICENSE_STATUS" > /var/www/html/data/.license_status
    else
        echo "⚠️  License check: ${LICENSE_STATUS} - ${LICENSE_MSG}"
        # Check if we have a cached valid status (offline grace)
        if [ -f "/var/www/html/data/.license_status" ]; then
            CACHED_STATUS=$(cat /var/www/html/data/.license_status)
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

# Verify critical files exist
echo "→ Verifying application integrity..."
CRITICAL_FILES=(
    "/var/www/html/license_guard.php"
    "/var/www/html/includes/license_manager.php"
    "/var/www/html/includes/auth_check.php"
    "/var/www/html/config.php"
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
chown -R www-data:www-data /var/www/html
find /var/www/html -type f -name "*.php" -exec chmod 644 {} \;
find /var/www/html -type d -exec chmod 755 {} \;

# Make license files read-only for www-data
chmod 444 /var/www/html/license_guard.php
chmod 444 /var/www/html/includes/license_manager.php
echo "✓ Permissions configured"
echo ""

echo "→ Configuring Apache to listen on port ${APACHE_PORT}..."
sed -ri "s/Listen 80/Listen ${APACHE_PORT}/" /etc/apache2/ports.conf || true
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${APACHE_PORT}>/" /etc/apache2/sites-available/000-default.conf || true
echo "✓ Apache configured"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "  AMPNM is starting on port ${APACHE_PORT}"
echo "  Access at: http://localhost:${APACHE_PORT}"
echo "════════════════════════════════════════════════════════════"
echo ""

exec apache2-foreground
