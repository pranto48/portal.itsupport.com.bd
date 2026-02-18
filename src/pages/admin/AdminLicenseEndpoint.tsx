import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Globe, Server, AlertTriangle, Save, Shield, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-license`;

const AdminLicenseEndpoint = () => {
  const [copied, setCopied] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchEndpointUrl();
    fetchRecentLogs();
  }, []);

  const fetchEndpointUrl = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings' as any)
      .select('value')
      .eq('key', 'license_endpoint_url')
      .maybeSingle();

    if (!error && data) {
      const url = (data as any).value || DEFAULT_ENDPOINT;
      setEndpointUrl(url);
      setEditUrl(url);
    } else {
      setEndpointUrl(DEFAULT_ENDPOINT);
      setEditUrl(DEFAULT_ENDPOINT);
    }
    setLoading(false);
  };

  const fetchRecentLogs = async () => {
    const { data } = await supabase
      .from('license_verification_log' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setRecentLogs(data as any[]);
  };

  const saveEndpointUrl = async () => {
    if (!editUrl.trim()) {
      toast({ title: 'Error', description: 'Endpoint URL cannot be empty.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('app_settings' as any)
      .update({ value: editUrl.trim(), updated_at: new Date().toISOString() } as any)
      .eq('key', 'license_endpoint_url');

    if (error) {
      toast({ title: 'Error', description: 'Failed to save. Only admins can change this.', variant: 'destructive' });
    } else {
      setEndpointUrl(editUrl.trim());
      toast({ title: 'Saved!', description: 'License endpoint URL updated successfully.' });
    }
    setSaving(false);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(endpointUrl);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Endpoint URL copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const displayUrl = endpointUrl || DEFAULT_ENDPOINT;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">License Verification Endpoint</h1>
        <p className="text-muted-foreground">Manage the license verification URL. Only admins can change this setting.</p>

        {/* Current Endpoint with Edit */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-accent" />Active Endpoint URL</CardTitle>
            <CardDescription>This URL is used by Docker AMPNM and other apps for license verification. Only admins can modify it.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-4 border">
              <code className="text-sm text-foreground break-all flex-1">{displayUrl}</code>
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Change Endpoint URL (Admin Only)</label>
              <div className="flex gap-2">
                <Input
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://your-backend.com/functions/v1/verify-license"
                  className="flex-1"
                  disabled={loading}
                />
                <Button onClick={saveEndpointUrl} disabled={saving || loading}>
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">When you migrate backends, update this URL so it always reflects the current active endpoint.</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-accent" />Security Features</CardTitle>
            <CardDescription>Anti-cracking and anti-hacking protections active on the license verification endpoint.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span><strong className="text-foreground">AES-256-CBC Encryption</strong> — All responses are encrypted. License keys never appear in plain text in transit.</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span><strong className="text-foreground">Hardware Binding</strong> — Each license is bound to a unique installation ID. Cannot be reused on another server.</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span><strong className="text-foreground">Rate Limiting</strong> — Max 10 failed attempts per IP within 15 minutes. Blocks brute-force attacks.</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span><strong className="text-foreground">Audit Logging</strong> — Every verification attempt is logged with hashed key, IP, result, and timestamp.</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span><strong className="text-foreground">Generic Error Messages</strong> — Failed verifications return identical messages to prevent information leakage.</span></li>
              <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><span><strong className="text-foreground">Input Validation</strong> — All inputs are length-limited and sanitized to prevent injection attacks.</span></li>
            </ul>
          </CardContent>
        </Card>

        {/* Recent Verification Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-accent" />Recent Verification Logs</CardTitle>
            <CardDescription>Last 20 license verification attempts for security monitoring.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No verification logs yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4 text-foreground">Time</th>
                      <th className="py-2 pr-4 text-foreground">Result</th>
                      <th className="py-2 pr-4 text-foreground">Reason</th>
                      <th className="py-2 pr-4 text-foreground">IP</th>
                      <th className="py-2 text-foreground">Key Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log: any) => (
                      <tr key={log.id} className="border-b border-muted">
                        <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${log.result === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'}`}>
                            {log.result}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">{log.reason}</td>
                        <td className="py-2 pr-4 text-muted-foreground font-mono text-xs">{log.ip_address}</td>
                        <td className="py-2 text-muted-foreground font-mono text-xs">{log.license_key_hash?.slice(0, 12)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Docker Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Server className="w-5 h-5 text-accent" />Docker AMPNM Configuration</CardTitle>
            <CardDescription>How to configure your Docker app to use this endpoint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Update config.php</h3>
              <pre className="bg-muted/50 rounded-lg p-4 border text-sm overflow-x-auto">
{`// In your Docker AMPNM config.php:
define('LICENSE_API_URL', '${displayUrl}');`}
              </pre>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Steps</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Open your Docker app's <code className="text-foreground">config.php</code> file</li>
                <li>Set <code className="text-foreground">LICENSE_API_URL</code> to the endpoint URL above</li>
                <li>Restart your Docker container</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Migration Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />Backend Migration Guide</CardTitle>
            <CardDescription>If you migrate to a new backend, follow these steps to avoid client disruption.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Export your database backup from <strong className="text-foreground">Admin → Backup</strong></li>
              <li>Set up the new backend and import the backup</li>
              <li>Deploy the <code className="text-foreground">verify-license</code> backend function</li>
              <li>Update the endpoint URL above to the new backend URL</li>
              <li>If using reverse proxy, update proxy config to point to new backend</li>
            </ol>

            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-foreground">Recommended: Stable URL via Reverse Proxy</h3>
              <p className="text-sm text-muted-foreground">
                Set up a reverse proxy so Docker clients always use <code className="text-foreground">https://portal.itsupport.com.bd/verify_license</code>:
              </p>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Nginx</h4>
                <pre className="bg-muted/50 rounded-lg p-4 border text-sm overflow-x-auto">
{`location /verify_license {
    proxy_pass ${displayUrl};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Content-Type "application/x-www-form-urlencoded";
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Apache</h4>
                <pre className="bg-muted/50 rounded-lg p-4 border text-sm overflow-x-auto">
{`<Location /verify_license>
    ProxyPass "${displayUrl}"
    ProxyPassReverse "${displayUrl}"
    RequestHeader set Content-Type "application/x-www-form-urlencoded"
</Location>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLicenseEndpoint;
