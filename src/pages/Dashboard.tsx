import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Download, Package, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [licenses, setLicenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: lics } = await supabase
        .from('licenses')
        .select('*, products(name, description, category)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      setLicenses(lics || []);

      const { data: ords } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      setOrders(ords || []);
    };
    fetchData();
  }, [user]);

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('License key copied!');
  };

  const displayName = profile?.first_name ? `${profile.first_name}` : user?.email;

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Welcome, {displayName}!</h1>

      {searchParams.get('order_success') && (
        <div className="alert-glass-success mb-4">Your order has been placed successfully! Your licenses are now available below.</div>
      )}
      {searchParams.get('order_pending') && (
        <div className="alert-glass-warning mb-4">Order placed successfully! Your payment is pending approval. Licenses will be issued once payment is confirmed.</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">My Licenses</h2>
          {licenses.length === 0 ? (
            <div className="text-center py-8 text-gray-200">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl">You don't have any active licenses yet.</p>
              <Link to="/products" className="btn-glass-primary mt-4">Buy Licenses</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {licenses.map(license => (
                <div key={license.id} className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-semibold text-white">{(license.products as any)?.name || 'License'}</h4>
                    {(license.products as any)?.category && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${(license.products as any)?.category === 'LifeOS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : (license.products as any)?.category === 'AMPNM' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>{(license.products as any)?.category}</span>
                    )}
                  </div>
                  <p className="text-gray-200 text-sm mb-2">{(license.products as any)?.description}</p>
                  <div className="bg-gray-800 p-3 rounded-md font-mono text-sm break-all mb-2 flex items-center justify-between">
                    <span><strong className="text-gray-300">Key:</strong> <span className="text-white">{license.license_key}</span></span>
                    <button onClick={() => copyKey(license.license_key)} className="ml-2 text-blue-400 hover:text-blue-300">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-200">
                    <span><strong>Status:</strong> <span className={license.status === 'active' || license.status === 'free' ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>{license.status}</span></span>
                    <span><strong>Max Devices:</strong> {license.max_devices}</span>
                    <span><strong>Current:</strong> {license.current_devices}</span>
                    <span><strong>Expires:</strong> {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Order History</h2>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-200">
              <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl">You haven't placed any orders yet.</p>
              <Link to="/products" className="btn-glass-primary mt-4">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="glass-card p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">Order #{order.id.slice(0, 8)}</h3>
                    <span className="text-sm text-gray-300">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-200 mb-1"><strong>Total:</strong> ${Number(order.total_amount).toFixed(2)}</p>
                  <p className="text-gray-200">
                    <strong>Status:</strong>{' '}
                    <span className={`font-semibold ${order.status === 'completed' ? 'text-green-400' : order.status === 'pending' || order.status === 'pending_approval' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
