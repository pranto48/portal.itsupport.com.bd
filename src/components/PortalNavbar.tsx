import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Menu, X, Shield, ShoppingCart, User, LifeBuoy, LayoutDashboard, Package, LogOut, Lock, Home, Database, Globe, Settings, LogIn, UserPlus, Tag } from 'lucide-react';

const PortalNavbar = () => {
  const { user, isAdmin, profile, signOut } = useAuth();
  const { items } = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const publicLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/products#pricing', label: 'Pricing', icon: Tag },
  ];

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
    { to: '/admin/license-endpoint', label: 'License Endpoint', icon: Globe },
    { to: '/admin/website-settings', label: 'Settings', icon: Settings },
  ];

  const isAdminPage = location.pathname.startsWith('/admin');
  const links = user ? (isAdminPage ? adminLinks : customerLinks) : publicLinks;

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

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className={`nav-link flex items-center gap-1.5 ${isActive(to) ? 'active' : ''}`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
            {user && !isAdminPage && isAdmin && (
              <Link to="/admin" className="nav-link flex items-center gap-1.5">
                <Lock className="w-4 h-4" />Admin
              </Link>
            )}
            {user && isAdminPage && (
              <Link to="/dashboard" className="nav-link flex items-center gap-1.5">
                <Home className="w-4 h-4" />Portal
              </Link>
            )}
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cart icon (always visible) */}
            <Link to="/cart" className="relative text-gray-300 hover:text-white transition-colors p-2">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <>
                <span className="text-sm text-muted-foreground">{displayName}</span>
                <button onClick={signOut} className="btn-glass-secondary text-sm py-1 px-4">
                  <LogOut className="w-4 h-4 mr-1" />Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn-glass-secondary text-sm py-1 px-4 flex items-center gap-1.5">
                  <LogIn className="w-4 h-4" />Login
                </Link>
                <Link to="/register" className="btn-glass-primary text-sm py-1 px-4 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <Link to="/cart" className="relative text-gray-300 hover:text-white p-2">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white ${isActive(to) ? 'bg-white/10' : 'hover:bg-white/5'}`}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
          {user ? (
            <>
              {!isAdminPage && isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/5">
                  <Lock className="w-4 h-4" />Admin Panel
                </Link>
              )}
              <button onClick={() => { signOut(); setMobileOpen(false); }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/10 w-full">
                <LogOut className="w-4 h-4" />Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/5">
                <LogIn className="w-4 h-4" />Login
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-white/5">
                <UserPlus className="w-4 h-4" />Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default PortalNavbar;
