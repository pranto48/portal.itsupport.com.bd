

# License Verification Endpoint - Stable URL Strategy

## Problem

Currently, Docker AMPNM apps connect to the backend edge function directly at a backend-specific URL. If you change your backend or database, the URL changes and all Docker clients lose their license connection.

You want a stable URL like `https://portal.itsupport.com.bd/verify_license` that never changes, regardless of backend migrations.

## Important Limitation

Your portal is a React single-page application (SPA). React apps run entirely in the browser and **cannot handle server-side POST requests** from Docker's PHP `file_get_contents()`. A React route at `/verify_license` would only render a webpage -- it cannot process the encrypted license API calls from Docker.

The actual license verification **must** use a backend function, which is what is already deployed and working.

## Plan

### 1. Add an Admin "License Endpoint" management page

Create a new admin page at `/admin/license-endpoint` that displays:
- The current active license verification endpoint URL
- A "Copy URL" button for easy copying
- Migration instructions for Docker clients
- A step-by-step guide for updating Docker `config.php`

### 2. Add navigation link

Add a "License Endpoint" link in the admin navigation menu.

### 3. Show Docker migration notes on the page

The page will include clear instructions:

```text
Current Endpoint URL:
https://[project-id].supabase.co/functions/v1/verify-license

To configure your Docker AMPNM app:
1. Open your config.php file
2. Change LICENSE_API_URL to the URL above
3. Restart your Docker container

If you migrate to a new backend:
1. Export your database backup from Admin > Backup
2. Set up the new backend and import the backup
3. Deploy the verify-license function
4. Update LICENSE_API_URL in all Docker clients
```

### 4. No changes to the existing edge function

The `verify-license` edge function already works correctly with AES-256-CBC encryption, installation binding, expiry checks, and grace periods. No modifications needed.

## Technical Details

### New file
- `src/pages/admin/AdminLicenseEndpoint.tsx` -- admin page showing endpoint URL, copy button, and migration docs

### Modified files
- `src/App.tsx` -- add route `/admin/license-endpoint`
- `src/components/PortalNavbar.tsx` -- add navigation link

### Recommendation for a truly stable URL

If you want `https://portal.itsupport.com.bd/verify_license.php` to always work regardless of backend changes, you would need to set up a **reverse proxy** on your web server (e.g., Nginx or Apache) that forwards POST requests to the current backend function URL. This is done outside Lovable, at your domain's hosting/server level. The admin page will include these Nginx/Apache configuration examples as well.

