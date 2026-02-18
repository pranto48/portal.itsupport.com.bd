import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, CheckCircle, AlertTriangle, SkipForward, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ReconciliationResult {
  license_id: string;
  license_key: string;
  product_name: string;
  category: string;
  previous_status: string;
  new_status: string;
  message: string;
  changed: boolean;
}

interface ReconciliationSummary {
  total: number;
  verified: number;
  changed: number;
  skipped: number;
  errors: number;
}

const AdminReconciliation = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'changed' | 'skipped' | 'errors'>('all');

  const runReconciliation = async () => {
    setLoading(true);
    setSummary(null);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const res = await supabase.functions.invoke('reconcile-licenses', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;

      const body = res.data;
      if (!body.success) throw new Error(body.error || 'Reconciliation failed');

      setSummary(body.summary);
      setResults(body.results);
      toast.success(`Reconciliation complete — ${body.summary.total} licenses checked`);
    } catch (err: any) {
      toast.error(err.message || 'Reconciliation failed');
    } finally {
      setLoading(false);
    }
  };

  const filtered = results.filter(r => {
    if (filterType === 'all') return true;
    if (filterType === 'changed') return r.changed;
    if (filterType === 'skipped') return r.message.includes('Skipped');
    if (filterType === 'errors') return r.message.includes('error');
    return true;
  });

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">License Reconciliation</h1>

      <div className="admin-card p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-100 mb-1">Manual Sync</h2>
            <p className="text-gray-400 text-sm">
              Verify all licenses against the portal's license verification endpoint. This will check status, expiry, and installation binding for each license.
            </p>
          </div>
          <button
            onClick={runReconciliation}
            disabled={loading}
            className="btn-admin-primary flex items-center gap-2 px-6 py-3 text-base"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="admin-card p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{summary.verified}</p>
            <p className="text-gray-400 text-sm">Verified OK</p>
          </div>
          <div className="admin-card p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{summary.changed}</p>
            <p className="text-gray-400 text-sm">Status Changed</p>
          </div>
          <div className="admin-card p-4 text-center">
            <SkipForward className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{summary.skipped}</p>
            <p className="text-gray-400 text-sm">Skipped</p>
          </div>
          <div className="admin-card p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-100">{summary.errors}</p>
            <p className="text-gray-400 text-sm">Errors</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="admin-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-100">Results</h2>
            <select
              className="form-admin-input w-auto"
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
            >
              <option value="all">All ({results.length})</option>
              <option value="changed">Changed ({summary?.changed || 0})</option>
              <option value="skipped">Skipped ({summary?.skipped || 0})</option>
              <option value="errors">Errors ({summary?.errors || 0})</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-700 rounded-lg">
              <thead>
                <tr className="bg-gray-600 text-gray-200 uppercase text-sm">
                  <th className="py-3 px-4 text-left">License Key</th>
                  <th className="py-3 px-4 text-left">Product</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Result</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 text-sm">
                {filtered.map(r => (
                  <tr key={r.license_id} className="border-b border-gray-600 hover:bg-gray-600">
                    <td className="py-3 px-4 font-mono text-xs">{r.license_key}</td>
                    <td className="py-3 px-4">{r.product_name}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${r.category === 'LifeOS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : r.category === 'AMPNM' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {r.changed ? (
                        <span className="text-yellow-400">{r.previous_status} → {r.new_status}</span>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${r.new_status === 'active' || r.new_status === 'free' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {r.new_status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReconciliation;
