'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useCartContext } from '@/context/CartContext';
import styles from './cart.module.css';

const API_BASE = 'http://127.0.0.1:5000';

// Boje sa hex vrijednostima
const COLORS = {
  'Crna': '#1a1a1a',
  'Bela': '#ffffff',
  'Crvena': '#e74c3c',
  'Plava': '#3498db',
  'Zelena': '#27ae60',
  'Žuta': '#f3d112',
  'Narandžasta': '#e67e22',
  'Ljubičasta': '#9b59b6',
  'Roza': '#ff69b4',
  'Siva': '#95a5a6',
  'Braon': '#8b4513',
  'Bež': '#d4a574',
  'Tirkizna': '#1abc9c',
  'Limunska Žuta': '#cddc39',
};

export default function CartModal({ onClose }) {
  const router = useRouter();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getOriginalPrice,
    getSavings,
  } = useCartContext();

  const totalPrice = getTotalPrice();
  const originalPrice = getOriginalPrice();
  const savings = getSavings();

  if (cartItems.length === 0) {
    return (
      <div className={styles.modal} onClick={onClose}>
        <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2>Vaša Korpa</h2>
            <button className={styles.closeBtn} onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.emptyCart}>
              <i className="fas fa-shopping-cart"></i>
              <p>Vaša korpa je prazna</p>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              className={styles.continueShoppingBtn}
              onClick={() => {
                onClose();
                router.push('/proizvodi');
              }}
            >
              Nastavi kupovinu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>Vaša Korpa ({cartItems.length})</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {cartItems.map((item, index) => {
            const discountedPrice = item.popust > 0
              ? parseFloat(item.cena) - (parseFloat(item.cena) * item.popust / 100)
              : parseFloat(item.cena);

            return (
              <div key={index} className={styles.cartItem}>
                {/* Slika */}
                <div className={styles.cartItemImage}>
                  {item.slika ? (
                    <img
                      src={`${API_BASE}/api/proizvodi/slike/${item.slika}`}
                      alt={item.ime}
                      onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f0f0f0" width="80" height="80"/%3E%3C/svg%3E'}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-image" style={{ color: '#ccc' }}></i>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className={styles.cartItemInfo}>
                  <div className={styles.cartItemName}>{item.ime}</div>
                  <div className={styles.cartItemDetails}>
                    <span>
                      <div className={styles.colorDot} style={{ backgroundColor: COLORS[item.boja] || '#ccc' }}></div>
                      {item.boja}
                    </span>
                    <span>Vel: {item.velicina}</span>
                  </div>
                  <div className={styles.cartItemPrice}>
                    {item.popust > 0 && (
                      <span className={styles.originalPrice}>{parseFloat(item.cena).toFixed(2)} KM</span>
                    )}
                    <span>{parseFloat(discountedPrice).toFixed(2)} KM</span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.cartItemActions}>
                  <div className={styles.quantityControl}>
                    <button
                      className={styles.quantityBtn}
                      onClick={() => updateQuantity(cartItems.indexOf(item), Math.max(1, item.kolicina - 1))}
                    >
                      −
                    </button>
                    <span className={styles.quantity}>{item.kolicina}x</span>
                    <button
                      className={styles.quantityBtn}
                      disabled={item.kolicina >= item.stanje}
                      onClick={() => {
                        if (item.kolicina < item.stanje) {
                          updateQuantity(cartItems.indexOf(item), item.kolicina + 1);
                        } else {
                          toast.error(`Dostupno je samo ${item.stanje} komada u skladištu`);
                        }
                      }}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(cartItems.indexOf(item))}
                    title="Ukloni iz korpe"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.priceBreakdown}>
            <div className={styles.priceRow}>
              <span>Subtotal:</span>
              <span>{originalPrice.toFixed(2)} KM</span>
            </div>
            {savings > 0 && (
              <div className={styles.priceRow}>
                <span className={styles.savings}>Ušteda:</span>
                <span className={styles.savings}>-{savings.toFixed(2)} KM</span>
              </div>
            )}
            <div className={styles.priceRow}>
              <span>Dostava:</span>
              <span>10.00 KM</span>
            </div>
            <div className={styles.priceRow + ' ' + styles.total}>
              <span>Ukupno:</span>
              <span>{(totalPrice + 10).toFixed(2)} KM</span>
            </div>
          </div>

          <button 
            className={styles.checkoutBtn}
            onClick={() => {
              onClose();
              router.push('/poruci');
            }}
          >
            Nastavi na plaćanje
          </button>
          <button
            className={styles.continueShoppingBtn}
            onClick={() => {
              onClose();
              router.push('/proizvodi');
            }}
          >
            Nastavi kupovinu
          </button>
        </div>
      </div>
    </div>
  );
}
