import { Link } from "react-router-dom";
import { Shield, Zap, Smartphone, Headphones, Download, LifeBuoy } from "lucide-react";

const Index = () => {
  return (
    <div className="page-content">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="animated-grid" />
          <div className="glass-card text-center py-16 px-6 mb-10 tilt-card">
            <div className="tilt-inner relative">
              <span className="accent-badge mx-auto">
                <Zap className="w-4 h-4" />
                Live Network Visibility
              </span>
              <h1 className="hero-title text-5xl md:text-6xl font-extrabold text-white mt-6 mb-4">
                AMPNM Portal for Real-Time Monitoring
              </h1>
              <p className="hero-subtitle text-xl text-gray-200 mb-8 leading-relaxed">
                Manage Docker AMPNM licenses, track infrastructure health, and unlock premium support from one modern control panel.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 items-center">
                <Link to="/products" className="btn-glass-primary text-lg px-8">
                  <Download className="w-5 h-5 mr-2" />
                  Browse Licenses
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

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="glass-card text-center p-6 tilt-card">
            <div className="tilt-inner">
              <div className="feature-icon mb-4 mx-auto w-fit">
                <Shield className="w-8 h-8 text-blue-200" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-white">Secure Licensing</h2>
              <p className="text-gray-200">Genuine keys, encrypted delivery, and verified activation for every AMPNM deployment.</p>
            </div>
          </div>
          <div className="glass-card text-center p-6 tilt-card">
            <div className="tilt-inner">
              <div className="feature-icon mb-4 mx-auto w-fit">
                <Smartphone className="w-8 h-8 text-green-200" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-white">Mobile-Ready Portal</h2>
              <p className="text-gray-200">Responsive dashboards, thumb-friendly actions, and clean layouts for on-the-go visibility.</p>
            </div>
          </div>
          <div className="glass-card text-center p-6 tilt-card">
            <div className="tilt-inner">
              <div className="feature-icon mb-4 mx-auto w-fit">
                <Headphones className="w-8 h-8 text-purple-200" />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-white">Dedicated Support</h2>
              <p className="text-gray-200">Direct access to our support engineers, ticket follow-ups, and deployment best practices.</p>
            </div>
          </div>
        </div>

        {/* Info sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          <div className="glass-card p-8 tilt-card">
            <div className="tilt-inner space-y-4">
              <h3 className="section-heading text-white">Docker AMPNM Advantage</h3>
              <p className="text-gray-200 leading-relaxed">
                Install the AMPNM Docker app directly from the portal and keep your network probes updated effortlessly. Automated license syncing ensures your deployment stays authorized without extra steps.
              </p>
              <ul className="text-gray-200 space-y-2 list-disc list-inside">
                <li>One-click license downloads for Docker AMPNM.</li>
                <li>Versioned builds with changelogs for quick rollbacks.</li>
                <li>Role-based access to invite teammates securely.</li>
              </ul>
              <Link to="/products" className="btn-glass-primary inline-flex items-center mt-2">
                <Download className="w-4 h-4 mr-2" />
                Download Docker Package
              </Link>
            </div>
          </div>
          <div className="glass-card p-8 tilt-card">
            <div className="tilt-inner space-y-4">
              <h3 className="section-heading text-white">Stay License-Compliant</h3>
              <p className="text-gray-200 leading-relaxed">
                Track activations, expiry dates, and device limits from a consolidated dashboard. The portal highlights upcoming renewals and lets you extend coverage instantly.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-200">
                <div className="glass-card p-4">
                  <p className="text-sm uppercase text-blue-200">Visibility</p>
                  <p className="text-3xl font-bold text-white">Real-time</p>
                  <p className="text-sm text-gray-300">Status sync with your AMPNM nodes.</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-sm uppercase text-blue-200">Coverage</p>
                  <p className="text-3xl font-bold text-white">10+ tiers</p>
                  <p className="text-sm text-gray-300">Flexible options for any footprint.</p>
                </div>
              </div>
              <Link to="/support" className="btn-glass-secondary inline-flex items-center text-white border border-blue-400">
                <LifeBuoy className="w-4 h-4 mr-2" />
                Talk to Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
