'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useCartContext } from '@/context/CartContext';
import styles from './poruci.module.css';
import { COLORS } from '@/constants';

const API_BASE = 'http://127.0.0.1:5000';

const VELIKI_GRADOVI = [
  'Sarajevo',
  'Banja Luka',
  'Tuzla',
  'Mostar',
  'Zenica',
  'Prijedor',
];

export default function PorucPage() {
  const router = useRouter();
  const { 
    cartItems, 
    getTotalPrice, 
    getOriginalPrice, 
    getSavings, 
    clearCart,
    removeFromCart 
  } = useCartContext();

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
  const [stockProblems, setStockProblems] = useState([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [adjustedQuantities, setAdjustedQuantities] = useState({});

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

      // Kreiraj payload sa prilagođenim količinama ako postoje
      const korpaZaSizbanje = cartItems.map(item => {
        const fullCode = `${item.code_base}-${item.code_variant}`;
        const adjustedQty = adjustedQuantities[fullCode] || item.kolicina;
        return {
          code: fullCode,
          kolicina: adjustedQty,
        };
      });

      // Pošalji na API
      const response = await fetch(`${API_BASE}/api/porudzbine/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ime: formData.ime,
          prezime: formData.prezime,
          telefon: formData.telefon,
          email: formData.email,
          adresa: `${formData.postanskiBroj} ${formData.grad}, ${formData.adresa}`,
          userId: userId,
          korpa: korpaZaSizbanje,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Proveri da li je insufficient_stock greška
        if (errorData.error === 'insufficient_stock') {
          // Prikaži modal sa problemom
          setStockProblems([errorData.product]);
          setCurrentProblemIndex(0);
          setIsSubmitting(false);
          return;
        }

        throw new Error(errorData.message || 'Greška pri kreiranju porudžbine');
      }

      const data = await response.json();
      
      toast.success('✅ Porudžbina je uspešno kreirana!', {
        position: 'top-right',
        autoClose: 3000,
      });

      // Očisti korpu
      clearCart();
      setStockProblems([]);
      setAdjustedQuantities({});

      // Preusměri
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

  // Funkcije za rukovanje stock problemima
  const handleAdjustQuantity = (code, newQuantity) => {
    const qty = Math.max(0, Math.min(parseInt(newQuantity) || 0, stockProblems[currentProblemIndex]?.available || 0));
    setAdjustedQuantities(prev => ({
      ...prev,
      [code]: qty,
    }));
  };

  const handleRemoveStockProblemProduct = (code) => {
    // code je u formatu "code_base-code_variant"
    const itemIndex = cartItems.findIndex(item => 
      `${item.code_base}-${item.code_variant}` === code
    );
    if (itemIndex >= 0) {
      removeFromCart(itemIndex);
      // Nastavi na sledeći problem ili zatvori modal
      if (currentProblemIndex < stockProblems.length - 1) {
        setCurrentProblemIndex(currentProblemIndex + 1);
      } else {
        setStockProblems([]);
        setCurrentProblemIndex(0);
      }
    }
  };

  const handleNextProblem = () => {
    if (currentProblemIndex < stockProblems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
    } else {
      // Svi problemi su obrađeni, pokušaj ponovo
      setStockProblems([]);
      setCurrentProblemIndex(0);
      setAdjustedQuantities({});
      handleSubmitOrder();
    }
  };

  // Ako ima stock problema, prikaži modal
  if (stockProblems.length > 0) {
    const currentProblem = stockProblems[currentProblemIndex];
    
    return (
      <div className={styles.page}>
        <div className={`${styles.modal} ${styles.stockProblemModal}`}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <i className="fas fa-exclamation-triangle"></i>
                <h2>Nema dovoljno na stanju</h2>
              </div>
              <button 
                className={styles.closeBtn}
                onClick={() => setStockProblems([])}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.problemInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Proizvod:</span>
                  <span className={styles.value}>{currentProblem.name}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Traženo:</span>
                  <span className={styles.value}>{currentProblem.requested} kom</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Dostupno:</span>
                  <span className={styles.value + ' ' + styles.available}>
                    {currentProblem.available} kom
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.label}>Nedostaje:</span>
                  <span className={styles.value + ' ' + styles.shortage}>
                    {currentProblem.shortage} kom
                  </span>
                </div>
              </div>

              <div className={styles.actions}>
                {currentProblem.available < 1 ? (
                  <div className={styles.actionGroup}>
                    <p>Nažalost, nema više ovog proizvoda na stanju.</p>
                    <button 
                      className={`${styles.btn} ${styles.deleteBtn}`}
                      onClick={() => handleRemoveStockProblemProduct(currentProblem.code)}
                    >
                      <i className="fas fa-trash"></i>
                      Obriši iz korpe
                    </button>
                  </div>
                ) : (
                  <div className={styles.actionGroup}>
                    <p>Možete nastaviti sa dostupnom količinom ili obrisati proizvod.</p>
                    <div className={styles.quantityControl}>
                      <label>Nova količina (do {currentProblem.available}):</label>
                      <div className={styles.quantityInput}>
                        <input 
                          type="number" 
                          min="0" 
                          max={currentProblem.available}
                          value={adjustedQuantities[currentProblem.code] || currentProblem.available}
                          onChange={(e) => handleAdjustQuantity(currentProblem.code, e.target.value)}
                        />
                        <button 
                          className={`${styles.btn} ${styles.quickBtn}`}
                          onClick={() => handleAdjustQuantity(currentProblem.code, currentProblem.available)}
                        >
                          Prilagodi na {currentProblem.available} kom
                        </button>
                      </div>
                    </div>
                    <button 
                      className={`${styles.btn} ${styles.deleteBtn}`}
                      onClick={() => handleRemoveStockProblemProduct(currentProblem.code)}
                    >
                      <i className="fas fa-trash"></i>
                      Obriši iz korpe
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              {stockProblems.length > 1 && (
                <span className={styles.problemCounter}>
                  Problem {currentProblemIndex + 1} od {stockProblems.length}
                </span>
              )}
              <button 
                className={`${styles.btn} ${styles.primaryBtn}`}
                onClick={handleNextProblem}
              >
                {currentProblemIndex < stockProblems.length - 1 
                  ? 'Sledeći problem' 
                  : 'Pokušaj ponovo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
