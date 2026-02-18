import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Trash2, FileText } from 'lucide-react';

const Cart = () => {
  const { items, removeFromCart, total } = useCart();

  return (
    <div className="page-content max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-8 text-center">Your Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="glass-card text-center py-8">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-200">Your cart is empty.</p>
          <Link to="/products" className="btn-glass-secondary mt-4 inline-block">Continue Shopping</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.product_id} className="glass-card flex items-center justify-between p-6">
                <div className="flex items-center space-x-4">
                  <FileText className="w-10 h-10 text-blue-300" />
                  <div>
                    <h2 className="text-xl font-semibold text-white">{item.name}</h2>
                    <p className="text-gray-200">Price: ${item.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-lg font-bold text-white">${(item.price * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="glass-card p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Order Summary</h2>
            <div className="flex justify-between text-lg mb-2 text-gray-200">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold mb-6 border-t border-gray-600 pt-4 text-white">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Link to="/payment" className="btn-glass-primary w-full text-center">Proceed to Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
