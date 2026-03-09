import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CookieConsent } from "@/components/CookieConsent";
import {
  Shield, Zap, Smartphone, Headphones, Download, Network,
  Monitor, Cloud, Database, BarChart3, Calendar, CheckSquare, FileText,
  Target, Wallet, Users, Ticket, ChevronLeft, ChevronRight, ArrowRight, Star, Rocket,
  Github, Facebook, Twitter, Mail, MapPin, Phone
} from "lucide-react";

import logoImg from '@/assets/logo-itsupportbd.png';
import lifeosDashboard from '@/assets/lifeos-dashboard.png';
import lifeosCalendar from '@/assets/lifeos-calendar.png';
import lifeosTasks from '@/assets/lifeos-tasks.png';
import lifeosNotes from '@/assets/lifeos-notes.png';
import lifeosDevices from '@/assets/lifeos-devices.png';
import lifeosGoals from '@/assets/lifeos-goals.png';
import lifeosProjects from '@/assets/lifeos-projects.png';
import lifeosTickets from '@/assets/lifeos-tickets.png';
import lifeosSettings from '@/assets/lifeos-settings.png';
import ampnmDashboard from '@/assets/ampnm-dashboard.png';
import ampnmDevices from '@/assets/ampnm-devices.png';
import ampnmMap from '@/assets/ampnm-map.png';
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

const ampnmScreenshots = [
  { src: ampnmDashboard, label: 'Real-time Dashboard' },
  { src: ampnmMap, label: 'Network Topology Map' },
  { src: ampnmDevices, label: 'Device Management' },
  { src: ampnmPingHistory, label: 'Ping History & Analytics' },
  { src: ampnmDocs, label: 'Documentation & Guides' },
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

const stats = [
  { value: '500+', label: 'Active Licenses' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
  { value: '10+', label: 'License Tiers' },
];

const testimonials = [
  { name: 'Rahim K.', role: 'IT Manager', text: 'AMPNM transformed our network visibility. We catch issues before users even notice.', rating: 5 },
  { name: 'Fatima S.', role: 'Freelancer', text: 'LifeOS keeps my projects, finances, and goals all in one beautiful dashboard.', rating: 5 },
  { name: 'Tanvir A.', role: 'Sys Admin', text: 'The Docker deployment and license management are seamless. Best investment this year.', rating: 5 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const AnimatedSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const CountUp = ({ target, suffix = '' }: { target: string; suffix?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const numericPart = target.replace(/[^0-9.]/g, '');
  const prefix = target.replace(/[0-9.+%/]/g, '');
  const hasDot = target.includes('.');
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || !numericPart) return;
    const end = parseFloat(numericPart);
    const duration = 1500;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, numericPart]);

  const display = numericPart
    ? `${prefix}${hasDot ? count.toFixed(1) : Math.round(count)}${target.includes('+') ? '+' : ''}${target.includes('%') ? '%' : ''}${target.includes('/') ? target.slice(target.indexOf('/')) : ''}`
    : target;

  return <span ref={ref}>{display}{suffix}</span>;
};

const Index = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [ampnmSlide, setAmpnmSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAmpnmSlide(prev => (prev + 1) % ampnmScreenshots.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const nextSlide = lifeosScreenshots[(currentSlide + 1) % lifeosScreenshots.length];
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = nextSlide.src;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [currentSlide]);

  return (
    <div className="page-content">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20">

        {/* ═══════════ HERO ═══════════ */}
        <div className="relative overflow-hidden">
          <div className="animated-grid" />
          <div className="glass-card text-center py-20 px-6 tilt-card relative">
            <div className="tilt-inner relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex flex-col items-center"
              >
                <img src={logoImg} alt="IT Support BD Logo" className="w-24 h-24 md:w-32 md:h-32 mb-4 object-contain" />
                <span className="accent-badge mx-auto">
                  <Rocket className="w-4 h-4" />
                  ITSupport BD Software Portal
                </span>
              </motion.div>

              <motion.h1
                className="hero-title text-5xl md:text-7xl font-extrabold text-foreground mt-6 mb-4"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
              >
                <span className="bg-gradient-to-r from-blue-400 via-emerald-300 to-blue-400 bg-clip-text text-transparent">
                  AMPNM
                </span>
                {' '}&amp;{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  LifeOS
                </span>
              </motion.h1>

              <motion.p
                className="hero-subtitle text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Real-time network monitoring meets comprehensive life management.
                <br className="hidden md:block" />
                Licensed, secure, and ready to deploy in minutes.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <Link to="/products" className="btn-glass-primary text-lg px-8 group">
                  <Download className="w-5 h-5 mr-2" />
                  Browse Products
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/register" className="btn-glass-secondary text-lg px-8 border border-blue-400/50">
                  <Shield className="w-5 h-5 mr-2" />
                  Start Free Account
                </Link>
              </motion.div>
            </div>
            <div className="floating-orb one" />
            <div className="floating-orb two" />
            <div className="absolute w-32 h-32 rounded-full bg-purple-500/20 blur-3xl top-1/2 left-1/4 animate-pulse" />
          </div>
        </div>

        {/* ═══════════ STATS BAR ═══════════ */}
        <AnimatedSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                custom={i}
                variants={fadeUp}
                className="glass-card p-6 text-center hover:border-emerald-500/40"
              >
                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  <CountUp target={s.value} />
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* ═══════════ AMPNM SECTION ═══════════ */}
        <section>
          <AnimatedSection className="flex flex-col items-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/15 text-blue-400 dark:text-blue-300 border border-blue-500/30 rounded-full px-6 py-2.5 text-sm font-semibold">
              <Network className="w-5 h-5" /> AMPNM — Advanced Network Monitoring
            </div>
            <p className="text-muted-foreground text-center max-w-2xl">Docker-powered network intelligence for modern infrastructure teams</p>
          </AnimatedSection>

          {/* AMPNM Screenshot Carousel */}
          <AnimatedSection>
            <div className="glass-card !p-0 overflow-hidden mb-8 relative group">
              <div className="relative aspect-video">
                <img
                  src={ampnmScreenshots[ampnmSlide].src}
                  alt={ampnmScreenshots[ampnmSlide].label}
                  className="w-full h-full object-cover object-top transition-opacity duration-500"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                  <p className="text-white font-semibold text-lg text-center">{ampnmScreenshots[ampnmSlide].label}</p>
                </div>
                <button
                  onClick={() => setAmpnmSlide(prev => (prev - 1 + ampnmScreenshots.length) % ampnmScreenshots.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setAmpnmSlide(prev => (prev + 1) % ampnmScreenshots.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-center gap-2 py-3 bg-secondary/60">
                {ampnmScreenshots.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setAmpnmSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === ampnmSlide ? 'bg-primary w-6' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'}`}
                  />
                ))}
              </div>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatedSection>
              <div className="glass-card p-8 tilt-card h-full">
                <div className="tilt-inner space-y-5">
                  <h3 className="section-heading text-foreground">Docker-Based Network Monitoring</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Deploy AMPNM in Docker containers for real-time network topology visualization, multi-site monitoring, SNMP auto-discovery, and instant failure alerts — all managed from this portal.
                  </p>
                  <ul className="text-muted-foreground space-y-3">
                    {[
                      'Visual topology maps with live device status',
                      'Real-time ping, SNMP, and port monitoring',
                      'Multi-site support from a single dashboard',
                      'Automated license syncing and renewal tracking',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckSquare className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/products" className="btn-glass-primary inline-flex items-center mt-2">
                    <Download className="w-4 h-4 mr-2" />
                    View AMPNM Plans
                  </Link>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection>
              <div className="glass-card p-6 h-full">
                <div className="grid grid-cols-3 gap-4">
                  {ampnmHighlights.map((h, i) => (
                    <motion.div
                      key={h.label}
                      custom={i}
                      variants={fadeUp}
                      className="text-center space-y-2 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 hover:border-blue-500/25 transition-all duration-300"
                    >
                      <h.icon className="w-7 h-7 text-blue-400 mx-auto" />
                      <p className="text-foreground text-sm font-medium">{h.label}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="glass-card p-5 text-center hover:border-blue-500/40">
                    <p className="text-xs uppercase text-blue-400 dark:text-blue-300 tracking-wider font-semibold">Status</p>
                    <p className="text-3xl font-bold text-foreground mt-1">Real-time</p>
                    <p className="text-sm text-muted-foreground mt-1">Live node sync</p>
                  </div>
                  <div className="glass-card p-5 text-center hover:border-blue-500/40">
                    <p className="text-xs uppercase text-blue-400 dark:text-blue-300 tracking-wider font-semibold">Coverage</p>
                    <p className="text-3xl font-bold text-foreground mt-1">10+ tiers</p>
                    <p className="text-sm text-muted-foreground mt-1">Flexible licensing</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════ LIFEOS SECTION ═══════════ */}
        <section>
          <AnimatedSection className="flex flex-col items-center mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-500 dark:text-emerald-300 border border-emerald-500/30 rounded-full px-6 py-2.5 text-sm font-semibold">
              <Zap className="w-5 h-5" /> LifeOS — Personal Life Management
            </div>
            <p className="text-muted-foreground text-center max-w-2xl">Everything you need to manage your personal and professional life in one place</p>
          </AnimatedSection>

          {/* Screenshot Carousel */}
          <AnimatedSection>
            <div className="glass-card !p-0 overflow-hidden mb-8 relative group">
              <div className="relative aspect-video">
                <img
                  src={lifeosScreenshots[currentSlide].src}
                  alt={lifeosScreenshots[currentSlide].label}
                  className="w-full h-full object-cover object-top transition-opacity duration-500"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                  <p className="text-white font-semibold text-lg text-center">{lifeosScreenshots[currentSlide].label}</p>
                </div>
                <button
                  onClick={() => setCurrentSlide(prev => (prev - 1 + lifeosScreenshots.length) % lifeosScreenshots.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentSlide(prev => (prev + 1) % lifeosScreenshots.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex justify-center gap-2 py-3 bg-secondary/60">
                {lifeosScreenshots.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-emerald-400 w-6' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'}`}
                  />
                ))}
              </div>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AnimatedSection>
              <div className="glass-card p-8 tilt-card h-full">
                <div className="tilt-inner space-y-5">
                  <h3 className="section-heading text-foreground">All-in-One Life Management</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    A comprehensive personal and office management system built with React, TypeScript, and modern cloud infrastructure. Tasks, Calendar, Budget, Goals, Notes, Family Management, Device Inventory, Support Tickets, Projects — all in one system.
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
            </AnimatedSection>
            <AnimatedSection>
              <div className="glass-card p-6 h-full">
                <div className="grid grid-cols-4 gap-3">
                  {lifeosHighlights.map((h, i) => (
                    <motion.div
                      key={h.label}
                      custom={i}
                      variants={fadeUp}
                      className="text-center space-y-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/25 transition-all duration-300"
                    >
                      <h.icon className="w-6 h-6 text-emerald-400 mx-auto" />
                      <p className="text-foreground text-xs font-medium">{h.label}</p>
                    </motion.div>
                  ))}
                </div>
                <ul className="text-muted-foreground space-y-3 mt-5 text-sm">
                  {[
                    'Self-hosted with Docker or deploy to cloud',
                    'Google & Outlook calendar sync',
                    'Device inventory with warranty tracking',
                    'Full backup, restore, and data export',
                    'Office & Personal mode switching',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ═══════════ TESTIMONIALS ═══════════ */}
        <section>
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Trusted by Teams & Individuals</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">See what our users are saying about AMPNM and LifeOS</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <AnimatedSection key={t.name}>
                <motion.div custom={i} variants={fadeUp} className="glass-card p-6 h-full flex flex-col">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic flex-1 leading-relaxed">"{t.text}"</p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-foreground font-semibold text-sm">{t.name}</p>
                    <p className="text-muted-foreground text-xs">{t.role}</p>
                  </div>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </section>

        {/* ═══════════ FEATURE CARDS ═══════════ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Secure Licensing', desc: 'Genuine keys, encrypted delivery, and verified activation for every deployment.', color: 'blue' },
            { icon: Smartphone, title: 'Mobile-Ready Portal', desc: 'Responsive dashboards, thumb-friendly actions, and clean layouts on any device.', color: 'emerald' },
            { icon: Headphones, title: 'Dedicated Support', desc: 'Direct access to our engineers, ticket follow-ups, and deployment guidance.', color: 'purple' },
          ].map((f, i) => (
            <AnimatedSection key={f.title}>
              <motion.div custom={i} variants={fadeUp} className="glass-card text-center p-8 tilt-card h-full">
                <div className="tilt-inner">
                  <div className="feature-icon mb-5 mx-auto w-fit">
                    <f.icon className={`w-8 h-8 ${f.color === 'blue' ? 'text-blue-300' : f.color === 'emerald' ? 'text-emerald-300' : 'text-purple-300'}`} />
                  </div>
                  <h2 className="text-2xl font-semibold mb-3 text-foreground">{f.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* ═══════════ CTA ═══════════ */}
        <AnimatedSection>
          <div className="glass-card text-center py-16 px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-emerald-500/5 to-blue-500/5" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Create your free account today and explore our full range of network monitoring and life management tools.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
                <Link to="/register" className="btn-glass-primary text-lg px-10 group">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/products" className="btn-glass-secondary text-lg px-10">
                  View All Products
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>

      </div>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-border bg-secondary/30 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src={logoImg} alt="IT Support BD" className="w-8 h-8 object-contain" />
                <span className="font-bold text-lg text-foreground">IT Support BD</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Real-time network monitoring &amp; comprehensive life management tools. Licensed, secure, and ready to deploy.
              </p>
              <div className="flex items-center gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Products */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Products</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">AMPNM</Link></li>
                <li><Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">LifeOS</Link></li>
                <li><Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">Pricing &amp; Plans</Link></li>
                <li><Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">License Tiers</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Customer Portal</Link></li>
                <li><Link to="/register" className="text-muted-foreground hover:text-primary transition-colors">Create Account</Link></li>
                <li><a href="mailto:support@itsupport.com.bd" className="text-muted-foreground hover:text-primary transition-colors">Email Support</a></li>
                <li><Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">Submit a Ticket</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Contact</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>support@itsupport.com.bd</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <a href="tel:+8801915822266" className="hover:text-primary transition-colors">+880 1915-822266</a>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>Dhaka, Bangladesh</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-xs">
              &copy; {new Date().getFullYear()} IT Support BD. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="/refund" className="text-muted-foreground hover:text-primary transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
};

export default Index;
