'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useCartContext } from '@/context/CartContext';
import styles from './poruci.module.css';

const API_BASE = 'http://127.0.0.1:5000';

const VELIKI_GRADOVI = [
  'Sarajevo',
  'Banja Luka',
  'Tuzla',
  'Mostar',
  'Zenica',
  'Prijedor',
];

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

export default function PorucPage() {
  const router = useRouter();
  const { cartItems, getTotalPrice, getOriginalPrice, getSavings, clearCart } = useCartContext();

  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    telefon: '',
    email: '',
    grad: '',
    postanskiBroj: '',
    adresa: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Učitaj user podatke ako je prijavljen
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        
        if (!accessToken) {
          setIsLoadingUser(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          setIsLoadingUser(false);
          return;
        }

        const data = await response.json();
        const user = data.user;

        if (user) {
          // Razdeli adresu na poštanski broj, grad i adresu
          const addressParts = user.adresa?.split(', ') || [];
          const postalAndCity = addressParts[0]?.split(' ') || [];
          const postanskiBroj = postalAndCity[0] || '';
          const grad = postalAndCity.slice(1).join(' ') || '';
          const adresa = addressParts.slice(1).join(', ') || '';

          setFormData({
            ime: user.ime || '',
            prezime: user.prezime || '',
            telefon: user.telefon || '',
            email: user.email || '',
            grad: grad,
            postanskiBroj: postanskiBroj,
            adresa: adresa,
          });
        }
      } catch (err) {
        console.error('Greška pri učitavanju korisnika:', err);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadUserData();
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.emptyCart}>
            <i className="fas fa-shopping-cart"></i>
            <h2>Vaša korpa je prazna</h2>
            <p>Dodajte proizvode pre nego što nastavite na porudžbinu</p>
            <button 
              className={styles.continuBtn}
              onClick={() => router.push('/proizvodi')}
            >
              Nastavite na kupovanje
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const { ime, prezime, telefon, email, grad, postanskiBroj, adresa } = formData;
    
    if (!ime.trim()) {
      toast.error('⚠️ Molim unesite ime');
      return false;
    }
    if (!prezime.trim()) {
      toast.error('⚠️ Molim unesite prezime');
      return false;
    }
    if (!telefon.trim()) {
      toast.error('⚠️ Molim unesite telefon');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('⚠️ Molim unesite važeću email adresu');
      return false;
    }
    if (!grad.trim()) {
      toast.error('⚠️ Molim unesite grad');
      return false;
    }
    if (!postanskiBroj.trim()) {
      toast.error('⚠️ Molim unesite poštanski broj');
      return false;
    }
    if (!adresa.trim()) {
      toast.error('⚠️ Molim unesite adresu');
      return false;
    }
    return true;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Uzmi userId iz localStorage
      const userId = parseInt(localStorage.getItem('userId')) || 1;

      // Kreiraj payload
      const payload = {
        ime: formData.ime,
        prezime: formData.prezime,
        telefon: formData.telefon,
        email: formData.email,
        adresa: `${formData.postanskiBroj} ${formData.grad}, ${formData.adresa}`,
        userId: userId,
        korpa: cartItems.map(item => ({
          code: item.code_base,
          kolicina: item.kolicina,
        })),
      };

      // Pošalji na API
      const response = await fetch(`${API_BASE}/api/porudzbine/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Greška pri kreiranju porudžbine');
      }

      const data = await response.json();
      
      toast.success('✅ Porudžbina je uspešno kreirana!', {
        position: 'top-right',
        autoClose: 3000,
      });

      // Očisti korpu
      clearCart();

      // Preusměri na stranicu sa potvrdom (ili na početnu)
      setTimeout(() => {
        router.push('/proizvodi');
      }, 2000);
    } catch (err) {
      console.error('Greška pri slanju porudžbine:', err);
      toast.error('⚠️ Greška pri kreiranju porudžbine. Pokušajte ponovo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = getTotalPrice();
  const originalPrice = getOriginalPrice();
  const savings = getSavings();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Potvrdite vašu porudžbinu</h1>
          <p>Unesite svoje podatke i pregledate korpu pre nego što potvrdite porudžbinu</p>
        </div>

        <div className={styles.content}>
          {/* Forma sa levom stranom */}
          <div className={styles.formSection}>
            <h2>Vaši podaci</h2>
            <form className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>Ime*</label>
                  <input
                    type="text"
                    name="ime"
                    value={formData.ime}
                    onChange={handleInputChange}
                    placeholder="Unesite vaše ime"
                  />
                </div>
                <div className={styles.formField}>
                  <label>Prezime*</label>
                  <input
                    type="text"
                    name="prezime"
                    value={formData.prezime}
                    onChange={handleInputChange}
                    placeholder="Unesite vaše prezime"
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label>Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="vasaemail@example.com"
                />
              </div>

              <div className={styles.formField}>
                <label>Telefon*</label>
                <input
                  type="tel"
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleInputChange}
                  placeholder="06XX XXX XXXX"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label>Grad*</label>
                  <input
                    type="text"
                    name="grad"
                    value={formData.grad}
                    onChange={handleInputChange}
                    placeholder="Unesite grad"
                    list="gradovi-list"
                  />
                  <datalist id="gradovi-list">
                    {VELIKI_GRADOVI.map((grad) => (
                      <option key={grad} value={grad} />
                    ))}
                  </datalist>
                </div>
                <div className={styles.formField}>
                  <label>Poštanski broj*</label>
                  <input
                    type="text"
                    name="postanskiBroj"
                    value={formData.postanskiBroj}
                    onChange={handleInputChange}
                    placeholder="npr. 71000"
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label>Adresa za dostavu*</label>
                <input
                  type="text"
                  name="adresa"
                  value={formData.adresa}
                  onChange={handleInputChange}
                  placeholder="Unesite adresu za dostavu (npr. Zmaja od Bosne 10)"
                />
              </div>
            </form>
          </div>

          {/* Pregled korpe sa desne strane */}
          <div className={styles.reviewSection}>
            <h2>Pregled porudžbine</h2>
            
            <div className={styles.cartItems}>
              {cartItems.map((item, index) => {
                const discountedPrice = item.popust > 0
                  ? parseFloat(item.cena) - (parseFloat(item.cena) * item.popust / 100)
                  : parseFloat(item.cena);

                return (
                  <div key={index} className={styles.cartItem}>
                    <div className={styles.itemImage}>
                      {item.slika ? (
                        <img
                          src={`${API_BASE}/api/proizvodi/slike/${item.slika}`}
                          alt={item.ime}
                          onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f0f0f0" width="80" height="80"/%3E%3C/svg%3E'}
                        />
                      ) : (
                        <div style={{ background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                          <i className="fas fa-image" style={{ color: '#ccc' }}></i>
                        </div>
                      )}
                    </div>
                    <div className={styles.itemDetails}>
                      <h4>{item.ime}</h4>
                      <div className={styles.itemMeta}>
                        <span>
                          <div className={styles.colorDot} style={{ backgroundColor: COLORS[item.boja] || '#ccc' }}></div>
                          {item.boja}
                        </span>
                        <span>Vel: {item.velicina}</span>
                      </div>
                      <div className={styles.itemPrice}>
                        {item.popust > 0 && (
                          <span className={styles.originalPrice}>{parseFloat(item.cena).toFixed(2)} KM</span>
                        )}
                        <span>{discountedPrice.toFixed(2)} KM</span>
                      </div>
                    </div>
                    <div className={styles.quantity}>
                      <span>x{item.kolicina}</span>
                    </div>
                    <div className={styles.itemTotal}>
                      {(discountedPrice * item.kolicina).toFixed(2)} KM
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cena razrada */}
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

            {/* Dugme za potvrdu */}
            <button 
              className={styles.confirmBtn}
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Obrada...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Potvrdi porudžbinu
                </>
              )}
            </button>

            <button 
              className={styles.backBtn}
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Nazad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
