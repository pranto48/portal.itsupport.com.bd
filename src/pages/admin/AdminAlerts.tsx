import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Bell, BellOff, Check, RefreshCw, Shield, X } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface AdminAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  license_id: string | null;
  product_category: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'expiry_warning' | 'inactivity'>('unread');

  const fetchAlerts = async () => {
    setLoading(true);
    let query = supabase
      .from('admin_alerts')
      .select('*')
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter === 'unread') query = query.eq('is_read', false);
    if (filter === 'expiry_warning') query = query.eq('alert_type', 'expiry_warning');
    if (filter === 'inactivity') query = query.eq('alert_type', 'inactivity');

    const { data, error } = await query;
    if (error) toast.error(error.message);
    setAlerts((data as AdminAlert[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); }, [filter]);

  const markRead = async (id: string) => {
    await supabase.from('admin_alerts').update({ is_read: true }).eq('id', id);
    setAlerts(a => a.map(al => al.id === id ? { ...al, is_read: true } : al));
  };

  const dismiss = async (id: string) => {
    await supabase.from('admin_alerts').update({ is_dismissed: true }).eq('id', id);
    setAlerts(a => a.filter(al => al.id !== id));
    toast.success('Alert dismissed');
  };

  const dismissAll = async () => {
    if (!confirm('Dismiss all visible alerts?')) return;
    const ids = alerts.map(a => a.id);
    await supabase.from('admin_alerts').update({ is_dismissed: true }).in('id', ids);
    setAlerts([]);
    toast.success('All alerts dismissed');
  };

  const markAllRead = async () => {
    const ids = alerts.filter(a => !a.is_read).map(a => a.id);
    if (!ids.length) return;
    await supabase.from('admin_alerts').update({ is_read: true }).in('id', ids);
    setAlerts(a => a.map(al => ({ ...al, is_read: true })));
    toast.success('All marked as read');
  };

  const runCheck = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('license-alerts');
      if (error) throw error;
      toast.success(`Check complete: ${data?.summary?.expiry_alerts || 0} expiry, ${data?.summary?.inactivity_alerts || 0} inactivity alerts created`);
      fetchAlerts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to run check');
    } finally {
      setRunning(false);
    }
  };

  const severityStyles: Record<string, string> = {
    critical: 'border-l-4 border-l-red-500 bg-red-500/5',
    warning: 'border-l-4 border-l-amber-500 bg-amber-500/5',
    info: 'border-l-4 border-l-blue-500 bg-blue-500/5',
  };

  const severityIcon = (s: string) => {
    if (s === 'critical') return <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />;
    if (s === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    return <Bell className="w-5 h-5 text-blue-400 shrink-0" />;
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="page-content max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-400 flex items-center gap-2">
          <Shield className="w-7 h-7" /> License Alerts
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </h1>
        <div className="flex gap-2">
          <button onClick={runCheck} disabled={running} className="btn-admin-primary text-sm flex items-center gap-1">
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? 'Checking...' : 'Run Check Now'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['unread', 'all', 'expiry_warning', 'inactivity'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            }`}>
            {f === 'unread' ? 'Unread' : f === 'all' ? 'All Active' : f === 'expiry_warning' ? 'Expiry Warnings' : 'Inactivity'}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={markAllRead} className="text-gray-400 hover:text-blue-400 text-sm flex items-center gap-1">
            <Check className="w-3 h-3" /> Mark all read
          </button>
          <button onClick={dismissAll} className="text-gray-400 hover:text-red-400 text-sm flex items-center gap-1">
            <BellOff className="w-3 h-3" /> Dismiss all
          </button>
        </div>
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="admin-card p-12 text-center">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">No alerts to show</p>
          <p className="text-gray-500 text-sm mt-1">Run a check to scan for expiring or inactive licenses.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`admin-card p-4 ${severityStyles[alert.severity] || ''} ${!alert.is_read ? 'ring-1 ring-blue-500/20' : 'opacity-75'}`}>
              <div className="flex items-start gap-3">
                {severityIcon(alert.severity)}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${!alert.is_read ? 'text-gray-100' : 'text-gray-300'}`}>{alert.title}</h3>
                    {alert.product_category && (
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                        alert.product_category === 'AMPNM' ? 'bg-blue-500/20 text-blue-300' :
                        alert.product_category === 'LifeOS' ? 'bg-emerald-500/20 text-emerald-300' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>{alert.product_category}</span>
                    )}
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                      alert.alert_type === 'expiry_warning' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                    }`}>{alert.alert_type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-sm text-gray-400">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(alert.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!alert.is_read && (
                    <button onClick={() => markRead(alert.id)} className="text-gray-400 hover:text-blue-400 p-1" title="Mark as read">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => dismiss(alert.id)} className="text-gray-400 hover:text-red-400 p-1" title="Dismiss">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;
