import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, LogIn, Lock, Fingerprint } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="admin-circuit" />
      <div className="animated-grid" />
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <div className="admin-card p-10 form-fade-in" style={{ border: '1px solid rgba(80,227,194,0.35)' }}>
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-1">
              <span className="accent-badge"><Shield className="w-4 h-4" /> Admin Console</span>
              <span className="accent-badge"><Lock className="w-4 h-4" /> NOC Only</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-100">Authenticate operations</h1>
              <p className="text-gray-300">Access license orchestration, billing controls, and ticket triage behind a hardened UI.</p>
            </div>

            {error && <div className="alert-admin-error">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-4 space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Email</label>
                <input type="email" required className="form-admin-input" placeholder="admin@itsupport.com.bd"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Password</label>
                <input type="password" required className="form-admin-input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="inline-flex items-center gap-2"><span className="status-dot" /> Session audit enabled</span>
                <span className="inline-flex items-center gap-2"><Fingerprint className="w-4 h-4" /> MFA recommended</span>
              </div>
              <button type="submit" disabled={loading} className="btn-admin-primary w-full">
                <LogIn className="w-4 h-4 mr-2" />{loading ? 'Authenticating...' : 'Enter Admin Panel'}
              </button>
            </form>
          </div>
        </div>

        <div className="admin-card p-10 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Operations brief</h2>
            <span className="accent-badge">⚡ Live</span>
          </div>
          <p className="text-gray-300">Distinct neon cues, darker contrast, and circuit overlays keep the admin surface visually separate from the customer portal.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-gray-200">
            {['Licenses', 'Payments', 'Support'].map(label => (
              <div key={label} className="glass-chip">
                <p className="text-sm uppercase text-blue-200">{label}</p>
                <p className="text-lg font-semibold">{label === 'Licenses' ? 'Renewals & provisioning' : label === 'Payments' ? 'Billing reconciliations' : 'Ticket escalations'}</p>
              </div>
            ))}
          </div>
          <div className="inline-flex items-center gap-3 p-3 rounded-xl text-sm font-semibold text-gray-300" style={{ background: 'rgba(15,23,42,0.6)', border: '1px dashed rgba(80,227,194,0.35)' }}>
            <Lock className="w-4 h-4" /> Backend endpoints are isolated; use admin credentials only.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
