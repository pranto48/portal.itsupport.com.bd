import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Send } from 'lucide-react';

const Payment = () => {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    const status = total === 0 ? 'completed' : 'pending_approval';
    const method = total === 0 ? 'free' : paymentMethod;

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      customer_id: user.id,
      total_amount: total,
      status,
      payment_method: method,
      transaction_id: transactionId || null,
      sender_number: senderNumber || null,
    }).select().single();

    if (orderErr || !order) {
      setError(orderErr?.message || 'Failed to create order');
      setLoading(false);
      return;
    }

    for (const item of items) {
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      });
    }

    clearCart();
    setLoading(false);
    navigate(`/dashboard?${status === 'completed' ? 'order_success' : 'order_pending'}=1`);
  };

  return (
    <div className="page-content max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Checkout</h1>

      {error && <div className="alert-glass-error mb-4">{error}</div>}

      <div className="glass-card p-8">
        <h2 className="text-2xl font-semibold text-white mb-4">Order Details</h2>
        <div className="space-y-3 mb-6">
          {items.map(item => (
            <div key={item.product_id} className="flex justify-between items-center border-b border-gray-600 pb-2 text-gray-200">
              <span className="text-lg">{item.name}</span>
              <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xl font-bold mb-6 border-t border-gray-600 pt-4 text-white">
          <span>Total Amount:</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {total === 0 ? (
          <form onSubmit={handleSubmit}>
            <div className="alert-glass-success mb-6">
              <p className="font-bold">Free License Checkout</p>
              <p className="text-sm">Your total is $0. Click "Confirm Order" to receive your free license immediately.</p>
            </div>
            <button type="submit" disabled={loading} className="btn-glass-primary w-full">
              <CheckCircle className="w-4 h-4 mr-2" />{loading ? 'Processing...' : 'Confirm Order (Free)'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-600">
              <h4 className="text-lg font-medium text-white mb-2">Manual Payment (Bkash, Rocket, Nagad)</h4>
              <p className="text-gray-300 mb-3">Transfer ${total.toFixed(2)} to one of the following numbers:</p>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div className="bg-pink-800/30 p-3 rounded-lg">
                  <strong className="text-pink-300">Bkash</strong>
                  <p className="font-mono text-sm text-white">01915822266</p>
                </div>
                <div className="bg-red-800/30 p-3 rounded-lg">
                  <strong className="text-red-300">Rocket</strong>
                  <p className="font-mono text-sm text-white">019158222660</p>
                </div>
                <div className="bg-purple-800/30 p-3 rounded-lg">
                  <strong className="text-purple-300">Nagad</strong>
                  <p className="font-mono text-sm text-white">01915822266</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-200 text-sm font-bold mb-2">Payment Method:</label>
                  <select required value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="form-glass-input">
                    <option value="">-- Select --</option>
                    <option value="bkash">Bkash</option>
                    <option value="rocket">Rocket</option>
                    <option value="nagad">Nagad</option>
                    <option value="buymeacoffee">Buy Me A Coffee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-200 text-sm font-bold mb-2">Transaction ID:</label>
                  <input type="text" required className="form-glass-input" placeholder="Enter Transaction ID"
                    value={transactionId} onChange={e => setTransactionId(e.target.value)} />
                </div>
                <div>
                  <label className="block text-gray-200 text-sm font-bold mb-2">Sender Number (Optional):</label>
                  <input type="text" className="form-glass-input" placeholder="01XXXXXXXXX"
                    value={senderNumber} onChange={e => setSenderNumber(e.target.value)} />
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-glass-primary w-full">
              <Send className="w-4 h-4 mr-2" />{loading ? 'Processing...' : 'Confirm Manual Payment'}
            </button>
            <p className="text-xs text-gray-400 text-center">Your order will be marked as 'Pending Approval' until an admin verifies the payment.</p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Payment;
