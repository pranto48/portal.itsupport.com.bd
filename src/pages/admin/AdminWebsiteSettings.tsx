import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Settings, Globe, Key, ShieldCheck, Save, Loader2, Image, Type, FileText } from 'lucide-react';

const AdminWebsiteSettings = () => {
  return (
    <div className="page-content max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center flex items-center justify-center gap-3">
        <Settings className="w-8 h-8" /> Website Settings
      </h1>
      <div className="space-y-8">
        <SiteConfigSection />
        <LicenseEndpointSection />
        <PasswordChangeSection />
        <TwoFactorSection />
      </div>
    </div>
  );
};

/* ───────── Site Configuration ───────── */
const SiteConfigSection = () => {
  const [siteTitle, setSiteTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('app_settings').select('key, value').in('key', [
        'site_title', 'site_meta_description', 'site_favicon_url'
      ]);
      if (data) {
        data.forEach((r) => {
          if (r.key === 'site_title') setSiteTitle(r.value);
          if (r.key === 'site_meta_description') setMetaDesc(r.value);
          if (r.key === 'site_favicon_url') setFaviconUrl(r.value);
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const updates = [
      { key: 'site_title', value: siteTitle },
      { key: 'site_meta_description', value: metaDesc },
      { key: 'site_favicon_url', value: faviconUrl },
    ];
    let hasError = false;
    for (const u of updates) {
      const { error } = await supabase.from('app_settings').update({ value: u.value, updated_at: new Date().toISOString() }).eq('key', u.key);
      if (error) hasError = true;
    }
    setSaving(false);
    if (hasError) toast.error('Failed to save some settings. Admin access required.');
    else {
      toast.success('Website settings saved!');
      // Apply to document immediately
      document.title = siteTitle;
      const metaTag = document.querySelector('meta[name="description"]');
      if (metaTag) metaTag.setAttribute('content', metaDesc);
      const faviconTag = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (faviconTag) faviconTag.href = faviconUrl;
    }
  };

  if (loading) return <SettingsCard title="Site Configuration" icon={Globe}><Loader2 className="w-5 h-5 animate-spin mx-auto" /></SettingsCard>;

  return (
    <SettingsCard title="Site Configuration" icon={Globe}>
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-1">
            <Type className="w-4 h-4" /> Site Title
          </label>
          <input className="form-glass-input" value={siteTitle} onChange={e => setSiteTitle(e.target.value)} placeholder="My Website" />
          <p className="text-xs text-gray-400 mt-1">Displayed in the browser tab</p>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-1">
            <FileText className="w-4 h-4" /> Meta Description
          </label>
          <textarea className="form-glass-input min-h-[80px]" value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="Site description for SEO..." />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-1">
            <Image className="w-4 h-4" /> Favicon URL
          </label>
          <input className="form-glass-input" value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} placeholder="https://example.com/favicon.ico" />
          {faviconUrl && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-400">Preview:</span>
              <img src={faviconUrl} alt="favicon" className="w-6 h-6 rounded" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
        </div>
        <button onClick={save} disabled={saving} className="btn-admin-primary flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </SettingsCard>
  );
};

/* ───────── License Endpoint ───────── */
const LicenseEndpointSection = () => {
  const [endpointUrl, setEndpointUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const defaultUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-license`;

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'license_endpoint_url').maybeSingle();
      setEndpointUrl(data?.value || defaultUrl);
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    if (!endpointUrl.trim()) { toast.error('URL cannot be empty'); return; }
    setSaving(true);
    const { error } = await supabase.from('app_settings').update({ value: endpointUrl.trim(), updated_at: new Date().toISOString() }).eq('key', 'license_endpoint_url');
    setSaving(false);
    if (error) toast.error('Failed to save. Admin access required.');
    else toast.success('License endpoint updated!');
  };

  if (loading) return <SettingsCard title="Docker License Verification" icon={Globe}><Loader2 className="w-5 h-5 animate-spin mx-auto" /></SettingsCard>;

  return (
    <SettingsCard title="Docker License Verification Endpoint" icon={Globe}>
      <div className="space-y-3">
        <p className="text-sm text-gray-400">
          This URL is used by Docker AMPNM apps for license verification. Update it when migrating backends.
        </p>
        <input className="form-glass-input" value={endpointUrl} onChange={e => setEndpointUrl(e.target.value)} placeholder={defaultUrl} />
        <button onClick={save} disabled={saving} className="btn-admin-primary flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Endpoint'}
        </button>
      </div>
    </SettingsCard>
  );
};

/* ───────── Password Change ───────── */
const PasswordChangeSection = () => {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('Password changed successfully!'); setNewPassword(''); setConfirmPassword(''); }
  };

  return (
    <SettingsCard title="Change Password" icon={Key}>
      <p className="text-sm text-gray-400 mb-3">Change password for: <strong className="text-gray-200">{user?.email}</strong></p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">New Password</label>
          <input type="password" required className="form-glass-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">Confirm Password</label>
          <input type="password" required className="form-glass-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} />
        </div>
        <button type="submit" disabled={loading} className="btn-admin-primary flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </SettingsCard>
  );
};

/* ───────── Two-Factor Authentication ───────── */
const TwoFactorSection = () => {
  const [factors, setFactors] = useState<any[]>([]);
  const [qrUri, setQrUri] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFactors(); }, []);

  const loadFactors = async () => {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    if (data) setFactors(data.totp || []);
    setLoading(false);
  };

  const startEnroll = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator App' });
    if (error) { toast.error(error.message); setEnrolling(false); return; }
    if (data) {
      setQrUri(data.totp.uri);
      setFactorId(data.id);
    }
  };

  const verifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode.length !== 6) { toast.error('Enter a 6-digit code'); return; }
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) { toast.error(challenge.error.message); return; }
    const verify = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: verifyCode });
    if (verify.error) { toast.error(verify.error.message); return; }
    toast.success('2FA enabled successfully!');
    setQrUri(''); setFactorId(''); setVerifyCode(''); setEnrolling(false);
    loadFactors();
  };

  const unenroll = async (id: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    if (error) toast.error(error.message);
    else { toast.success('2FA factor removed'); loadFactors(); }
  };

  if (loading) return <SettingsCard title="Two-Factor Authentication" icon={ShieldCheck}><Loader2 className="w-5 h-5 animate-spin mx-auto" /></SettingsCard>;

  const verifiedFactors = factors.filter(f => f.status === 'verified');

  return (
    <SettingsCard title="Two-Factor Authentication (2FA)" icon={ShieldCheck}>
      {verifiedFactors.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <ShieldCheck className="w-4 h-4" /> 2FA is enabled
          </div>
          {verifiedFactors.map(f => (
            <div key={f.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
              <span className="text-sm text-gray-200">{f.friendly_name || 'Authenticator'}</span>
              <button onClick={() => unenroll(f.id)} className="text-xs text-red-400 hover:text-red-300 transition">Remove</button>
            </div>
          ))}
        </div>
      ) : enrolling && qrUri ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
          <div className="flex justify-center">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUri)}`} alt="2FA QR Code" className="rounded-lg border border-white/10" />
          </div>
          <form onSubmit={verifyEnroll} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Enter 6-digit code from app</label>
              <input className="form-glass-input text-center tracking-widest text-lg" value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-admin-primary flex-1">Verify & Enable</button>
              <button type="button" onClick={() => { setEnrolling(false); setQrUri(''); }} className="btn-glass-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">Add an extra layer of security to your account by enabling two-factor authentication.</p>
          <button onClick={startEnroll} className="btn-admin-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Enable 2FA
          </button>
        </div>
      )}
    </SettingsCard>
  );
};

/* ───────── Shared Card Wrapper ───────── */
const SettingsCard = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="admin-card p-6">
    <h2 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
      <Icon className="w-5 h-5" /> {title}
    </h2>
    {children}
  </div>
);

export default AdminWebsiteSettings;
