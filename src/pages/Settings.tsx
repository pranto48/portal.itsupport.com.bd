import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Key, Shield, ShieldCheck, ShieldOff, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // 2FA
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [tfaLoading, setTfaLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [qrUri, setQrUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);

  useEffect(() => {
    checkTfaStatus();
  }, []);

  const checkTfaStatus = async () => {
    setTfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verified = data.totp?.find(f => f.status === 'verified');
      setTfaEnabled(!!verified);
      if (verified) setFactorId(verified.id);
    } catch {
      // ignore
    } finally {
      setTfaLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('Password changed!'); setNewPassword(''); setConfirmPassword(''); }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator App' });
      if (error) throw error;
      setQrUri(data.totp.uri);
      setTotpSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to start 2FA setup');
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const verify = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: verifyCode });
      if (verify.error) throw verify.error;
      toast.success('2FA enabled successfully!');
      setQrUri('');
      setTotpSecret('');
      setVerifyCode('');
      setTfaEnabled(true);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleUnenroll = async () => {
    if (!confirm('Are you sure you want to disable 2FA?')) return;
    setUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success('2FA disabled');
      setTfaEnabled(false);
      setFactorId('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disable 2FA');
    } finally {
      setUnenrolling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    toast.success('Secret copied to clipboard');
  };

  return (
    <div className="page-content max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-foreground mb-8 text-center">Account Settings</h1>

      {/* Password Section */}
      <div className="glass-card p-8 mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" /> Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-muted-foreground text-sm font-bold mb-2">New Password:</label>
            <input type="password" required className="form-glass-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-muted-foreground text-sm font-bold mb-2">Confirm New Password:</label>
            <input type="password" required className="form-glass-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-glass-primary w-full">
            <Key className="w-4 h-4 mr-2" />{pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* 2FA Section */}
      <div className="glass-card p-8">
        <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" /> Two-Factor Authentication
        </h2>

        {tfaLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking 2FA status...
          </div>
        ) : tfaEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="font-semibold text-foreground">2FA is enabled</p>
                <p className="text-sm text-muted-foreground">Your account is protected with an authenticator app.</p>
              </div>
            </div>
            <button onClick={handleUnenroll} disabled={unenrolling} className="btn-glass-danger w-full">
              <ShieldOff className="w-4 h-4 mr-2" />{unenrolling ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        ) : qrUri ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):
            </p>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`}
                alt="2FA QR Code"
                className="w-48 h-48"
              />
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-grow p-2 bg-secondary rounded text-xs text-foreground font-mono break-all">{totpSecret}</code>
              <button onClick={copySecret} className="p-2 hover:bg-secondary rounded" title="Copy secret">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handleVerifyEnroll} className="space-y-3">
              <div>
                <label className="block text-muted-foreground text-sm font-bold mb-2">Enter the 6-digit code from your app:</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="000000"
                  className="form-glass-input text-center tracking-[0.5em] text-lg font-mono"
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <button type="submit" disabled={verifying || verifyCode.length !== 6} className="btn-glass-primary w-full">
                <ShieldCheck className="w-4 h-4 mr-2" />{verifying ? 'Verifying...' : 'Verify & Enable 2FA'}
              </button>
              <button type="button" onClick={() => { setQrUri(''); setTotpSecret(''); setVerifyCode(''); }} className="btn-glass-secondary w-full text-sm">
                Cancel
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Add an extra layer of security to your account by enabling two-factor authentication with an authenticator app.
            </p>
            <button onClick={handleEnroll} disabled={enrolling} className="btn-glass-primary w-full">
              <Shield className="w-4 h-4 mr-2" />{enrolling ? 'Setting up...' : 'Enable 2FA'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
