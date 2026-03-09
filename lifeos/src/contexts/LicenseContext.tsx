import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  getLicenseInfo,
  saveLicenseInfo,
  getInstallationId,
  verifyLicenseViaBackend,
  type LicenseInfo,
  getPlanFromMaxDevices,
} from '@/lib/licenseConfig';
import { detectMode } from '@/lib/selfHostedConfig';

/**
 * LifeOS License Enforcement Context
 * 
 * On app startup and periodically (every 6 hours), verifies the license
 * against the portal backend. Gates app access if license is invalid.
 * 
 * Lifecycle:
 * 1. On mount → check local cache → call startup-license-check endpoint
 * 2. If valid → allow app access, store result locally
 * 3. If invalid → show enforcement screen, block app access
 * 4. Grace period → allow access with warning banner
 * 5. Periodic re-check every 6 hours
 */

const RECHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const PORTAL_STARTUP_CHECK_URL = 'https://abcytwvuntyicdknpzju.supabase.co/functions/v1/startup-license-check';

interface LicenseState {
  checking: boolean;
  valid: boolean;
  status: string;
  message: string;
  warning: string | null;
  graceRemainingDays: number | null;
  licenseInfo: LicenseInfo | null;
  recheckLicense: () => Promise<void>;
}

const LicenseContext = createContext<LicenseState>({
  checking: true,
  valid: false,
  status: 'unknown',
  message: '',
  warning: null,
  graceRemainingDays: null,
  licenseInfo: null,
  recheckLicense: async () => {},
});

export const useLicense = () => useContext(LicenseContext);

interface LicenseGateProviderProps {
  children: ReactNode;
}

export function LicenseGateProvider({ children }: LicenseGateProviderProps) {
  const [state, setState] = useState<Omit<LicenseState, 'recheckLicense'>>({
    checking: true,
    valid: false,
    status: 'unknown',
    message: '',
    warning: null,
    graceRemainingDays: null,
    licenseInfo: null,
  });

  const checkLicense = useCallback(async () => {
    setState(s => ({ ...s, checking: true }));

    const config = detectMode();
    const storedLicense = getLicenseInfo();
    const licenseKey = storedLicense?.licenseKey || '';
    const installationId = getInstallationId();

    if (!licenseKey) {
      setState({
        checking: false,
        valid: false,
        status: 'unconfigured',
        message: 'No license key configured. Please complete setup.',
        warning: null,
        graceRemainingDays: null,
        licenseInfo: null,
      });
      return;
    }

    try {
      let result: any;

      if (config.mode === 'selfhosted') {
        // Self-hosted: try local backend first, then portal
        try {
          const backendResult = await verifyLicenseViaBackend(licenseKey, config.apiUrl);
          if (backendResult.success !== undefined) {
            result = {
              valid: backendResult.success,
              status: backendResult.actual_status || (backendResult.success ? 'active' : 'invalid'),
              message: backendResult.message,
              max_devices: backendResult.max_devices,
              expires_at: backendResult.expires_at,
              warning: null,
              grace_remaining_days: null,
            };
          }
        } catch {
          // Backend unreachable, try portal directly
        }
      }

      // If no result yet, call portal's startup-license-check
      if (!result) {
        const response = await fetch(PORTAL_STARTUP_CHECK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_key: licenseKey,
            installation_id: installationId,
            product: 'LifeOS',
          }),
        });
        result = await response.json();
      }

      // Update local license info cache
      if (result.valid) {
        const info: LicenseInfo = {
          licenseKey,
          status: result.status as LicenseInfo['status'],
          maxDevices: result.max_devices || storedLicense?.maxDevices || 5,
          expiresAt: result.expires_at || null,
          lastVerified: new Date().toISOString(),
          installationId,
          plan: getPlanFromMaxDevices(result.max_devices || 5),
        };
        saveLicenseInfo(info);

        setState({
          checking: false,
          valid: true,
          status: result.status,
          message: result.message,
          warning: result.warning || null,
          graceRemainingDays: result.grace_remaining_days || null,
          licenseInfo: info,
        });
      } else {
        // Check if grace period applies
        const inGrace = result.status === 'grace_period' || (result.grace_remaining_days && result.grace_remaining_days > 0);

        setState({
          checking: false,
          valid: inGrace,
          status: result.status,
          message: result.message,
          warning: inGrace ? `License expired. Grace period: ${result.grace_remaining_days} days remaining.` : null,
          graceRemainingDays: result.grace_remaining_days || null,
          licenseInfo: storedLicense,
        });
      }
    } catch (err) {
      // Network failure: use cached license if verified within 30 days
      if (storedLicense && storedLicense.lastVerified) {
        const daysSinceVerified = (Date.now() - new Date(storedLicense.lastVerified).getTime()) / 86400000;
        if (daysSinceVerified < 30) {
          setState({
            checking: false,
            valid: true,
            status: 'offline_mode',
            message: 'Working in offline mode. License verification will retry later.',
            warning: daysSinceVerified > 9
              ? `⚠️ Offline for ${Math.floor(daysSinceVerified)} days. License verification required within ${Math.floor(30 - daysSinceVerified)} days.`
              : null,
            graceRemainingDays: null,
            licenseInfo: storedLicense,
          });
          return;
        }
      }

      setState({
        checking: false,
        valid: false,
        status: 'offline_expired',
        message: 'Unable to verify license. Please check your internet connection.',
        warning: null,
        graceRemainingDays: null,
        licenseInfo: storedLicense,
      });
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    checkLicense();
  }, [checkLicense]);

  // Periodic re-check
  useEffect(() => {
    const interval = setInterval(checkLicense, RECHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkLicense]);

  return (
    <LicenseContext.Provider value={{ ...state, recheckLicense: checkLicense }}>
      {children}
    </LicenseContext.Provider>
  );
}
