import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Menu, X, Shield, ShoppingCart, User, LifeBuoy, LayoutDashboard, Package, LogOut, Lock, Home, Database } from 'lucide-react';

const PortalNavbar = () => {
  const { user, isAdmin, profile, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const customerLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/cart', label: 'Cart', icon: ShoppingCart },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/support', label: 'Support', icon: LifeBuoy },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/licenses', label: 'Licenses', icon: Shield },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/users', label: 'Users', icon: User },
    { to: '/admin/tickets', label: 'Tickets', icon: LifeBuoy },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    { to: '/admin/backup', label: 'Backup', icon: Database },
  ];

  const isAdminPage = location.pathname.startsWith('/admin');
  const links = isAdminPage ? adminLinks : customerLinks;

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`
    : user?.email || '';

  return (
    <nav className={isAdminPage ? 'admin-navbar sticky top-0 z-50' : 'glass-navbar sticky top-0 z-50'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" />
            <span className="text-lg font-bold text-white">IT Support BD</span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-1">
              {links.map(({ to, label }) => (
                <Link key={to} to={to} className={`nav-link ${isActive(to) ? 'active' : ''}`}>
                  {label}
                </Link>
              ))}
              {!isAdminPage && isAdmin && (
                <Link to="/admin" className="nav-link">
                  <Lock className="w-4 h-4 inline mr-1" />Admin
                </Link>
              )}
              {isAdminPage && (
                <Link to="/dashboard" className="nav-link">
                  <Home className="w-4 h-4 inline mr-1" />Portal
                </Link>
              )}
            </div>
          )}

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">{displayName}</span>
                <button onClick={signOut} className="btn-glass-secondary text-sm py-1 px-4">
                  <LogOut className="w-4 h-4 mr-1" />Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn-glass-secondary text-sm py-1 px-4">Login</Link>
                <Link to="/register" className="btn-glass-primary text-sm py-1 px-4">Register</Link>
              </div>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          {user ? (
            <>
              {links.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white ${isActive(to) ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                  <Icon className="w-4 h-4" />{label}
                </Link>
              ))}
              <button onClick={() => { signOut(); setMobileOpen(false); }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 w-full">
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/5">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/5">Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default PortalNavbar;
