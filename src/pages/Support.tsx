import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, MessageCircle, ArrowLeft, Ticket } from 'lucide-react';
import { toast } from 'sonner';

const Support = () => {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase.from('support_tickets').select('*').eq('customer_id', user.id).order('updated_at', { ascending: false });
    setTickets(data || []);
  };

  const fetchReplies = async (ticketId: string) => {
    const { data } = await supabase.from('ticket_replies').select('*').eq('ticket_id', ticketId).order('created_at');
    setReplies(data || []);
  };

  useEffect(() => { fetchTickets(); }, [user]);

  const openTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    await fetchReplies(ticket.id);
  };

  const handleNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('support_tickets').insert({ customer_id: user.id, subject, message });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('Ticket submitted!'); setSubject(''); setMessage(''); fetchTickets(); }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket) return;
    setLoading(true);
    const { error } = await supabase.from('ticket_replies').insert({
      ticket_id: selectedTicket.id, sender_id: user.id, sender_type: 'customer', message: replyContent,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('Reply sent!'); setReplyContent(''); fetchReplies(selectedTicket.id); }
  };

  if (selectedTicket) {
    return (
      <div className="page-content max-w-3xl mx-auto px-4 py-8">
        <div className="glass-card p-8 mb-8">
          <div className="flex justify-between items-center mb-4 border-b border-gray-600 pb-4">
            <h2 className="text-2xl font-semibold text-white">#{selectedTicket.id.slice(0, 8)}: {selectedTicket.subject}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${selectedTicket.status === 'open' ? 'bg-blue-500' : selectedTicket.status === 'in progress' ? 'bg-yellow-500' : 'bg-green-500'}`}>
              {selectedTicket.status}
            </span>
          </div>
          <div className="space-y-4 mb-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-300 text-sm mb-2"><strong>{profile?.first_name || 'You'}</strong> · {new Date(selectedTicket.created_at).toLocaleString()}</p>
              <p className="text-white whitespace-pre-wrap">{selectedTicket.message}</p>
            </div>
            {replies.map(reply => (
              <div key={reply.id} className={`p-4 rounded-lg ${reply.sender_type === 'customer' ? 'bg-blue-900/30 ml-8' : 'bg-gray-700/50 mr-8'}`}>
                <p className="text-gray-300 text-sm mb-2"><strong>{reply.sender_type === 'customer' ? 'You' : 'Admin'}</strong> · {new Date(reply.created_at).toLocaleString()}</p>
                <p className="text-white whitespace-pre-wrap">{reply.message}</p>
              </div>
            ))}
          </div>
          {selectedTicket.status !== 'closed' && (
            <form onSubmit={handleReply} className="glass-card p-6 space-y-4">
              <h3 className="text-xl font-semibold text-white">Add a Reply</h3>
              <textarea required rows={4} className="form-glass-input" value={replyContent} onChange={e => setReplyContent(e.target.value)} />
              <button type="submit" disabled={loading} className="btn-glass-primary w-full">
                <Send className="w-4 h-4 mr-2" />{loading ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          )}
          <div className="text-center mt-8">
            <button onClick={() => setSelectedTicket(null)} className="btn-glass-secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to All Tickets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Support Tickets</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 glass-card p-6 h-fit">
          <h2 className="text-2xl font-semibold text-white mb-4">Submit New Ticket</h2>
          <form onSubmit={handleNewTicket} className="space-y-4">
            <div>
              <label className="block text-gray-200 text-sm font-bold mb-2">Subject:</label>
              <input type="text" required className="form-glass-input" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div>
              <label className="block text-gray-200 text-sm font-bold mb-2">Message:</label>
              <textarea required rows={5} className="form-glass-input" value={message} onChange={e => setMessage(e.target.value)} />
            </div>
            <button type="submit" disabled={loading} className="btn-glass-primary w-full">
              <Send className="w-4 h-4 mr-2" />{loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">My Tickets</h2>
          {tickets.length === 0 ? (
            <div className="text-center py-8 text-gray-200">
              <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-xl">No support tickets yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map(ticket => (
                <button key={ticket.id} onClick={() => openTicket(ticket)} className="block w-full text-left glass-card p-4 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-white">#{ticket.id.slice(0, 8)}: {ticket.subject}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${ticket.status === 'open' ? 'bg-blue-500' : ticket.status === 'in progress' ? 'bg-yellow-500' : 'bg-green-500'}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm">Updated: {new Date(ticket.updated_at).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
