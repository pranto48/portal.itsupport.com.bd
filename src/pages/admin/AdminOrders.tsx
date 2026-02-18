import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  const fetchOrders = async () => {
    let q = supabase.from('orders').select('*, profiles!orders_customer_id_fkey(email)').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setOrders(data || []);
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  const generateKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 4 }, () => Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')).join('-');
  };

  const handleApprove = async (orderId: string) => {
    if (!confirm('Approve this order and generate licenses?')) return;
    const { data: items } = await supabase.from('order_items').select('*, products(max_devices, license_duration_days)').eq('order_id', orderId);
    const order = orders.find(o => o.id === orderId);
    if (!order || !items) return;

    for (const item of items) {
      const pd = item.products as any;
      const key = generateKey();
      const expiresAt = pd?.license_duration_days ? new Date(Date.now() + pd.license_duration_days * 86400000).toISOString() : null;
      await supabase.from('licenses').insert({
        customer_id: order.customer_id, product_id: item.product_id, license_key: key,
        status: 'active', max_devices: pd?.max_devices || 1, expires_at: expiresAt,
      });
      await supabase.from('order_items').update({ license_key_generated: key }).eq('id', item.id);
    }
    await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
    toast.success('Order approved, licenses generated!');
    fetchOrders();
  };

  const handleFail = async (orderId: string) => {
    if (!confirm('Mark this order as failed?')) return;
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId);
    toast.success('Order marked as failed.');
    fetchOrders();
  };

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">Manage Orders</h1>
      <div className="admin-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-blue-400">All Orders</h2>
          <div className="flex gap-2">
            {['all', 'pending_approval', 'completed', 'failed'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`btn-admin-primary text-xs px-3 py-1 ${filter === s ? 'opacity-100' : 'opacity-60'}`}>
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg">
            <thead><tr className="bg-gray-600 text-gray-200 uppercase text-sm">
              <th className="py-3 px-4 text-left">Customer</th>
              <th className="py-3 px-4 text-left">Amount</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Method</th>
              <th className="py-3 px-4 text-left">TXN ID</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr></thead>
            <tbody className="text-gray-300 text-sm">
              {orders.map(o => (
                <tr key={o.id} className="border-b border-gray-600 hover:bg-gray-600">
                  <td className="py-3 px-4">{(o.profiles as any)?.email}</td>
                  <td className="py-3 px-4 font-bold">${Number(o.total_amount).toFixed(2)}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs ${o.status === 'completed' ? 'bg-green-500' : o.status === 'pending_approval' ? 'bg-yellow-500' : 'bg-red-500'}`}>{o.status.replace('_', ' ')}</span></td>
                  <td className="py-3 px-4">{o.payment_method || 'N/A'}</td>
                  <td className="py-3 px-4 font-mono text-xs">{o.transaction_id || '-'}</td>
                  <td className="py-3 px-4">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {o.status === 'pending_approval' ? (
                      <>
                        <button onClick={() => handleApprove(o.id)} className="btn-admin-primary text-xs px-2 py-1 mr-1"><Check className="w-3 h-3" /></button>
                        <button onClick={() => handleFail(o.id)} className="btn-admin-danger text-xs px-2 py-1"><XIcon className="w-3 h-3" /></button>
                      </>
                    ) : o.status === 'completed' ? (
                      <span className="text-green-400 text-xs">Licenses Issued</span>
                    ) : <span className="text-gray-400 text-xs">No Action</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
