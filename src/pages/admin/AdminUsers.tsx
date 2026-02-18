import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setUsers(data || []));
  }, []);

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">Manage Customers</h1>
      <div className="admin-card p-6">
        {users.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No customers registered yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-700 rounded-lg">
              <thead>
                <tr className="bg-gray-600 text-gray-200 uppercase text-sm">
                  <th className="py-3 px-6 text-left">Name</th>
                  <th className="py-3 px-6 text-left">Email</th>
                  <th className="py-3 px-6 text-left">Phone</th>
                  <th className="py-3 px-6 text-left">Registered</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 text-sm">
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-600 hover:bg-gray-600">
                    <td className="py-3 px-6">{u.first_name} {u.last_name}</td>
                    <td className="py-3 px-6">{u.email}</td>
                    <td className="py-3 px-6">{u.phone || 'N/A'}</td>
                    <td className="py-3 px-6">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
