

## Problem

The error `Cannot read properties of undefined (reading 'digest')` occurs in the LifeOS Docker environment because `crypto.subtle` is **undefined** in non-secure contexts (HTTP without HTTPS). Docker containers often run on plain HTTP, where the Web Crypto API's `subtle` interface is not available.

The issue is in `lifeos/src/lib/licenseConfig.ts` at the `computeIntegrity` function (line 119), which calls `crypto.subtle.digest('SHA-256', ...)` without checking if `crypto.subtle` exists. This function is called by both `saveLicenseInfo` and `getLicenseInfo`, breaking the entire license flow.

The same issue was previously fixed for `crypto.randomUUID` but missed for `crypto.subtle.digest`.

## Plan

**Edit `lifeos/src/lib/licenseConfig.ts`**:

1. Add a fallback hash function that works without `crypto.subtle` -- use a simple string hash (djb2 or similar) when `crypto.subtle` is unavailable. This is only a client-side integrity check (not a security boundary, as noted in the existing comments), so a simpler hash is acceptable.

2. Update `computeIntegrity` (lines 110-126) to check `if (typeof crypto !== 'undefined' && crypto.subtle)` before using `crypto.subtle.digest`, falling back to the simple hash otherwise.

This is a one-file, targeted fix that matches the pattern already used for `crypto.randomUUID` on line 91.

