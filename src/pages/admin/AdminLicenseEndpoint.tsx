import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Globe, Server, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ENDPOINT_URL = `${SUPABASE_URL}/functions/v1/verify-license`;

const AdminLicenseEndpoint = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyUrl = async () => {
    await navigator.clipboard.writeText(ENDPOINT_URL);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Endpoint URL copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">License Verification Endpoint</h1>
        <p className="text-muted-foreground">Manage and share the license verification URL used by Docker AMPNM and other apps.</p>

        {/* Current Endpoint */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-accent" />Current Endpoint URL</CardTitle>
            <CardDescription>This is the active license verification endpoint. Use this URL in your Docker app's config.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-4 border">
              <code className="text-sm text-foreground break-all flex-1">{ENDPOINT_URL}</code>
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
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
define('LICENSE_API_URL', '${ENDPOINT_URL}');`}
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
              <li>Update <code className="text-foreground">LICENSE_API_URL</code> in all Docker clients to the new endpoint</li>
            </ol>

            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-foreground">Recommended: Stable URL via Reverse Proxy</h3>
              <p className="text-sm text-muted-foreground">
                To make <code className="text-foreground">https://portal.itsupport.com.bd/verify_license</code> always work regardless of backend changes, set up a reverse proxy on your web server:
              </p>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Nginx Configuration</h4>
                <pre className="bg-muted/50 rounded-lg p-4 border text-sm overflow-x-auto">
{`location /verify_license {
    proxy_pass ${ENDPOINT_URL};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Content-Type "application/x-www-form-urlencoded";
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Apache Configuration</h4>
                <pre className="bg-muted/50 rounded-lg p-4 border text-sm overflow-x-auto">
{`<Location /verify_license>
    ProxyPass "${ENDPOINT_URL}"
    ProxyPassReverse "${ENDPOINT_URL}"
    RequestHeader set Content-Type "application/x-www-form-urlencoded"
</Location>`}
                </pre>
              </div>

              <p className="text-sm text-muted-foreground">
                With this setup, Docker clients use <code className="text-foreground">https://portal.itsupport.com.bd/verify_license</code> and you only update the proxy config when migrating — no client changes needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLicenseEndpoint;
