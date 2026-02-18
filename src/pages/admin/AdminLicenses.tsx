import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Unlink, X } from 'lucide-react';
import { toast } from 'sonner';

const AdminLicenses = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editModal, setEditModal] = useState<any>(null);
  const [genForm, setGenForm] = useState({ customer_id: '', product_id: '', status: 'active' });

  const fetchAll = async () => {
    const { data: l } = await supabase.from('licenses').select('*, products(name, category)');
    const { data: p } = await supabase.from('profiles').select('user_id, email').order('email');
    setProfiles(p || []);
    // Map customer emails onto licenses
    const profileMap = (p || []).reduce((acc: Record<string, string>, prof: any) => {
      acc[prof.user_id] = prof.email;
      return acc;
    }, {});
    setLicenses((l || []).map((lic: any) => ({ ...lic, customer_email: profileMap[lic.customer_id] || 'N/A' })));
    const { data: pr } = await supabase.from('products').select('id, name, category');
    setProducts(pr || []);
  };

  useEffect(() => { fetchAll(); }, []);

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = Array.from({ length: 4 }, () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
    return segments.join('-');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === genForm.product_id);
    if (!product) return;
    const { data: pd } = await supabase.from('products').select('max_devices, license_duration_days').eq('id', genForm.product_id).single();
    const expiresAt = pd?.license_duration_days ? new Date(Date.now() + pd.license_duration_days * 86400000).toISOString() : null;
    const { error } = await supabase.from('licenses').insert({
      customer_id: genForm.customer_id, product_id: genForm.product_id, license_key: generateKey(),
      status: genForm.status, max_devices: pd?.max_devices || 1, expires_at: expiresAt,
    });
    if (error) toast.error(error.message);
    else { toast.success('License generated!'); fetchAll(); }
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
    }).eq('id', editModal.id);
    toast.success('Updated'); setEditModal(null); fetchAll();
  };

  const categories = [...new Set(products.map((p: any) => p.category).filter(Boolean))];

  const filtered = licenses.filter(l => {
    const matchSearch = l.license_key.toLowerCase().includes(search.toLowerCase()) ||
      (l.customer_email || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === 'all' || (l.products as any)?.category === filterCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">Manage Licenses</h1>

      <div className="admin-card mb-8 p-6">
        <h2 className="text-2xl font-semibold text-blue-400 mb-4">Generate New License</h2>
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
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
      </div>

      <div className="admin-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <input type="text" placeholder="Search by key or email..." className="form-admin-input flex-grow" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-admin-input w-auto" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-600 text-gray-200 uppercase text-sm">
                <th className="py-3 px-4 text-left">Key</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">Product</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Devices</th>
                <th className="py-3 px-4 text-left">Expires</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 text-sm">
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-gray-600 hover:bg-gray-600">
                  <td className="py-3 px-4 font-mono text-xs break-all">{l.license_key}</td>
                  <td className="py-3 px-4">{l.customer_email}</td>
                  <td className="py-3 px-4">{(l.products as any)?.name || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${l.status === 'active' || l.status === 'free' ? 'bg-green-500' : 'bg-red-500'}`}>{l.status}</span>
                  </td>
                  <td className="py-3 px-4">{l.current_devices}/{l.max_devices}</td>
                  <td className="py-3 px-4">{l.expires_at ? new Date(l.expires_at).toLocaleDateString() : 'Never'}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button onClick={() => setEditModal({ ...l, expires_at: l.expires_at?.split('T')[0] || '' })} className="btn-admin-primary text-xs px-2 py-1 mr-1"><Edit className="w-3 h-3" /></button>
                    {l.bound_installation_id && <button onClick={() => handleRelease(l.id)} className="btn-admin-secondary text-xs px-2 py-1 mr-1"><Unlink className="w-3 h-3" /></button>}
                    <button onClick={() => handleDelete(l.id)} className="btn-admin-danger text-xs px-2 py-1"><Trash2 className="w-3 h-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editModal && (
        <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50">
          <div className="bg-gray-700 p-8 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-blue-400">Edit License</h2>
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
