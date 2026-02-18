import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['AMPNM', 'LifeOS', 'Other'];
const emptyProduct = { name: '', description: '', category: 'AMPNM', price: 0, max_devices: 1, license_duration_days: 365 };

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [editModal, setEditModal] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({ ...emptyProduct });
  const [filterCategory, setFilterCategory] = useState('all');

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('name');
    setProducts(data || []);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('products').insert(newProduct);
    if (error) toast.error(error.message);
    else { toast.success('Product added!'); setNewProduct({ ...emptyProduct }); fetchProducts(); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    const { id, created_at, updated_at, is_active, ...rest } = editModal;
    await supabase.from('products').update(rest).eq('id', id);
    toast.success('Updated!'); setEditModal(null); fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Deleted!'); fetchProducts(); }
  };

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">Manage Products</h1>

      <div className="admin-card mb-8 p-6">
        <h2 className="text-2xl font-semibold text-blue-400 mb-4">Add New Product</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-gray-300 text-sm font-bold mb-2">Name:</label>
            <input required className="form-admin-input" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className="block text-gray-300 text-sm font-bold mb-2">Category:</label>
            <select className="form-admin-input" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select></div>
          <div><label className="block text-gray-300 text-sm font-bold mb-2">Price ($):</label>
            <input type="number" step="0.01" required className="form-admin-input" value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: +e.target.value }))} /></div>
          <div><label className="block text-gray-300 text-sm font-bold mb-2">Max Devices:</label>
            <input type="number" required className="form-admin-input" value={newProduct.max_devices} onChange={e => setNewProduct(p => ({ ...p, max_devices: +e.target.value }))} /></div>
          <div><label className="block text-gray-300 text-sm font-bold mb-2">Duration (Days):</label>
            <input type="number" required className="form-admin-input" value={newProduct.license_duration_days} onChange={e => setNewProduct(p => ({ ...p, license_duration_days: +e.target.value }))} /></div>
          <div><label className="block text-gray-300 text-sm font-bold mb-2">Description:</label>
            <input className="form-admin-input" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="md:col-span-3"><button type="submit" className="btn-admin-primary"><Plus className="w-4 h-4 mr-1" />Add Product</button></div>
        </form>
      </div>

      <div className="admin-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-gray-300 text-sm font-bold">Filter:</label>
          <select className="form-admin-input w-auto" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg">
            <thead>
              <tr className="bg-gray-600 text-gray-200 uppercase text-sm">
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Price</th>
                <th className="py-3 px-4 text-left">Max Devices</th>
                <th className="py-3 px-4 text-left">Duration</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 text-sm">
              {products.filter(p => filterCategory === 'all' || p.category === filterCategory).map(p => (
                <tr key={p.id} className="border-b border-gray-600 hover:bg-gray-600">
                  <td className="py-3 px-4">{p.name}</td>
                  <td className="py-3 px-4">{p.category}</td>
                  <td className="py-3 px-4">${Number(p.price).toFixed(2)}</td>
                  <td className="py-3 px-4">{p.max_devices}</td>
                  <td className="py-3 px-4">{p.license_duration_days} days</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => setEditModal({ ...p })} className="btn-admin-primary text-xs px-2 py-1 mr-1"><Edit className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(p.id)} className="btn-admin-danger text-xs px-2 py-1"><Trash2 className="w-3 h-3" /></button>
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
              <h2 className="text-2xl font-semibold text-blue-400">Edit Product</h2>
              <button onClick={() => setEditModal(null)}><X className="w-5 h-5 text-gray-300" /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div><label className="block text-gray-300 text-sm mb-2">Name:</label><input required className="form-admin-input" value={editModal.name} onChange={e => setEditModal((m: any) => ({ ...m, name: e.target.value }))} /></div>
              <div><label className="block text-gray-300 text-sm mb-2">Category:</label><select className="form-admin-input" value={editModal.category} onChange={e => setEditModal((m: any) => ({ ...m, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-gray-300 text-sm mb-2">Price:</label><input type="number" step="0.01" className="form-admin-input" value={editModal.price} onChange={e => setEditModal((m: any) => ({ ...m, price: +e.target.value }))} /></div>
              <div><label className="block text-gray-300 text-sm mb-2">Max Devices:</label><input type="number" className="form-admin-input" value={editModal.max_devices} onChange={e => setEditModal((m: any) => ({ ...m, max_devices: +e.target.value }))} /></div>
              <div><label className="block text-gray-300 text-sm mb-2">Duration (Days):</label><input type="number" className="form-admin-input" value={editModal.license_duration_days} onChange={e => setEditModal((m: any) => ({ ...m, license_duration_days: +e.target.value }))} /></div>
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

export default AdminProducts;
