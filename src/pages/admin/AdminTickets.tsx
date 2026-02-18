import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Send, ArrowLeft, Eye } from 'lucide-react';
import { toast } from 'sonner';

const AdminTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const fetchTickets = async () => {
    let q = supabase.from('support_tickets').select('*, profiles!support_tickets_customer_id_fkey(first_name, last_name, email)').order('updated_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setTickets(data || []);
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  const openTicket = async (ticket: any) => {
    setSelected(ticket);
    setNewStatus(ticket.status);
    const { data } = await supabase.from('ticket_replies').select('*').eq('ticket_id', ticket.id).order('created_at');
    setReplies(data || []);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !user) return;
    await supabase.from('ticket_replies').insert({ ticket_id: selected.id, sender_id: user.id, sender_type: 'admin', message: replyContent });
    toast.success('Reply sent!');
    setReplyContent('');
    const { data } = await supabase.from('ticket_replies').select('*').eq('ticket_id', selected.id).order('created_at');
    setReplies(data || []);
  };

  const handleStatusUpdate = async () => {
    if (!selected) return;
    await supabase.from('support_tickets').update({ status: newStatus }).eq('id', selected.id);
    toast.success('Status updated!');
    setSelected({ ...selected, status: newStatus });
    fetchTickets();
  };

  if (selected) {
    const profile = selected.profiles;
    return (
      <div className="page-content max-w-3xl mx-auto px-4 py-8">
        <div className="admin-card p-8">
          <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-4">
            <h2 className="text-2xl font-semibold text-blue-400">#{selected.id.slice(0, 8)}: {selected.subject}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${selected.status === 'open' ? 'bg-blue-500' : selected.status === 'in progress' ? 'bg-yellow-500' : 'bg-green-500'}`}>
              {selected.status}
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-4"><strong>Customer:</strong> {profile?.first_name} {profile?.last_name} ({profile?.email})</p>
          <div className="space-y-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-300 text-sm mb-2"><strong>{profile?.first_name}</strong> · {new Date(selected.created_at).toLocaleString()}</p>
              <p className="text-white whitespace-pre-wrap">{selected.message}</p>
            </div>
            {replies.map(r => (
              <div key={r.id} className={`p-4 rounded-lg ${r.sender_type === 'customer' ? 'bg-gray-800/50 ml-8' : 'bg-blue-900/30 mr-8'}`}>
                <p className="text-gray-300 text-sm mb-2"><strong>{r.sender_type === 'customer' ? 'Customer' : 'Admin'}</strong> · {new Date(r.created_at).toLocaleString()}</p>
                <p className="text-white whitespace-pre-wrap">{r.message}</p>
              </div>
            ))}
          </div>
          <div className="admin-card p-6 mb-4">
            <form onSubmit={handleReply} className="space-y-4">
              <textarea required rows={4} className="form-admin-input" value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Type your reply..." />
              <button type="submit" className="btn-admin-primary w-full"><Send className="w-4 h-4 mr-2" />Send Reply</button>
            </form>
          </div>
          <div className="admin-card p-6 flex items-center gap-4">
            <select className="form-admin-input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="open">Open</option><option value="in progress">In Progress</option><option value="closed">Closed</option>
            </select>
            <button onClick={handleStatusUpdate} className="btn-admin-primary">Update Status</button>
          </div>
          <div className="text-center mt-8">
            <button onClick={() => setSelected(null)} className="btn-admin-secondary"><ArrowLeft className="w-4 h-4 mr-2" />Back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-blue-400 mb-8 text-center">Support Tickets</h1>
      <div className="admin-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-blue-400">All Tickets</h2>
          <div className="flex gap-2">
            {['all', 'open', 'in progress', 'closed'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`btn-admin-primary text-xs px-3 py-1 ${filter === s ? 'opacity-100' : 'opacity-60'}`}>{s === 'all' ? 'All' : s}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 rounded-lg">
            <thead><tr className="bg-gray-600 text-gray-200 uppercase text-sm">
              <th className="py-3 px-4 text-left">Subject</th>
              <th className="py-3 px-4 text-left">Customer</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Updated</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr></thead>
            <tbody className="text-gray-300 text-sm">
              {tickets.map(t => (
                <tr key={t.id} className="border-b border-gray-600 hover:bg-gray-600">
                  <td className="py-3 px-4">{t.subject}</td>
                  <td className="py-3 px-4">{(t.profiles as any)?.first_name} {(t.profiles as any)?.last_name}</td>
                  <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs ${t.status === 'open' ? 'bg-blue-500' : t.status === 'in progress' ? 'bg-yellow-500' : 'bg-green-500'}`}>{t.status}</span></td>
                  <td className="py-3 px-4">{new Date(t.updated_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center"><button onClick={() => openTicket(t)} className="btn-admin-primary text-xs px-3 py-1"><Eye className="w-3 h-3 mr-1" />View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTickets;
