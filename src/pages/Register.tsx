import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, firstName, lastName);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Registration successful! Please check your email to verify your account, then login.');
    }
  };

  return (
    <div className="page-content min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 gap-6 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      <div className="glass-card p-10 space-y-6 form-fade-in">
        <div className="flex items-center justify-between mb-4">
          <span className="accent-badge"><UserPlus className="w-4 h-4" /> New to AMPNM</span>
          <Link to="/login" className="text-sm text-blue-200 hover:underline">Already registered?</Link>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
        <p className="text-gray-300">Register to receive a free starter license, manage devices, and request support.</p>

        {error && <div className="alert-glass-error">{error}</div>}
        {success && <div className="alert-glass-success">{success}</div>}

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">First Name</label>
              <input type="text" required className="form-glass-input" placeholder="First Name"
                value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Last Name</label>
              <input type="text" required className="form-glass-input" placeholder="Last Name"
                value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Email address</label>
            <input type="email" required className="form-glass-input" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Password</label>
              <input type="password" required className="form-glass-input" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">Confirm Password</label>
              <input type="password" required className="form-glass-input" placeholder="••••••••"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-glass-primary w-full">
            <UserPlus className="w-4 h-4 mr-2" />{loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>

      <div className="glass-card p-10 space-y-4">
        <h2 className="text-2xl font-semibold text-white">What you get</h2>
        <p className="text-gray-300">A polished onboarding with automatic free license provisioning.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-200">
          <div className="glass-card p-4">
            <p className="text-sm uppercase text-blue-200">Free Tier</p>
            <p className="text-lg font-semibold">Instant starter license.</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm uppercase text-blue-200">Guided Setup</p>
            <p className="text-lg font-semibold">Docker install tips inside the portal.</p>
          </div>
        </div>
        <ul className="text-gray-200 space-y-2 list-disc list-inside">
          <li>Responsive cards tuned for modern devices.</li>
          <li>Accessible labels and focus styling on every input.</li>
          <li>Consistent gradients across portal and admin panels.</li>
        </ul>
      </div>
    </div>
  );
};

export default Register;
