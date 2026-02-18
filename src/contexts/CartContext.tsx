import React, { createContext, useContext, useState } from 'react';

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  max_devices: number;
  license_duration_days: number | null;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: any) => {
    setItems(prev => {
      if (prev.find(i => i.product_id === product.id)) return prev;
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: 1,
        max_devices: product.max_devices,
        license_duration_days: product.license_duration_days,
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.product_id !== productId));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
