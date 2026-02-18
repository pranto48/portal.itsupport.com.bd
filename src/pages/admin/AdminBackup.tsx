import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Download, Upload, Database, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminBackup = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [restoreResult, setRestoreResult] = useState<Record<string, { success: boolean; count: number; error?: string }> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('db-backup', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
      });

      // Use fetch directly for GET with query params
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/db-backup?action=export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Export failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portal_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a .json backup file');
      return;
    }

    const confirmed = window.confirm(
      'WARNING: This will overwrite existing data with the backup data. This action cannot be undone. Are you sure?'
    );
    if (!confirmed) {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setImporting(true);
    setRestoreResult(null);

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.tables) {
        throw new Error('Invalid backup file: missing tables data');
      }

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/db-backup?action=restore`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(backup),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Restore failed');

      setRestoreResult(result.results);
      toast.success('Database restored successfully');
    } catch (err: any) {
      toast.error(err.message || 'Restore failed');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="page-content max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center flex items-center justify-center gap-3">
        <Database className="w-8 h-8" />
        Database Backup
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <div className="admin-card p-6">
          <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <Download className="w-5 h-5 text-green-400" />
            Export Backup
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Download a complete backup of all portal data as a JSON file. Includes products, licenses, orders, users, and tickets.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-glass-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {exporting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Exporting...</>
            ) : (
              <><Download className="w-4 h-4" /> Download Backup</>
            )}
          </button>
        </div>

        {/* Import Card */}
        <div className="admin-card p-6">
          <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-400" />
            Restore Backup
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Restore data from a previously downloaded backup file. This will overwrite existing data.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-yellow-300 text-xs">This is a destructive operation. Make sure to export a backup first.</span>
          </div>
          <label className={`btn-glass-secondary w-full py-3 flex items-center justify-center gap-2 cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
            {importing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Restoring...</>
            ) : (
              <><Upload className="w-4 h-4" /> Select Backup File</>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {/* Restore Results */}
      {restoreResult && (
        <div className="admin-card p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Restore Results</h3>
          <div className="space-y-2">
            {Object.entries(restoreResult).map(([table, result]) => (
              <div key={table} className="flex items-center justify-between py-2 px-3 rounded bg-gray-700/50">
                <span className="text-gray-300 font-mono text-sm">{table}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">{result.count} rows</span>
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <span className="text-red-400 text-xs">{result.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBackup;
