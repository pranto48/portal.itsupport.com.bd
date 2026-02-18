import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Key } from 'lucide-react';
import { toast } from 'sonner';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('Password changed!'); setNewPassword(''); setConfirmPassword(''); }
  };

  return (
    <div className="page-content max-w-md mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Change Your Password</h1>
      <div className="glass-card p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-200 text-sm font-bold mb-2">New Password:</label>
            <input type="password" required className="form-glass-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-200 text-sm font-bold mb-2">Confirm New Password:</label>
            <input type="password" required className="form-glass-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn-glass-primary w-full">
            <Key className="w-4 h-4 mr-2" />{loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
