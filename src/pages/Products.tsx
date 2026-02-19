import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import {
  ShoppingCart, Shield, Smartphone, Zap, Package, Cloud, Network,
  Calendar, CheckSquare, FileText, Target, BarChart3, Wallet,
  Users, Database, Monitor, Ticket, FolderKanban, Settings, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Quote } from 'lucide-react';

const ampnmTestimonials = [
  { name: 'Rafiq Hasan', role: 'IT Manager, Garments Ltd.', text: 'AMPNM transformed how we monitor our factory network. We now catch outages before they affect production.' },
  { name: 'Sharmin Akter', role: 'Network Engineer, ISP Co.', text: 'The real-time topology map is a game-changer. Multi-site monitoring from one dashboard saves us hours every week.' },
  { name: 'Tanvir Ahmed', role: 'Sysadmin, EduTech BD', text: 'Easy Docker setup and automatic SNMP discovery made deployment effortless across our 3 campus locations.' },
];

const lifeosTestimonials = [
  { name: 'Arif Mahmud', role: 'IT Professional', text: 'LifeOS replaced 5 different apps for me — tasks, notes, budgets, and device tracking all in one beautiful interface.' },
  { name: 'Nusrat Jahan', role: 'Project Manager', text: 'The calendar sync with Google and the goal-tracking milestones keep my entire team aligned. Best productivity tool we\'ve used.' },
  { name: 'Kamal Uddin', role: 'Small Business Owner', text: 'Self-hosted on my own server with Docker. Full control of my data, and the backup & restore feature gives me peace of mind.' },
];

import lifeosCalendar from '@/assets/lifeos-calendar.png';
import lifeosDashboard from '@/assets/lifeos-dashboard.png';
import lifeosTasks from '@/assets/lifeos-tasks.png';
import lifeosNotes from '@/assets/lifeos-notes.png';
import lifeosDevices from '@/assets/lifeos-devices.png';
import lifeosGoals from '@/assets/lifeos-goals.png';
import lifeosProjects from '@/assets/lifeos-projects.png';
import lifeosTickets from '@/assets/lifeos-tickets.png';
import lifeosSettings from '@/assets/lifeos-settings.png';

import ampnmMap from '@/assets/ampnm-map.png';
import ampnmDashboard from '@/assets/ampnm-dashboard.png';
import ampnmDevicesImg from '@/assets/ampnm-devices.png';
import ampnmPingHistory from '@/assets/ampnm-ping-history.png';
import ampnmDocs from '@/assets/ampnm-docs.png';

const lifeosScreenshots = [
  { src: lifeosDashboard, label: 'Customizable Dashboard' },
  { src: lifeosCalendar, label: 'Calendar with Google & Outlook Sync' },
  { src: lifeosTasks, label: 'Task Management' },
  { src: lifeosNotes, label: 'Notes' },
  { src: lifeosDevices, label: 'Device Inventory' },
  { src: lifeosGoals, label: 'Goals & Plans' },
  { src: lifeosProjects, label: 'Projects' },
  { src: lifeosTickets, label: 'Support Tickets' },
  { src: lifeosSettings, label: 'Backup & Restore' },
];

const lifeosFeatures = [
  { icon: CheckSquare, label: 'Task Management', desc: 'Create, assign, and track tasks with priorities' },
  { icon: Calendar, label: 'Calendar Sync', desc: 'Google & Outlook calendar integration' },
  { icon: Wallet, label: 'Budget Tracking', desc: 'Income, expenses, and budgets' },
  { icon: Target, label: 'Goals & Plans', desc: 'Set and track personal goals with milestones' },
  { icon: FileText, label: 'Secure Notes', desc: 'Note-taking with vault protection' },
  { icon: Users, label: 'Family Management', desc: 'Track family members, events, and documents' },
  { icon: BarChart3, label: 'Habits & Analytics', desc: 'Build and track daily habits' },
  { icon: Monitor, label: 'Device Inventory', desc: 'Full IT asset management with warranty tracking' },
  { icon: Ticket, label: 'Support Tickets', desc: 'Built-in ticket system with categories' },
  { icon: FolderKanban, label: 'Projects', desc: 'Project ideas with milestones and progress' },
  { icon: Database, label: 'Backup & Restore', desc: 'Full database backup, export JSON/CSV/PDF' },
  { icon: Settings, label: 'Self-Hosted', desc: 'Docker, Kubernetes, or cloud deployment' },
];

const ampnmScreenshots = [
  { src: ampnmDashboard, label: 'Real-time Dashboard' },
  { src: ampnmMap, label: 'Network Topology Map' },
  { src: ampnmDevicesImg, label: 'Device Inventory' },
  { src: ampnmPingHistory, label: 'Ping History & Analytics' },
  { src: ampnmDocs, label: 'Documentation & Setup Guide' },
];

const ampnmFeatures = [
  { icon: Network, label: 'Network Mapping', desc: 'Visual topology with live device status' },
  { icon: Monitor, label: 'Device Monitoring', desc: 'Real-time ping, SNMP, and port checks' },
  { icon: Shield, label: 'Alert System', desc: 'Instant notifications on failures' },
  { icon: Cloud, label: 'Multi-Site', desc: 'Monitor multiple locations from one portal' },
  { icon: Database, label: 'SNMP Discovery', desc: 'Auto-discover network devices' },
  { icon: BarChart3, label: 'Reports', desc: 'Uptime, latency, and health reports' },
];

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [ampnmSlide, setAmpnmSlide] = useState(0);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('products').select('*').eq('is_active', true).order('category').order('price')
      .then(({ data }) => setProducts(data || []));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % lifeosScreenshots.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setAmpnmSlide(prev => (prev + 1) % ampnmScreenshots.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const ampnmProducts = products.filter(p => p.category === 'AMPNM');
  const lifeosProducts = products.filter(p => p.category === 'LifeOS');
  const otherProducts = products.filter(p => p.category !== 'AMPNM' && p.category !== 'LifeOS');

  const handleAdd = (product: any) => {
    addToCart(product);
    toast.success('Added to cart!');
  };

  const ProductCard = ({ product }: { product: any }) => (
    <div className="glass-card flex flex-col justify-between p-6 hover:translate-y-[-10px] transition-transform">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-semibold text-white">{product.name}</h3>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              product.category === 'LifeOS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>{product.category}</span>
          </div>
          <p className="text-gray-200 text-sm">{product.description}</p>
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
  );

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8 space-y-16">
      {/* Hero */}
      <div className="glass-card p-10 relative overflow-hidden">
        <div className="floating-orb one" />
        <div className="floating-orb two" />
        <div className="relative z-10 text-center space-y-3">
          <span className="accent-badge"><Package className="w-4 h-4" /> Product Catalog</span>
          <h1 className="text-4xl font-bold text-white">Software Solutions by ITSupport BD</h1>
          <p className="text-gray-200 max-w-2xl mx-auto">Two powerful products — AMPNM for network monitoring and LifeOS for personal life management. Choose the license that fits your needs.</p>
          <div className="flex flex-wrap justify-center gap-3 text-gray-200 text-sm">
            <span className="meta-pill"><Smartphone className="w-4 h-4" /> Mobile-ready</span>
            <span className="meta-pill"><Shield className="w-4 h-4" /> Secured checkout</span>
            <span className="meta-pill"><Zap className="w-4 h-4" /> Instant delivery</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════ AMPNM Section ═══════════════════ */}
      <section>
        <div className="flex flex-col items-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-full px-5 py-2 text-sm font-semibold">
            <Network className="w-5 h-5" /> AMPNM — Network Monitoring
          </div>
          <p className="text-gray-300 text-center max-w-xl">Advanced Multi-Platform Network Monitoring. Docker-based with portal integration for real-time topology, alerting, and reporting.</p>
        </div>

        {/* AMPNM screenshot carousel */}
        <div className="glass-card !p-0 overflow-hidden mb-8 relative group">
          <div className="relative aspect-video">
            <img
              src={ampnmScreenshots[ampnmSlide].src}
              alt={ampnmScreenshots[ampnmSlide].label}
              className="w-full h-full object-cover object-top transition-opacity duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white font-medium text-center">{ampnmScreenshots[ampnmSlide].label}</p>
            </div>
            <button
              onClick={() => setAmpnmSlide(prev => (prev - 1 + ampnmScreenshots.length) % ampnmScreenshots.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setAmpnmSlide(prev => (prev + 1) % ampnmScreenshots.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-center gap-2 py-3 bg-gray-900/60">
            {ampnmScreenshots.map((_, i) => (
              <button
                key={i}
                onClick={() => setAmpnmSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === ampnmSlide ? 'bg-blue-400 w-6' : 'bg-gray-500 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </div>

        {/* AMPNM features grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {ampnmFeatures.map(f => (
            <div key={f.label} className="glass-card !p-4 text-center space-y-2 hover:translate-y-[-4px]">
              <f.icon className="w-6 h-6 text-blue-400 mx-auto" />
              <p className="text-white text-sm font-medium">{f.label}</p>
              <p className="text-gray-400 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* AMPNM pricing cards */}
        {ampnmProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ampnmProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-center text-gray-400">No AMPNM plans available yet.</p>
        )}

        {/* AMPNM Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {ampnmTestimonials.map(t => (
            <div key={t.name} className="glass-card !p-5 space-y-3 hover:translate-y-[-4px]">
              <Quote className="w-5 h-5 text-blue-400/60" />
              <p className="text-gray-200 text-sm italic leading-relaxed">"{t.text}"</p>
              <div className="pt-2 border-t border-gray-700">
                <p className="text-white text-sm font-semibold">{t.name}</p>
                <p className="text-blue-300 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ LifeOS Section ═══════════════════ */}
      <section>
        <div className="flex flex-col items-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full px-5 py-2 text-sm font-semibold">
            <Zap className="w-5 h-5" /> LifeOS — Personal Life Management System
          </div>
          <p className="text-gray-300 text-center max-w-2xl">
            A comprehensive personal life management application built with React, TypeScript, and Supabase. Tasks, Calendar, Budget, Goals, Notes, Family Management, Device Inventory, and more — all in one system.
          </p>
        </div>

        {/* Screenshot carousel */}
        <div className="glass-card !p-0 overflow-hidden mb-8 relative group">
          <div className="relative aspect-video">
            <img
              src={lifeosScreenshots[currentSlide].src}
              alt={lifeosScreenshots[currentSlide].label}
              className="w-full h-full object-cover object-top transition-opacity duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white font-medium text-center">{lifeosScreenshots[currentSlide].label}</p>
            </div>
            <button
              onClick={() => setCurrentSlide(prev => (prev - 1 + lifeosScreenshots.length) % lifeosScreenshots.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentSlide(prev => (prev + 1) % lifeosScreenshots.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {/* Dot indicators */}
          <div className="flex justify-center gap-2 py-3 bg-gray-900/60">
            {lifeosScreenshots.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-emerald-400 w-6' : 'bg-gray-500 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </div>

        {/* LifeOS features grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {lifeosFeatures.map(f => (
            <div key={f.label} className="glass-card !p-4 text-center space-y-2 hover:translate-y-[-4px]">
              <f.icon className="w-6 h-6 text-emerald-400 mx-auto" />
              <p className="text-white text-sm font-medium">{f.label}</p>
              <p className="text-gray-400 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Tech stack badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {['React 18', 'TypeScript', 'Vite', 'Tailwind CSS', 'shadcn/ui', 'Supabase', 'Docker', 'Kubernetes'].map(tech => (
            <span key={tech} className="glow-pill subtle text-xs">{tech}</span>
          ))}
        </div>

        {/* LifeOS pricing cards */}
        {lifeosProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {lifeosProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-center text-gray-400">No LifeOS plans available yet.</p>
        )}

        {/* LifeOS Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {lifeosTestimonials.map(t => (
            <div key={t.name} className="glass-card !p-5 space-y-3 hover:translate-y-[-4px]">
              <Quote className="w-5 h-5 text-emerald-400/60" />
              <p className="text-gray-200 text-sm italic leading-relaxed">"{t.text}"</p>
              <div className="pt-2 border-t border-gray-700">
                <p className="text-white text-sm font-semibold">{t.name}</p>
                <p className="text-emerald-300 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Other products */}
      {otherProducts.length > 0 && (
        <section>
          <div className="flex flex-col items-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gray-500/15 text-gray-300 border border-gray-500/30 rounded-full px-5 py-2 text-sm font-semibold">
              <Package className="w-5 h-5" /> Other Products
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {products.length === 0 && (
        <p className="text-center text-gray-200">No products available at the moment. Please check back later!</p>
      )}
    </div>
  );
};

export default Products;
