import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, X as XIcon, Key, Loader2, Eye, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedLicense {
  item_id: string;
  product_name: string;
  license_key: string;
  expires_at: string | null;
  max_devices: number;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [approving, setApproving] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GeneratedLicense[] | null>(null);
  const [showResultFor, setShowResultFor] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});

  const fetchOrders = async () => {
    let q = supabase.from('orders').select('*, profiles!orders_customer_id_fkey(email, first_name, last_name)').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setOrders(data || []);
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data } = await supabase
      .from('order_items')
      .select('*, products(name, category)')
      .eq('order_id', orderId);
    setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
  };

  const toggleExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      fetchOrderItems(orderId);
    }
  };

  const handleApprove = async (orderId: string) => {
    if (!confirm('Approve this order and generate licenses?')) return;

    setApproving(orderId);
    setLastResult(null);
    setShowResultFor(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-license`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order_id: orderId }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to generate licenses');
      }

      setLastResult(result.licenses);
      setShowResultFor(orderId);
      toast.success(result.message);
      fetchOrders();

      // Refresh order items if expanded
      if (expandedOrder === orderId) {
        setOrderItems(prev => {
          const updated = { ...prev };
          delete updated[orderId];
          return updated;
        });
        fetchOrderItems(orderId);
      }
    } catch (err: any) {
      toast.error(err.message || 'License generation failed');
    } finally {
      setApproving(null);
    }
  };

  const handleFail = async (orderId: string) => {
    if (!confirm('Mark this order as failed?')) return;
    await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId);
    toast.success('Order marked as failed.');
    fetchOrders();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('License key copied!');
  };

  const getCustomerDisplay = (o: any) => {
    const p = o.profiles as any;
    if (p?.first_name) return `${p.first_name} ${p.last_name || ''}`.trim();
    return p?.email || 'Unknown';
  };

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">Manage Orders</h1>

      {/* Generated Licenses Result */}
      {lastResult && showResultFor && (
        <div className="admin-card p-6 mb-6 border border-green-500/30 bg-green-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
              <Key className="w-5 h-5" /> Generated Licenses
            </h3>
            <button
              onClick={() => { setLastResult(null); setShowResultFor(null); }}
              className="text-gray-400 hover:text-white"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {lastResult.map((lic, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/60 border border-gray-700">
                <div>
                  <p className="text-white font-medium text-sm">{lic.product_name}</p>
                  <p className="text-gray-400 text-xs">
                    {lic.max_devices > 0 && `${lic.max_devices} device${lic.max_devices !== 1 ? 's' : ''}`}
                    {lic.expires_at && ` · Expires ${new Date(lic.expires_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-green-300 text-xs font-mono bg-green-500/10 px-3 py-1 rounded">
                    {lic.license_key}
                  </code>
                  <button onClick={() => copyKey(lic.license_key)} className="text-gray-400 hover:text-white">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <>
                  <tr key={o.id} className="border-b border-gray-600 hover:bg-gray-600">
                    <td className="py-3 px-4">{getCustomerDisplay(o)}</td>
                    <td className="py-3 px-4 font-bold">${Number(o.total_amount).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        o.status === 'completed' ? 'bg-green-500' :
                        o.status === 'pending_approval' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}>
                        {o.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">{o.payment_method || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-xs">{o.transaction_id || '-'}</td>
                    <td className="py-3 px-4">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => toggleExpand(o.id)}
                          className="btn-admin-primary text-xs px-2 py-1"
                          title="View items"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        {o.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => handleApprove(o.id)}
                              disabled={approving === o.id}
                              className="btn-admin-primary text-xs px-2 py-1"
                              title="Approve & generate licenses"
                            >
                              {approving === o.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleFail(o.id)}
                              className="btn-admin-danger text-xs px-2 py-1"
                              title="Reject order"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {o.status === 'completed' && (
                          <span className="text-green-400 text-xs ml-1">Licensed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedOrder === o.id && (
                    <tr key={`${o.id}-items`} className="bg-gray-800/50">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="space-y-2">
                          <p className="text-xs text-gray-400 font-semibold uppercase">Order Items</p>
                          {orderItems[o.id] ? (
                            orderItems[o.id].length > 0 ? (
                              orderItems[o.id].map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between p-2 rounded bg-gray-700/50">
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                      (item.products as any)?.category === 'LifeOS'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    }`}>
                                      {(item.products as any)?.category || 'N/A'}
                                    </span>
                                    <span className="text-gray-200 text-sm">{(item.products as any)?.name}</span>
                                    <span className="text-gray-500 text-xs">×{item.quantity}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-300 text-sm">${Number(item.price).toFixed(2)}</span>
                                    {item.license_key_generated ? (
                                      <div className="flex items-center gap-1">
                                        <code className="text-green-300 text-xs font-mono bg-green-500/10 px-2 py-0.5 rounded">
                                          {item.license_key_generated}
                                        </code>
                                        <button onClick={() => copyKey(item.license_key_generated)} className="text-gray-400 hover:text-white">
                                          <Copy className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-yellow-400 text-xs">Pending</span>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-xs">No items found.</p>
                            )
                          ) : (
                            <p className="text-gray-500 text-xs">Loading...</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
