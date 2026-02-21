import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Shield, Zap, Smartphone, Headphones, Download, LifeBuoy, Network,
  Monitor, Cloud, Database, BarChart3, Calendar, CheckSquare, FileText,
  Target, Wallet, Users, Ticket, FolderKanban, Settings, ChevronLeft, ChevronRight
} from "lucide-react";

import lifeosDashboard from '@/assets/lifeos-dashboard.png';
import lifeosCalendar from '@/assets/lifeos-calendar.png';
import lifeosTasks from '@/assets/lifeos-tasks.png';
import lifeosNotes from '@/assets/lifeos-notes.png';
import lifeosDevices from '@/assets/lifeos-devices.png';
import lifeosGoals from '@/assets/lifeos-goals.png';
import lifeosProjects from '@/assets/lifeos-projects.png';
import lifeosTickets from '@/assets/lifeos-tickets.png';
import lifeosSettings from '@/assets/lifeos-settings.png';

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

const ampnmHighlights = [
  { icon: Network, label: 'Network Mapping' },
  { icon: Monitor, label: 'Device Monitoring' },
  { icon: Shield, label: 'Alert System' },
  { icon: Cloud, label: 'Multi-Site' },
  { icon: Database, label: 'SNMP Discovery' },
  { icon: BarChart3, label: 'Reports' },
];

const lifeosHighlights = [
  { icon: CheckSquare, label: 'Tasks' },
  { icon: Calendar, label: 'Calendar' },
  { icon: Wallet, label: 'Budget' },
  { icon: Target, label: 'Goals' },
  { icon: FileText, label: 'Notes' },
  { icon: Users, label: 'Family' },
  { icon: Monitor, label: 'Devices' },
  { icon: Ticket, label: 'Tickets' },
];

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % lifeosScreenshots.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="page-content">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="animated-grid" />
          <div className="glass-card text-center py-16 px-6 tilt-card">
            <div className="tilt-inner relative">
              <span className="accent-badge mx-auto">
                <Zap className="w-4 h-4" />
                ITSupport BD Software Portal
              </span>
              <h1 className="hero-title text-5xl md:text-6xl font-extrabold text-white mt-6 mb-4">
                AMPNM &amp; LifeOS
              </h1>
              <p className="hero-subtitle text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto">
                Two powerful products — real-time network monitoring with <strong className="text-blue-300">AMPNM</strong> and comprehensive personal life management with <strong className="text-emerald-300">LifeOS</strong>. Licensed, secure, and ready to deploy.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 items-center">
                <Link to="/products" className="btn-glass-primary text-lg px-8">
                  <Download className="w-5 h-5 mr-2" />
                  Browse Products
                </Link>
                <Link to="/register" className="btn-glass-secondary text-lg px-8 border border-blue-400">
                  <Shield className="w-5 h-5 mr-2" />
                  Start Free Account
                </Link>
              </div>
              <div className="floating-orb one" />
              <div className="floating-orb two" />
            </div>
          </div>
        </div>

        {/* ═══════════ AMPNM Product Section ═══════════ */}
        <section>
          <div className="flex flex-col items-center mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-full px-5 py-2 text-sm font-semibold">
              <Network className="w-5 h-5" /> AMPNM — Advanced Network Monitoring
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 tilt-card">
              <div className="tilt-inner space-y-4">
                <h3 className="section-heading text-white">Docker-Based Network Monitoring</h3>
                <p className="text-gray-200 leading-relaxed">
                  Deploy AMPNM in Docker containers for real-time network topology visualization, multi-site monitoring, SNMP auto-discovery, and instant failure alerts — all managed from this portal.
                </p>
                <ul className="text-gray-200 space-y-2 list-disc list-inside">
                  <li>Visual topology maps with live device status</li>
                  <li>Real-time ping, SNMP, and port monitoring</li>
                  <li>Multi-site support from a single dashboard</li>
                  <li>Automated license syncing and renewal tracking</li>
                </ul>
                <Link to="/products" className="btn-glass-primary inline-flex items-center mt-2">
                  <Download className="w-4 h-4 mr-2" />
                  View AMPNM Plans
                </Link>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="grid grid-cols-3 gap-4">
                {ampnmHighlights.map(h => (
                  <div key={h.label} className="text-center space-y-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <h.icon className="w-7 h-7 text-blue-400 mx-auto" />
                    <p className="text-white text-sm font-medium">{h.label}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="glass-card p-4 text-center">
                  <p className="text-sm uppercase text-blue-200">Status</p>
                  <p className="text-3xl font-bold text-white">Real-time</p>
                  <p className="text-sm text-gray-300">Live node sync</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-sm uppercase text-blue-200">Coverage</p>
                  <p className="text-3xl font-bold text-white">10+ tiers</p>
                  <p className="text-sm text-gray-300">Flexible licensing</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ LifeOS Product Section ═══════════ */}
        <section>
          <div className="flex flex-col items-center mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full px-5 py-2 text-sm font-semibold">
              <Zap className="w-5 h-5" /> LifeOS — Personal Life Management
            </div>
          </div>

          {/* Screenshot Carousel */}
          <div className="glass-card !p-0 overflow-hidden mb-8 relative group">
            <div className="relative aspect-video">
              <img
                src={lifeosScreenshots[currentSlide].src}
                alt={lifeosScreenshots[currentSlide].label}
                className="w-full h-full object-cover object-top transition-opacity duration-500"
                loading="lazy"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-8 tilt-card">
              <div className="tilt-inner space-y-4">
                <h3 className="section-heading text-white">All-in-One Life Management</h3>
                <p className="text-gray-200 leading-relaxed">
                  A comprehensive personal and office management system built with React, TypeScript, and Supabase. Tasks, Calendar, Budget, Goals, Notes, Family Management, Device Inventory, Support Tickets, Projects — all in one system.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['React 18', 'TypeScript', 'Tailwind CSS', 'Supabase', 'Docker', 'Kubernetes'].map(tech => (
                    <span key={tech} className="glow-pill subtle text-xs">{tech}</span>
                  ))}
                </div>
                <Link to="/products" className="btn-glass-primary inline-flex items-center mt-2">
                  <Download className="w-4 h-4 mr-2" />
                  View LifeOS Plans
                </Link>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="grid grid-cols-4 gap-3">
                {lifeosHighlights.map(h => (
                  <div key={h.label} className="text-center space-y-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <h.icon className="w-6 h-6 text-emerald-400 mx-auto" />
                    <p className="text-white text-xs font-medium">{h.label}</p>
                  </div>
                ))}
              </div>
              <ul className="text-gray-200 space-y-2 list-disc list-inside mt-5 text-sm">
                <li>Self-hosted with Docker or deploy to cloud</li>
                <li>Google & Outlook calendar sync</li>
                <li>Device inventory with warranty tracking</li>
                <li>Full backup, restore, and data export</li>
                <li>Office & Personal mode switching</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Bottom feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card text-center p-6 tilt-card">
            <div className="tilt-inner">
              <div className="feature-icon mb-4 mx-auto w-fit">
                <Shield className="w-8 h-8 text-blue-200" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-white">Secure Licensing</h2>
              <p className="text-gray-200">Genuine keys, encrypted delivery, and verified activation for every deployment.</p>
            </div>
          </div>
          <div className="glass-card text-center p-6 tilt-card">
            <div className="tilt-inner">
              <div className="feature-icon mb-4 mx-auto w-fit">
                <Smartphone className="w-8 h-8 text-green-200" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-white">Mobile-Ready Portal</h2>
              <p className="text-gray-200">Responsive dashboards, thumb-friendly actions, and clean layouts on any device.</p>
            </div>
          </div>
          <div className="glass-card text-center p-6 tilt-card">
            <div className="tilt-inner">
              <div className="feature-icon mb-4 mx-auto w-fit">
                <Headphones className="w-8 h-8 text-purple-200" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-white">Dedicated Support</h2>
              <p className="text-gray-200">Direct access to our engineers, ticket follow-ups, and deployment guidance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
