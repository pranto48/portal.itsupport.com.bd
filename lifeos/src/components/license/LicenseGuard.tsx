import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicense } from '@/contexts/LicenseContext';
import { Shield, AlertTriangle, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface LicenseGuardProps {
  children: ReactNode;
}

/**
 * LicenseGuard wraps protected routes.
 * - If license is valid → render children (with optional warning banner)
 * - If checking → show loading
 * - If invalid → show enforcement screen
 * - If unconfigured → redirect to setup
 */
export function LicenseGuard({ children }: LicenseGuardProps) {
  const { checking, valid, status, message, warning, graceRemainingDays, recheckLicense } = useLicense();
  const navigate = useNavigate();

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying license...</p>
        </div>
      </div>
    );
  }

  if (status === 'unconfigured') {
    navigate('/setup');
    return null;
  }

  if (!valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            {status === 'offline_expired' ? (
              <WifiOff className="w-8 h-8 text-destructive" />
            ) : (
              <Shield className="w-8 h-8 text-destructive" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {status === 'expired' ? 'License Expired' :
               status === 'revoked' ? 'License Revoked' :
               status === 'bound_elsewhere' ? 'License In Use' :
               status === 'product_mismatch' ? 'Invalid License' :
               status === 'offline_expired' ? 'Verification Required' :
               'License Invalid'}
            </h1>
            <p className="text-muted-foreground">{message}</p>
          </div>

          {status === 'expired' && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Renew your license at <a href="https://portal.itsupport.com.bd" target="_blank" rel="noopener noreferrer" className="underline font-medium">portal.itsupport.com.bd</a>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button onClick={recheckLicense} variant="default" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Re-check License
            </Button>
            <Button onClick={() => navigate('/setup')} variant="outline" className="w-full">
              Enter New License Key
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Grace period or expiry warning banner */}
      {warning && (
        <div className="sticky top-0 z-50 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {warning}
          {graceRemainingDays !== null && graceRemainingDays <= 3 && (
            <a href="https://portal.itsupport.com.bd" target="_blank" rel="noopener noreferrer" className="underline font-medium ml-2">
              Renew Now
            </a>
          )}
        </div>
      )}
      {children}
    </>
  );
}
