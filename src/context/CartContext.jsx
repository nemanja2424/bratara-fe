'use client';

import { createContext, useContext } from 'react';
import { useCart } from '@/hooks/useCart';

const CartContext = createContext(undefined);

export function CartProvider({ children }) {
  const cart = useCart();

  return (
    <CartContext.Provider value={cart}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext mora biti korišćen unutar CartProvider-a');
  }
  return context;
}
