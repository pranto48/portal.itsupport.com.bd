import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Package, ShoppingBag, AlertTriangle, Monitor, Leaf, Shield } from 'lucide-react';
import { toast } from 'sonner';
import dashboardHero from '@/assets/dashboard-hero.png';

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

  // Group licenses by product category
  const ampnmLicenses = licenses.filter(l => (l.products as any)?.category === 'AMPNM');
  const lifeosLicenses = licenses.filter(l => (l.products as any)?.category === 'LifeOS');
  const otherLicenses = licenses.filter(l => !(l.products as any)?.category);

  const renderLicenseCard = (license: any) => {
    const category = (license.products as any)?.category;
    const isExpiringSoon = license.expires_at && license.status !== 'expired' &&
      (new Date(license.expires_at).getTime() - Date.now()) / 86400000 <= 7 &&
      (new Date(license.expires_at).getTime() - Date.now()) > 0;

    return (
      <div key={license.id} className={`glass-card p-4 ${
        isExpiringSoon ? 'ring-1 ring-amber-500/30' : ''
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-lg font-semibold text-foreground">{(license.products as any)?.name || 'License'}</h4>
          {category && (
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              category === 'LifeOS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              category === 'AMPNM' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
              'bg-gray-500/20 text-muted-foreground border border-gray-500/30'
            }`}>{category}</span>
          )}
          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
            license.status === 'active' || license.status === 'free' ? 'bg-green-500/20 text-green-300' :
            license.status === 'expired' ? 'bg-red-500/20 text-red-300' :
            'bg-gray-500/20 text-muted-foreground'
          }`}>{license.status}</span>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{(license.products as any)?.description}</p>
        <div className="bg-secondary p-3 rounded-md font-mono text-sm break-all mb-2 flex items-center justify-between">
          <span><strong className="text-muted-foreground">Key:</strong> <span className="text-foreground">{license.license_key}</span></span>
          <button onClick={() => copyKey(license.license_key)} className="ml-2 text-primary hover:text-primary/80">
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <span><strong>Max Devices:</strong> {license.max_devices}</span>
          <span><strong>Current:</strong> {license.current_devices}</span>
          <span><strong>Expires:</strong> {license.expires_at ? (
            <span className={isExpiringSoon ? 'text-amber-400 font-medium' : ''}>
              {new Date(license.expires_at).toLocaleDateString()}
              {isExpiringSoon && ' ⚠️'}
            </span>
          ) : 'Never'}</span>
          {license.bound_installation_id && (
            <span><strong>Bound:</strong> <span className="font-mono text-xs">{license.bound_installation_id.slice(0, 16)}...</span></span>
          )}
        </div>
        {/* Quota warnings */}
        {license.max_devices > 0 && (() => {
          const usage = license.current_devices / license.max_devices;
          if (usage >= 1) {
            return (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-500/15 border border-red-500/30 px-3 py-2 text-sm text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Device quota reached ({license.current_devices}/{license.max_devices}). Upgrade your plan for more devices.</span>
              </div>
            );
          } else if (usage >= 0.75) {
            return (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-yellow-500/15 border border-yellow-500/30 px-3 py-2 text-sm text-yellow-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Nearing device quota ({license.current_devices}/{license.max_devices}). Consider upgrading.</span>
              </div>
            );
          }
          return null;
        })()}
        {isExpiringSoon && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-sm text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>License expires on {new Date(license.expires_at).toLocaleDateString()}. Renew to avoid service interruption.</span>
          </div>
        )}
      </div>
    );
  };

  const renderProductSection = (title: string, icon: React.ReactNode, sectionLicenses: any[], colorClass: string) => {
    if (sectionLicenses.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${colorClass}`}>
          {icon} {title}
          <span className="text-xs text-muted-foreground font-normal">({sectionLicenses.length})</span>
        </h3>
        <div className="space-y-4">
          {sectionLicenses.map(renderLicenseCard)}
        </div>
      </div>
    );
  };

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Hero Banner */}
      <div className="glass-card !p-0 overflow-hidden mb-8 relative">
        <img src={dashboardHero} alt="Dashboard Overview" className="w-full h-48 md:h-56 object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent flex items-center px-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Welcome, {displayName}!</h1>
            <p className="text-gray-300 mt-1">Manage your licenses, orders, and support from one place.</p>
          </div>
        </div>
      </div>

      {searchParams.get('order_success') && (
        <div className="alert-glass-success mb-4">Your order has been placed successfully! Your licenses are now available below.</div>
      )}
      {searchParams.get('order_pending') && (
        <div className="alert-glass-warning mb-4">Order placed successfully! Your payment is pending approval. Licenses will be issued once payment is confirmed.</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Licenses Panel */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> My Licenses
            {licenses.length > 0 && <span className="text-xs text-muted-foreground font-normal">({licenses.length} total)</span>}
          </h2>

          {licenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-16 h-16 text-muted mx-auto mb-4" />
              <p className="text-xl">You don't have any active licenses yet.</p>
              <Link to="/products" className="btn-glass-primary mt-4">Buy Licenses</Link>
            </div>
          ) : (
            <>
              {renderProductSection('AMPNM Licenses', <Monitor className="w-4 h-4" />, ampnmLicenses, 'text-blue-400')}
              {renderProductSection('LifeOS Licenses', <Leaf className="w-4 h-4" />, lifeosLicenses, 'text-emerald-400')}
              {otherLicenses.length > 0 && renderProductSection('Other Licenses', <Package className="w-4 h-4" />, otherLicenses, 'text-muted-foreground')}
            </>
          )}
        </div>

        {/* Orders Panel */}
        <div className="glass-card p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Order History</h2>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="w-16 h-16 text-muted mx-auto mb-4" />
              <p className="text-xl">You haven't placed any orders yet.</p>
              <Link to="/products" className="btn-glass-primary mt-4">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="glass-card p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-foreground">Order #{order.id.slice(0, 8)}</h3>
                    <span className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-muted-foreground mb-1"><strong>Total:</strong> ${Number(order.total_amount).toFixed(2)}</p>
                  <p className="text-muted-foreground">
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
