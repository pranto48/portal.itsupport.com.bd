import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Save, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { user, profile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setAddress(profile.address || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      first_name: firstName, last_name: lastName, address, phone, avatar_url: avatarUrl || null,
    }).eq('user_id', user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Profile updated!');
  };

  return (
    <div className="page-content max-w-5xl mx-auto px-4 py-8">
      <div className="glass-card p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <span className="accent-badge"><UserCircle className="w-4 h-4" /> Profile Center</span>
            <h1 className="text-4xl font-bold text-white mt-3">My Profile</h1>
            <p className="text-gray-300">Update your details to keep AMPNM notifications aligned.</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-sm uppercase text-blue-200">Portal Identity</p>
            <p className="text-lg font-semibold text-white">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-4 mb-6">
            <img src={avatarUrl || `https://www.gravatar.com/avatar/${user?.email ? btoa(user.email) : ''}?d=identicon`}
              alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-blue-400" loading="lazy" />
            <div className="flex-1">
              <label className="block text-gray-200 text-sm font-bold mb-2">Avatar URL (Optional):</label>
              <input type="url" className="form-glass-input" placeholder="https://example.com/avatar.jpg"
                value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-200 text-sm font-bold mb-2">First Name:</label>
              <input type="text" required className="form-glass-input" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <label className="block text-gray-200 text-sm font-bold mb-2">Last Name:</label>
              <input type="text" required className="form-glass-input" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-gray-200 text-sm font-bold mb-2">Email (Cannot be changed):</label>
            <input type="email" className="form-glass-input bg-gray-700 cursor-not-allowed" value={user?.email || ''} readOnly />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-200 text-sm font-bold mb-2">Address (Optional):</label>
              <input type="text" className="form-glass-input" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div>
              <label className="block text-gray-200 text-sm font-bold mb-2">Phone (Optional):</label>
              <input type="tel" className="form-glass-input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-glass-primary w-full">
            <Save className="w-4 h-4 mr-2" />{loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
