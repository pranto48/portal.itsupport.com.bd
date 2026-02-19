

# LifeOS Docker Install System -- Admin + License Setup (like AMPNM)

## Overview

Create a Docker entrypoint script for LifeOS that mirrors the AMPNM Docker install experience: on first launch, the system prompts for admin credentials and then asks for a license key before granting access. This adds a `docker-entrypoint.sh` to the LifeOS backend container, enhances the backend server to enforce a first-run setup flow, and updates the frontend Setup page to work seamlessly within Docker.

## What Changes

### 1. Create `lifeos/docker/backend/docker-entrypoint.sh`
A bash entrypoint script (similar to `docker-ampnm/docker-entrypoint.sh`) that:
- Prints a branded LifeOS startup banner
- Checks for `APP_LICENSE_KEY` environment variable and reports status
- Verifies critical file integrity (`server.js`, `package.json`)
- Sets secure file permissions
- Launches the Node.js backend server

### 2. Update `lifeos/docker/backend/Dockerfile`
- Copy the new entrypoint script into the container
- Make it executable
- Set it as the `ENTRYPOINT` instead of using bare `CMD`

### 3. Enhance `lifeos/docker/backend/server.js` -- First-Run Setup Gate
Add a setup-detection route and enforce the setup flow:
- New `GET /api/setup/status` returns `{ needsSetup: true }` when no admin user has been configured via the wizard (checks `app_settings.setup_complete`)
- New `POST /api/setup/admin` endpoint accepts admin email, password, and name -- creates the admin account and marks setup as started (but not complete until license is configured)
- Modify `POST /api/license/setup` to mark `setup_complete = true` only after successful license activation
- Update `seedDefaultAdmin()` to skip seeding if an admin was already created through the wizard (so the Docker user's chosen credentials take priority)
- Add a setup-enforcement middleware: if `setup_complete` is false, block all routes except `/api/setup/*`, `/api/license/*`, and `/api/auth/*`

### 4. Update `lifeos/src/pages/Setup.tsx` -- Docker-Aware Flow
Adjust the existing 6-step wizard to detect Docker mode and simplify:
- On mount, call `GET /api/setup/status` to check if setup is needed
- If running in Docker (auto-detected via environment presets), skip the "environment" and "database" steps (Docker Compose pre-configures the database)
- Show only: Welcome -> Admin Account -> License Key -> Complete
- The Admin step calls `POST /api/setup/admin` with the user's chosen credentials
- The License step works as it does now, calling `POST /api/license/setup`
- On completion, redirect to the login page with the new admin credentials

### 5. Update `lifeos/docker-compose.yml`
- Add `APP_LICENSE_KEY` environment variable placeholder (like AMPNM)
- Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` optional env vars for headless setup
- Add a comment block explaining the first-run setup wizard

## Technical Details

```text
Docker Start Flow:
+----------------------------+
| docker-compose up          |
+----------------------------+
           |
           v
+----------------------------+
| docker-entrypoint.sh       |
| - Print banner             |
| - Check APP_LICENSE_KEY    |
| - Verify files             |
| - Start node server.js     |
+----------------------------+
           |
           v
+----------------------------+
| server.js starts           |
| - Connect to PostgreSQL    |
| - Ensure schema exists     |
| - Check setup_complete     |
| - If false: enforce setup  |
+----------------------------+
           |
           v
+----------------------------+
| User visits http://...     |
| Frontend detects Docker    |
| Shows: Admin -> License    |
+----------------------------+
```

### Files to Create
- `lifeos/docker/backend/docker-entrypoint.sh` -- Startup script with banner, checks, and server launch

### Files to Modify
- `lifeos/docker/backend/Dockerfile` -- Add entrypoint script, set ENTRYPOINT
- `lifeos/docker/backend/server.js` -- Add setup gate, admin creation endpoint, skip default seed when wizard-configured
- `lifeos/src/pages/Setup.tsx` -- Docker-aware simplified flow (Admin + License only)
- `lifeos/docker-compose.yml` -- Add env var placeholders and comments

