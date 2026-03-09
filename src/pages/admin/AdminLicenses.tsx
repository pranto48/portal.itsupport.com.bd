import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Unlink, X, Link2, Shield, Monitor, Leaf, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type ProductTab = 'all' | 'AMPNM' | 'LifeOS';

const AdminLicenses = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<ProductTab>('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editModal, setEditModal] = useState<any>(null);
  const [bindingId, setBindingId] = useState<string | null>(null);
  const [bindingValue, setBindingValue] = useState('');
  const [genForm, setGenForm] = useState({ customer_id: '', product_id: '', status: 'active' });
  const [bulkValidating, setBulkValidating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, changed: 0 });

  const fetchAll = async () => {
    const { data: l } = await supabase.from('licenses').select('*, products(name, category)');
    const { data: p } = await supabase.from('profiles').select('user_id, email').order('email');
    setProfiles(p || []);
    const profileMap = (p || []).reduce((acc: Record<string, string>, prof: any) => {
      acc[prof.user_id] = prof.email;
      return acc;
    }, {});
    setLicenses((l || []).map((lic: any) => ({ ...lic, customer_email: profileMap[lic.customer_id] || 'N/A' })));
    const { data: pr } = await supabase.from('products').select('id, name, category');
    setProducts(pr || []);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = licenses.length;
    const active = licenses.filter(l => l.status === 'active' || l.status === 'free').length;
    const expired = licenses.filter(l => l.status === 'expired').length;
    const revoked = licenses.filter(l => l.status === 'revoked').length;
    const ampnm = licenses.filter(l => (l.products as any)?.category === 'AMPNM');
    const lifeos = licenses.filter(l => (l.products as any)?.category === 'LifeOS');
    const ampnmActive = ampnm.filter(l => l.status === 'active' || l.status === 'free').length;
    const lifeosActive = lifeos.filter(l => l.status === 'active' || l.status === 'free').length;
    const bound = licenses.filter(l => l.bound_installation_id).length;

    // Expiring soon (within 7 days)
    const now = Date.now();
    const expiringSoon = licenses.filter(l => {
      if (!l.expires_at || l.status === 'expired' || l.status === 'revoked') return false;
      const daysLeft = (new Date(l.expires_at).getTime() - now) / 86400000;
      return daysLeft > 0 && daysLeft <= 7;
    }).length;

    return { total, active, expired, revoked, ampnm: ampnm.length, lifeos: lifeos.length, ampnmActive, lifeosActive, bound, expiringSoon };
  }, [licenses]);

  // ── Key generation with product prefix ──
  const generateKey = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const prefix = product?.category === 'LifeOS' ? 'LIFEOS' : product?.category === 'AMPNM' ? 'AMPNM' : 'KEY';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = Array.from({ length: 4 }, () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
    return `${prefix}-${segments.join('-')}`;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === genForm.product_id);
    if (!product) return;
    const { data: pd } = await supabase.from('products').select('max_devices, license_duration_days').eq('id', genForm.product_id).single();
    const expiresAt = pd?.license_duration_days ? new Date(Date.now() + pd.license_duration_days * 86400000).toISOString() : null;
    const { error } = await supabase.from('licenses').insert({
      customer_id: genForm.customer_id, product_id: genForm.product_id, license_key: generateKey(genForm.product_id),
      status: genForm.status, max_devices: pd?.max_devices || 1, expires_at: expiresAt,
    });
    if (error) toast.error(error.message);
    else { toast.success('License generated!'); fetchAll(); setGenForm({ customer_id: '', product_id: '', status: 'active' }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this license?')) return;
    await supabase.from('licenses').delete().eq('id', id);
    toast.success('Deleted'); fetchAll();
  };

  const handleRelease = async (id: string) => {
    if (!confirm('Release this license from its bound server?')) return;
    await supabase.from('licenses').update({ bound_installation_id: null }).eq('id', id);
    toast.success('Released'); fetchAll();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    await supabase.from('licenses').update({
      status: editModal.status, max_devices: editModal.max_devices, expires_at: editModal.expires_at || null,
      bound_installation_id: editModal.bound_installation_id || null,
    }).eq('id', editModal.id);
    toast.success('Updated'); setEditModal(null); fetchAll();
  };

  const handleReassign = async (licenseId: string, newInstallId: string) => {
    const trimmed = newInstallId.trim();
    await supabase.from('licenses').update({ bound_installation_id: trimmed || null }).eq('id', licenseId);
    toast.success(trimmed ? 'Reassigned to new installation' : 'Unbound');
    setBindingId(null); setBindingValue(''); fetchAll();
  };

  const handleBulkRevalidate = async () => {
    const target = filtered.filter(l => l.status === 'active' || l.status === 'free');
    if (!target.length) { toast.error('No active/free licenses to validate'); return; }
    if (!confirm(`Re-validate ${target.length} active/free license(s) against verify-license endpoint?`)) return;

    setBulkValidating(true);
    setBulkProgress({ done: 0, total: target.length, changed: 0 });
    let changed = 0;

    for (let i = 0; i < target.length; i++) {
      const lic = target[i];
      try {
        const { data, error } = await supabase.functions.invoke('verify-license', {
          body: {
            app_license_key: lic.license_key,
            user_id: lic.customer_id,
            current_device_count: lic.current_devices,
            installation_id: lic.bound_installation_id || undefined,
          },
        });
        // Check if status changed after verification
        const { data: refreshed } = await supabase.from('licenses').select('status').eq('id', lic.id).single();
        if (refreshed && refreshed.status !== lic.status) changed++;
      } catch (err) {
        console.error(`Verify failed for ${lic.license_key}:`, err);
      }
      setBulkProgress({ done: i + 1, total: target.length, changed });
    }

    setBulkValidating(false);
    toast.success(`Bulk re-validation complete: ${target.length} checked, ${changed} status changed`);
    fetchAll();
  };

  const knownInstallations = [...new Set(licenses.map(l => l.bound_installation_id).filter(Boolean))] as string[];
  const statuses = [...new Set(licenses.map(l => l.status).filter(Boolean))];

  // ── Filtered products for generate form based on active tab ──
  const filteredProducts = activeTab === 'all' ? products : products.filter(p => p.category === activeTab);

  // ── Filtered licenses ──
  const filtered = licenses.filter(l => {
    const matchSearch = l.license_key.toLowerCase().includes(search.toLowerCase()) ||
      (l.customer_email || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeTab === 'all' || (l.products as any)?.category === activeTab;
    const matchStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  // ── Time ago helper ──
  const timeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const tabClasses = (tab: ProductTab) =>
    `px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer ${
      activeTab === tab
        ? tab === 'AMPNM' ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-400'
          : tab === 'LifeOS' ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
          : 'bg-gray-600 text-gray-100 border-b-2 border-blue-400'
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
    }`;

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-6 text-center">Unified License Management</h1>
      <p className="text-center text-gray-400 text-sm mb-8">Manage AMPNM & LifeOS licenses from one portal</p>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="admin-card p-4 text-center">
          <Shield className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-100">{stats.total}</p>
          <p className="text-xs text-gray-400">Total Licenses</p>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="w-6 h-6 rounded-full bg-green-500 mx-auto mb-1 flex items-center justify-center text-xs font-bold text-white">{stats.active}</div>
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          <p className="text-xs text-gray-400">Active</p>
        </div>
        <div className="admin-card p-4 text-center cursor-pointer hover:ring-1 hover:ring-blue-500/30" onClick={() => setActiveTab('AMPNM')}>
          <Monitor className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue-300">{stats.ampnm}</p>
          <p className="text-xs text-gray-400">AMPNM <span className="text-green-400">({stats.ampnmActive} active)</span></p>
        </div>
        <div className="admin-card p-4 text-center cursor-pointer hover:ring-1 hover:ring-emerald-500/30" onClick={() => setActiveTab('LifeOS')}>
          <Leaf className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-300">{stats.lifeos}</p>
          <p className="text-xs text-gray-400">LifeOS <span className="text-green-400">({stats.lifeosActive} active)</span></p>
        </div>
        <div className="admin-card p-4 text-center">
          <Link2 className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-100">{stats.bound}</p>
          <p className="text-xs text-gray-400">Bound</p>
        </div>
        {stats.expiringSoon > 0 ? (
          <div className="admin-card p-4 text-center border border-amber-500/30 bg-amber-500/5">
            <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-300">{stats.expiringSoon}</p>
            <p className="text-xs text-amber-400">Expiring Soon</p>
          </div>
        ) : (
          <div className="admin-card p-4 text-center">
            <Clock className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-400">{stats.expired}</p>
            <p className="text-xs text-gray-400">Expired</p>
          </div>
        )}
      </div>

      {/* ── Generate New License ── */}
      <div className="admin-card mb-8 p-6">
        <h2 className="text-2xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Generate New License
          {activeTab !== 'all' && (
            <span className={`text-sm px-2 py-0.5 rounded-full ${activeTab === 'AMPNM' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {activeTab}
            </span>
          )}
        </h2>
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">Customer:</label>
            <select required className="form-admin-input" value={genForm.customer_id} onChange={e => setGenForm(f => ({ ...f, customer_id: e.target.value }))}>
              <option value="">-- Select --</option>
              {profiles.map(p => <option key={p.user_id} value={p.user_id}>{p.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">Product:</label>
            <select required className="form-admin-input" value={genForm.product_id} onChange={e => setGenForm(f => ({ ...f, product_id: e.target.value }))}>
              <option value="">-- Select --</option>
              {filteredProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.category ? `[${p.category}] ` : ''}{p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 text-sm font-bold mb-2">Status:</label>
            <select className="form-admin-input" value={genForm.status} onChange={e => setGenForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="free">Free</option>
            </select>
          </div>
          <button type="submit" className="btn-admin-primary"><Plus className="w-4 h-4 mr-1" />Generate</button>
        </form>
        {genForm.product_id && (
          <p className="text-xs text-gray-500 mt-2">
            Key prefix: <span className="font-mono text-gray-300">{products.find(p => p.id === genForm.product_id)?.category || 'KEY'}-XXXXX-XXXXX-XXXXX-XXXXX</span>
          </p>
        )}
      </div>

      {/* ── Product Tabs + Filters ── */}
      <div className="admin-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          {/* Tabs */}
          <div className="flex gap-1">
            <button className={tabClasses('all')} onClick={() => setActiveTab('all')}>
              All ({stats.total})
            </button>
            <button className={tabClasses('AMPNM')} onClick={() => setActiveTab('AMPNM')}>
              <Monitor className="w-3 h-3 inline mr-1" />AMPNM ({stats.ampnm})
            </button>
            <button className={tabClasses('LifeOS')} onClick={() => setActiveTab('LifeOS')}>
              <Leaf className="w-3 h-3 inline mr-1" />LifeOS ({stats.lifeos})
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleBulkRevalidate} disabled={bulkValidating} className="btn-admin-primary text-sm flex items-center gap-1">
              <Shield className={`w-3 h-3 ${bulkValidating ? 'animate-pulse' : ''}`} />
              {bulkValidating ? `Validating ${bulkProgress.done}/${bulkProgress.total}...` : 'Refresh Licenses'}
            </button>
            <button onClick={fetchAll} className="text-gray-400 hover:text-blue-400 text-sm flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        {/* Search + Status Filter */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <input type="text" placeholder="Search by key or email..." className="form-admin-input flex-grow" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-admin-input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {/* License Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-600 text-gray-200 uppercase text-sm">
                <th className="py-3 px-4 text-left">Key</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">Product</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Devices</th>
                <th className="py-3 px-4 text-left">Bound To</th>
                <th className="py-3 px-4 text-left">Expires</th>
                <th className="py-3 px-4 text-left">Last Active</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 text-sm">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No licenses found{activeTab !== 'all' ? ` for ${activeTab}` : ''}.
                  </td>
                </tr>
              )}
              {filtered.map(l => {
                const category = (l.products as any)?.category;
                const isExpiringSoon = l.expires_at && l.status !== 'expired' && l.status !== 'revoked' &&
                  (new Date(l.expires_at).getTime() - Date.now()) / 86400000 <= 7 &&
                  (new Date(l.expires_at).getTime() - Date.now()) > 0;

                return (
                  <tr key={l.id} className={`border-b border-gray-600 hover:bg-gray-600 ${
                    isExpiringSoon ? 'bg-amber-500/5' : ''
                  } ${
                    category === 'AMPNM' ? 'border-l-2 border-l-blue-500/40' :
                    category === 'LifeOS' ? 'border-l-2 border-l-emerald-500/40' : ''
                  }`}>
                    <td className="py-3 px-4 font-mono text-xs break-all">{l.license_key}</td>
                    <td className="py-3 px-4">{l.customer_email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        category === 'AMPNM' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                        category === 'LifeOS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {(l.products as any)?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        l.status === 'active' ? 'bg-green-500/20 text-green-300' :
                        l.status === 'free' ? 'bg-cyan-500/20 text-cyan-300' :
                        l.status === 'expired' ? 'bg-red-500/20 text-red-300' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>{l.status}</span>
                      {isExpiringSoon && (
                        <span className="ml-1 text-amber-400 text-[10px]" title="Expiring within 7 days">⚠</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{l.current_devices}/{l.max_devices}</td>
                    <td className="py-3 px-4 text-xs min-w-[200px]">
                      {bindingId === l.id ? (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            className="form-admin-input text-xs py-1 px-2 flex-grow"
                            placeholder="Installation ID..."
                            value={bindingValue}
                            onChange={e => setBindingValue(e.target.value)}
                            list={`install-list-${l.id}`}
                          />
                          <datalist id={`install-list-${l.id}`}>
                            {knownInstallations.filter(i => i !== l.bound_installation_id).map(i => (
                              <option key={i} value={i}>{i.slice(0, 30)}</option>
                            ))}
                          </datalist>
                          <button onClick={() => handleReassign(l.id, bindingValue)} className="btn-admin-primary text-xs px-2 py-1" title="Save">✓</button>
                          <button onClick={() => { setBindingId(null); setBindingValue(''); }} className="btn-admin-secondary text-xs px-2 py-1" title="Cancel">✗</button>
                        </div>
                      ) : l.bound_installation_id ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-yellow-300 cursor-pointer" title={l.bound_installation_id} onClick={() => { setBindingId(l.id); setBindingValue(l.bound_installation_id); }}>
                            {l.bound_installation_id.slice(0, 20)}...
                          </span>
                          <button onClick={() => { setBindingId(l.id); setBindingValue(l.bound_installation_id); }} className="text-gray-400 hover:text-blue-400" title="Reassign"><Link2 className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setBindingId(l.id); setBindingValue(''); }} className="text-gray-500 hover:text-blue-400 flex items-center gap-1" title="Bind">
                          <Link2 className="w-3 h-3" /> Unbound
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {l.expires_at ? (
                        <span className={isExpiringSoon ? 'text-amber-400 font-medium' : ''}>
                          {new Date(l.expires_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-500">Never</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      <span className={`${
                        l.last_active_at && (Date.now() - new Date(l.last_active_at).getTime()) < 86400000
                          ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        {timeAgo(l.last_active_at)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button onClick={() => setEditModal({ ...l, expires_at: l.expires_at?.split('T')[0] || '' })} className="btn-admin-primary text-xs px-2 py-1 mr-1" title="Edit"><Edit className="w-3 h-3" /></button>
                      {l.bound_installation_id && <button onClick={() => handleRelease(l.id)} className="btn-admin-secondary text-xs px-2 py-1 mr-1" title="Release"><Unlink className="w-3 h-3" /></button>}
                      <button onClick={() => handleDelete(l.id)} className="btn-admin-danger text-xs px-2 py-1" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-right">Showing {filtered.length} of {licenses.length} licenses</p>
      </div>

      {/* ── Edit Modal ── */}
      {editModal && (
        <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50">
          <div className="bg-gray-700 p-8 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-blue-400">Edit License</h2>
                {(editModal.products as any)?.category && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    (editModal.products as any)?.category === 'AMPNM' ? 'bg-blue-500/20 text-blue-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {(editModal.products as any)?.category} — {(editModal.products as any)?.name}
                  </span>
                )}
              </div>
              <button onClick={() => setEditModal(null)}><X className="w-5 h-5 text-gray-300" /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Status:</label>
                <select className="form-admin-input" value={editModal.status} onChange={e => setEditModal((m: any) => ({ ...m, status: e.target.value }))}>
                  {['active', 'free', 'expired', 'revoked'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Max Devices:</label>
                <input type="number" className="form-admin-input" value={editModal.max_devices} onChange={e => setEditModal((m: any) => ({ ...m, max_devices: +e.target.value }))} />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Expires At:</label>
                <input type="date" className="form-admin-input" value={editModal.expires_at} onChange={e => setEditModal((m: any) => ({ ...m, expires_at: e.target.value }))} />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-bold mb-2">Bound Installation ID:</label>
                <input type="text" className="form-admin-input font-mono text-xs" placeholder="Leave empty to unbind" value={editModal.bound_installation_id || ''} onChange={e => setEditModal((m: any) => ({ ...m, bound_installation_id: e.target.value }))} list="edit-install-list" />
                <datalist id="edit-install-list">
                  {knownInstallations.map(i => <option key={i} value={i}>{i.slice(0, 40)}</option>)}
                </datalist>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditModal(null)} className="btn-admin-secondary">Cancel</button>
                <button type="submit" className="btn-admin-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLicenses;
