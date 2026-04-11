'use client';

import { useState } from 'react';
import { useCartContext } from '@/context/CartContext';
import CartModal from './CartModal';
import styles from './cart.module.css';

export default function CartButton() {
  const { totalQuantity, isMounted } = useCartContext();
  const [isOpen, setIsOpen] = useState(false);

  if (!isMounted) return null;

  return (
    <div className={styles.cartContainer}>
      <button
        className={styles.cartButton}
        onClick={() => setIsOpen(true)}
        title="Otvori korpu"
      >
        <i className="fas fa-shopping-cart"></i>
      </button>

      {totalQuantity > 0 && (
        <div className={styles.cartBadge}>
          {totalQuantity}
        </div>
      )}

      {isOpen && (
        <CartModal onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}
