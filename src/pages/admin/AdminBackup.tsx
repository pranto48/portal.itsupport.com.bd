import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Download, Upload, Database, AlertTriangle, CheckCircle, Loader2, XCircle, Table2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const ALL_TABLES = [
  'products',
  'profiles',
  'user_roles',
  'licenses',
  'orders',
  'order_items',
  'support_tickets',
  'ticket_replies',
] as const;

type TableName = typeof ALL_TABLES[number];

interface TableRestoreStatus {
  status: 'pending' | 'deleting' | 'restoring' | 'done' | 'error' | 'skipped';
  count: number;
  error?: string;
}

const AdminBackup = () => {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restorePhase, setRestorePhase] = useState('');
  const [tableStatuses, setTableStatuses] = useState<Record<string, TableRestoreStatus>>({});
  const [showTableStatuses, setShowTableStatuses] = useState(false);

  // Selective restore state
  const [backupData, setBackupData] = useState<any>(null);
  const [selectedTables, setSelectedTables] = useState<Set<TableName>>(new Set());
  const [showSelectiveRestore, setShowSelectiveRestore] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const selectiveFileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
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

  const handleFullRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a .json backup file');
      return;
    }

    const confirmed = window.confirm(
      'WARNING: This will overwrite ALL existing data with the backup data. This action cannot be undone. Are you sure?'
    );
    if (!confirmed) {
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.tables) throw new Error('Invalid backup file: missing tables data');
      await executeRestore(backup.tables, ALL_TABLES as unknown as TableName[]);
    } catch (err: any) {
      toast.error(err.message || 'Restore failed');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSelectiveFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a .json backup file');
      if (selectiveFileRef.current) selectiveFileRef.current.value = '';
      return;
    }

    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.tables) throw new Error('Invalid backup file: missing tables data');

      setBackupData(backup);
      const availableTables = ALL_TABLES.filter(t => backup.tables[t] && backup.tables[t].length > 0);
      setSelectedTables(new Set(availableTables));
      setShowSelectiveRestore(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to read backup file');
    } finally {
      if (selectiveFileRef.current) selectiveFileRef.current.value = '';
    }
  };

  const executeRestore = async (tables: Record<string, any[]>, tablesToRestore: TableName[]) => {
    setImporting(true);
    setRestoreProgress(0);
    setRestorePhase('Preparing...');
    setShowTableStatuses(true);

    const initialStatuses: Record<string, TableRestoreStatus> = {};
    ALL_TABLES.forEach(t => {
      if (tablesToRestore.includes(t)) {
        initialStatuses[t] = { status: 'pending', count: tables[t]?.length || 0 };
      } else {
        initialStatuses[t] = { status: 'skipped', count: 0 };
      }
    });
    setTableStatuses(initialStatuses);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const totalSteps = tablesToRestore.length * 2; // delete + restore per table
      let completedSteps = 0;

      // Delete phase (reverse order)
      const deleteOrder = [...tablesToRestore].reverse();
      setRestorePhase('Clearing existing data...');

      for (const table of deleteOrder) {
        if (!tables[table]) continue;
        setTableStatuses(prev => ({ ...prev, [table]: { ...prev[table], status: 'deleting' } }));

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/db-backup?action=restore-table&table=${table}&phase=delete`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rows: [] }),
          }
        );

        if (!res.ok) {
          const err = await res.json();
          setTableStatuses(prev => ({
            ...prev,
            [table]: { ...prev[table], status: 'error', error: err.error || 'Delete failed' },
          }));
        }

        completedSteps++;
        setRestoreProgress(Math.round((completedSteps / totalSteps) * 100));
      }

      // Restore phase
      setRestorePhase('Restoring data...');

      for (const table of tablesToRestore) {
        const rows = tables[table];
        if (!rows || rows.length === 0) {
          setTableStatuses(prev => ({ ...prev, [table]: { status: 'done', count: 0 } }));
          completedSteps++;
          setRestoreProgress(Math.round((completedSteps / totalSteps) * 100));
          continue;
        }

        setTableStatuses(prev => ({ ...prev, [table]: { ...prev[table], status: 'restoring' } }));

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/db-backup?action=restore-table&table=${table}&phase=restore`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rows }),
          }
        );

        const result = await res.json();
        if (!res.ok || !result.success) {
          setTableStatuses(prev => ({
            ...prev,
            [table]: { status: 'error', count: rows.length, error: result.error || 'Restore failed' },
          }));
        } else {
          setTableStatuses(prev => ({
            ...prev,
            [table]: { status: 'done', count: rows.length },
          }));
        }

        completedSteps++;
        setRestoreProgress(Math.round((completedSteps / totalSteps) * 100));
      }

      setRestorePhase('Complete');
      setRestoreProgress(100);

      const hasErrors = Object.values(tableStatuses).some(s => s.status === 'error');
      if (hasErrors) {
        toast.warning('Restore completed with some errors');
      } else {
        toast.success('Database restored successfully');
      }
    } catch (err: any) {
      toast.error(err.message || 'Restore failed');
      setRestorePhase('Failed');
    } finally {
      setImporting(false);
    }
  };

  const handleSelectiveRestore = async () => {
    if (!backupData || selectedTables.size === 0) return;

    const tableList = Array.from(selectedTables).join(', ');
    const confirmed = window.confirm(
      `WARNING: This will overwrite data in: ${tableList}. This action cannot be undone. Are you sure?`
    );
    if (!confirmed) return;

    await executeRestore(backupData.tables, Array.from(selectedTables));
    setShowSelectiveRestore(false);
    setBackupData(null);
  };

  const toggleTable = (table: TableName) => {
    setSelectedTables(prev => {
      const next = new Set(prev);
      if (next.has(table)) next.delete(table);
      else next.add(table);
      return next;
    });
  };

  const getStatusIcon = (status: TableRestoreStatus['status']) => {
    switch (status) {
      case 'pending': return <div className="w-3 h-3 rounded-full bg-gray-500" />;
      case 'deleting': return <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />;
      case 'restoring': return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case 'done': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'skipped': return <div className="w-3 h-3 rounded-full bg-gray-700" />;
    }
  };

  const getStatusLabel = (status: TableRestoreStatus['status']) => {
    switch (status) {
      case 'pending': return 'Waiting';
      case 'deleting': return 'Clearing...';
      case 'restoring': return 'Restoring...';
      case 'done': return 'Done';
      case 'error': return 'Failed';
      case 'skipped': return 'Skipped';
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
            Download a complete backup of all portal data as a JSON file.
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

        {/* Full Restore Card */}
        <div className="admin-card p-6">
          <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-400" />
            Full Restore
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Restore all tables from a backup file. Overwrites all existing data.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-yellow-300 text-xs">Destructive operation. Export a backup first.</span>
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
              onChange={handleFullRestore}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {/* Selective Restore Card */}
      <div className="admin-card p-6 mt-6">
        <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <Table2 className="w-5 h-5 text-purple-400" />
          Selective Table Restore
        </h2>
        <p className="text-gray-400 text-sm mb-4">
          Choose specific tables to restore from a backup file. Only selected tables will be overwritten.
        </p>

        {!showSelectiveRestore ? (
          <label className={`btn-glass-secondary w-full py-3 flex items-center justify-center gap-2 cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
            <Table2 className="w-4 h-4" /> Load Backup for Selection
            <input
              ref={selectiveFileRef}
              type="file"
              accept=".json"
              onChange={handleSelectiveFileLoad}
              className="hidden"
              disabled={importing}
            />
          </label>
        ) : (
          <div className="space-y-4">
            {backupData?.created_at && (
              <div className="text-xs text-gray-500">
                Backup from: {new Date(backupData.created_at).toLocaleString()}
                {backupData.created_by && ` by ${backupData.created_by}`}
              </div>
            )}

            <div className="flex gap-2 mb-2">
              <button
                onClick={() => {
                  const available = ALL_TABLES.filter(t => backupData?.tables[t]?.length > 0);
                  setSelectedTables(new Set(available));
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Select All
              </button>
              <span className="text-gray-600">|</span>
              <button
                onClick={() => setSelectedTables(new Set())}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Deselect All
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_TABLES.map(table => {
                const rows = backupData?.tables[table]?.length || 0;
                const available = rows > 0;
                return (
                  <label
                    key={table}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedTables.has(table)
                        ? 'border-blue-500/40 bg-blue-500/10'
                        : 'border-gray-700 bg-gray-800/50'
                    } ${!available ? 'opacity-40 pointer-events-none' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTables.has(table)}
                      onChange={() => toggleTable(table)}
                      disabled={!available}
                      className="accent-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white font-mono">{table}</span>
                      <span className="text-xs text-gray-500 ml-2">({rows} rows)</span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSelectiveRestore}
                disabled={importing || selectedTables.size === 0}
                className="btn-glass-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Restore {selectedTables.size} Table{selectedTables.size !== 1 ? 's' : ''}
              </button>
              <button
                onClick={() => { setShowSelectiveRestore(false); setBackupData(null); }}
                className="btn-glass-secondary px-4 py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Restore Progress */}
      {(importing || restorePhase === 'Complete' || restorePhase === 'Failed') && (
        <div className="admin-card p-6 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Restore Progress</h3>
            <span className="text-sm text-gray-400">{restorePhase}</span>
          </div>

          <Progress value={restoreProgress} className="h-3 mb-4" />

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500">{restoreProgress}% complete</span>
            <button
              onClick={() => setShowTableStatuses(!showTableStatuses)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              {showTableStatuses ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showTableStatuses ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {showTableStatuses && (
            <div className="space-y-1.5">
              {ALL_TABLES.map(table => {
                const ts = tableStatuses[table];
                if (!ts) return null;
                return (
                  <div
                    key={table}
                    className={`flex items-center justify-between py-2 px-3 rounded transition-colors ${
                      ts.status === 'error' ? 'bg-red-500/10 border border-red-500/20' :
                      ts.status === 'done' ? 'bg-green-500/5' :
                      ts.status === 'skipped' ? 'bg-gray-800/30' :
                      'bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ts.status)}
                      <span className={`font-mono text-sm ${ts.status === 'skipped' ? 'text-gray-600' : 'text-gray-300'}`}>
                        {table}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {ts.count > 0 && (
                        <span className="text-gray-500 text-xs">{ts.count} rows</span>
                      )}
                      <span className={`text-xs ${
                        ts.status === 'error' ? 'text-red-400' :
                        ts.status === 'done' ? 'text-green-400' :
                        ts.status === 'skipped' ? 'text-gray-600' :
                        'text-gray-400'
                      }`}>
                        {getStatusLabel(ts.status)}
                      </span>
                    </div>
                    {ts.error && (
                      <div className="w-full mt-1 text-xs text-red-400 truncate" title={ts.error}>
                        {ts.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBackup;
