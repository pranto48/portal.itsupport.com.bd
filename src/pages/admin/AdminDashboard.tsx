import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Package, Shield, ShoppingBag, DollarSign, Monitor, Leaf } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ customers: 0, products: 0, licenses: 0, orders: 0, revenue: 0, ampnmLicenses: 0, lifeosLicenses: 0, activeLicenses: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [c, p, l, o] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('licenses').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
      ]);
      const { data: rev } = await supabase.from('orders').select('total_amount').eq('status', 'completed');
      const totalRev = (rev || []).reduce((s: number, r: any) => s + Number(r.total_amount), 0);

      // Product-aware license counts
      const { data: licenseData } = await supabase.from('licenses').select('status, products(category)');
      const ampnm = (licenseData || []).filter((ld: any) => ld.products?.category === 'AMPNM').length;
      const lifeos = (licenseData || []).filter((ld: any) => ld.products?.category === 'LifeOS').length;
      const active = (licenseData || []).filter((ld: any) => ld.status === 'active' || ld.status === 'free').length;

      setStats({
        customers: c.count || 0, products: p.count || 0, licenses: l.count || 0,
        orders: o.count || 0, revenue: totalRev, ampnmLicenses: ampnm, lifeosLicenses: lifeos, activeLicenses: active,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { icon: Users, label: 'Total Customers', value: stats.customers, color: 'text-green-400' },
    { icon: Package, label: 'Total Products', value: stats.products, color: 'text-purple-400' },
    { icon: Shield, label: 'Total Licenses', value: stats.licenses, color: 'text-yellow-400', sub: `${stats.activeLicenses} active` },
    { icon: Monitor, label: 'AMPNM Licenses', value: stats.ampnmLicenses, color: 'text-blue-400' },
    { icon: Leaf, label: 'LifeOS Licenses', value: stats.lifeosLicenses, color: 'text-emerald-400' },
    { icon: ShoppingBag, label: 'Total Orders', value: stats.orders, color: 'text-blue-400' },
    { icon: DollarSign, label: 'Total Revenue', value: `$${stats.revenue.toFixed(2)}`, color: 'text-green-500' },
  ];

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="admin-card text-center p-6">
            <Icon className={`w-12 h-12 ${color} mx-auto mb-4`} />
            <h2 className="text-xl font-semibold mb-2 text-gray-100">{label}</h2>
            <p className="text-4xl font-bold text-gray-100">{value}</p>
            {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
          </div>
        ))}
      </div>
      <div className="admin-card mt-8 p-6">
        <h2 className="text-2xl font-semibold text-blue-400 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/users" className="btn-admin-primary text-center">Manage Customers</Link>
          <Link to="/admin/licenses" className="btn-admin-primary text-center">Manage Licenses</Link>
          <Link to="/admin/products" className="btn-admin-primary text-center">Manage Products</Link>
          <Link to="/admin/tickets" className="btn-admin-primary text-center">Manage Tickets</Link>
          <Link to="/admin/reconciliation" className="btn-admin-primary text-center">License Reconciliation</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
