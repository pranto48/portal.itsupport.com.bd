import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Shield, Smartphone, Zap, Package, Cloud, Network } from 'lucide-react';
import { toast } from 'sonner';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).order('category').order('price')
      .then(({ data }) => setProducts(data || []));
  }, []);

  const grouped = products.reduce((acc, p) => {
    const cat = p.category || 'Other';
    (acc[cat] = acc[cat] || []).push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const categoryIcons: Record<string, any> = { AMPNM: Network, Support: Shield, 'Add-ons': Package, Other: Package };

  const handleAdd = (product: any) => {
    addToCart(product);
    toast.success('Added to cart!');
  };

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <div className="glass-card mb-10 p-10 relative overflow-hidden">
        <div className="floating-orb one" />
        <div className="floating-orb two" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center relative z-10">
          <div className="space-y-3">
            <span className="accent-badge"><Package className="w-4 h-4" /> AMPNM catalog</span>
            <h1 className="text-4xl font-bold text-white">Choose the right AMPNM license for your network</h1>
            <p className="text-gray-200 max-w-2xl">Curated plans with clear limits and quick add-to-cart actions.</p>
            <div className="flex flex-wrap gap-3 text-gray-200 text-sm">
              <span className="meta-pill"><Smartphone className="w-4 h-4" /> Mobile-ready</span>
              <span className="meta-pill"><Shield className="w-4 h-4" /> Secured checkout</span>
              <span className="meta-pill"><Zap className="w-4 h-4" /> Instant delivery</span>
            </div>
          </div>
          <div className="glass-card p-6 space-y-3" style={{ border: '1px solid rgba(80,227,194,0.25)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase text-blue-200">Docker + Portal</p>
                <h3 className="text-2xl font-semibold text-white">AMPNM hybrid monitoring</h3>
              </div>
              <span className="glow-pill"><Zap className="w-4 h-4" /> Fast setup</span>
            </div>
            <p className="text-gray-200">Pair the Docker app with this portal to visualize nodes, renew licenses, and automate alerts.</p>
            <div className="flex gap-3 text-gray-100 text-sm">
              <span className="glow-pill subtle"><Cloud className="w-3 h-3" /> Cloud optimized</span>
              <span className="glow-pill subtle"><Network className="w-3 h-3" /> Multi-site</span>
            </div>
          </div>
        </div>
      </div>

      {Object.entries(grouped).map(([category, prods]) => {
        const Icon = categoryIcons[category] || Package;
        return (
          <div key={category} className="mb-12">
            <div className="flex flex-col items-center mb-6 space-y-3">
              <div className="category-chip"><Icon className="w-4 h-4 mr-2" />{category}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(prods as any[]).map(product => (
                <div key={product.id} className="glass-card flex flex-col justify-between p-6 hover:translate-y-[-10px] transition-transform">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{product.name}</h3>
                        <p className="text-gray-200 text-sm">{product.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-gray-100 text-sm">
                      <span className="meta-pill">{product.max_devices === 99999 ? 'Unlimited' : `${product.max_devices} devices`}</span>
                      {product.license_duration_days && (
                        <span className="meta-pill">{Math.round(product.license_duration_days / 365)} year</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-600 flex items-center justify-between">
                    <p className="text-3xl font-bold text-blue-300">${Number(product.price).toFixed(2)}</p>
                    <button onClick={() => handleAdd(product)} className="btn-glass-primary">
                      <ShoppingCart className="w-4 h-4 mr-2" />Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {products.length === 0 && (
        <p className="text-center text-gray-200">No products available at the moment. Please check back later!</p>
      )}
    </div>
  );
};

export default Products;
