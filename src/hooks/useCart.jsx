import { useState, useEffect, useCallback } from 'react';

const CART_STORAGE_KEY = 'bratara_shop_cart';

export function useCart() {
  const [cartItems, setCartItems] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  // Učitaj korpu iz API-ja ako je korisnik logovan, ili iz localStorage
  useEffect(() => {
    const loadCart = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        if (token) {
          // Ako je korisnik logovan, učitaj korpu sa API-ja
          const response = await fetch('https://butikirna.com/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user?.korpa && Array.isArray(data.user.korpa)) {
              setCartItems(data.user.korpa);
            }
          } else {
            // Ako API poziv ne uspe, koristi localStorage
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            if (saved) {
              setCartItems(JSON.parse(saved));
            }
          }
        } else {
          // Ako nema tokena, učitaj iz localStorage
          const saved = localStorage.getItem(CART_STORAGE_KEY);
          if (saved) {
            setCartItems(JSON.parse(saved));
          }
        }
      } catch (err) {
        console.error('Greška pri učitavanju korpe:', err);
        // Fallback na localStorage
        try {
          const saved = localStorage.getItem(CART_STORAGE_KEY);
          if (saved) {
            setCartItems(JSON.parse(saved));
          }
        } catch (fallbackErr) {
          console.error('Greška pri fallback učitavanju korpe:', fallbackErr);
        }
      }
      setIsMounted(true);
    };

    loadCart();
  }, []);

  // Očisti korpu kada se korisnik izloguje, ili ponovno učitaj ako se prijavi
  useEffect(() => {
    const handleAuthUpdate = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        // Korisnik se izlogovao
        setCartItems([]);
      } else {
        // Korisnik se prijavio - učitaj korpu sa API-ja
        try {
          const response = await fetch('https://butikirna.com/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user?.korpa && Array.isArray(data.user.korpa)) {
              setCartItems(data.user.korpa);
            }
          }
        } catch (err) {
          console.error('Greška pri učitavanju korpe nakon prijave:', err);
        }
      }
    };

    window.addEventListener('auth-updated', handleAuthUpdate);
    return () => window.removeEventListener('auth-updated', handleAuthUpdate);
  }, []);

  // Čuva korpu u localStorage kada se promeni (samo za neprijavljene korisnike)
  useEffect(() => {
    if (isMounted) {
      const token = localStorage.getItem('access_token');
      // Sačuvaj u localStorage samo ako korisnik nije logovan
      if (!token) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      }
    }
  }, [cartItems, isMounted]);

  // Sinhronizuj korpu sa backendom
  const syncCartToBackend = useCallback(async (cartData, token) => {
    try {
      const response = await fetch('https://butikirna.com/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ korpa: cartData }),
      });

      if (!response.ok) {
        console.error('Greška pri ažuriranju korpe na backendu');
      }
    } catch (err) {
      console.error('Greška pri sinhronizaciji korpe:', err);
    }
  }, []);

  // Dodaj proizvod u korpu
  const addToCart = useCallback((proizvod, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(
        item => item.id === proizvod.id && 
                 item.boja === proizvod.boja && 
                 item.velicina === proizvod.velicina
      );

      let updated;
      if (existing) {
        updated = prev.map(item =>
          item === existing
            ? { ...item, kolicina: item.kolicina + quantity }
            : item
        );
      } else {
        updated = [...prev, {
          id: proizvod.id,
          code_base: proizvod.code_base,
          code_variant: proizvod.code_variant,
          ime: proizvod.ime,
          kategorija: proizvod.kategorija,
          cena: proizvod.cena,
          popust: proizvod.popust,
          boja: proizvod.boja,
          velicina: proizvod.velicina,
          slika: proizvod.slike?.[0],
          kolicina: quantity,
          stanje: proizvod.stanje,
        }];
      }

      // Ako je korisnik logovan, ažuriraj i na backendu
      const token = localStorage.getItem('access_token');
      if (token) {
        syncCartToBackend(updated, token).catch(err => {
          console.error('Greška pri ažuriranju korpe na backendu:', err);
        });
      }

      return updated;
    });
  }, [syncCartToBackend]);

  // Ukloni proizvod iz korpe
  const removeFromCart = useCallback((cartItemId) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item !== prev[cartItemId]);

      // Ako je korisnik logovan, ažuriraj i na backendu
      const token = localStorage.getItem('access_token');
      if (token) {
        syncCartToBackend(updated, token).catch(err => {
          console.error('Greška pri ažuriranju korpe na backendu:', err);
        });
      }

      return updated;
    });
  }, [syncCartToBackend]);

  // Ažuriraj količinu proizvoda
  const updateQuantity = useCallback((cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      // Ako je količina 0 ili manja, ukloni proizvod
      setCartItems(prev => {
        const updated = prev.filter(item => item !== prev[cartItemId]);

        // Ako je korisnik logovan, ažuriraj i na backendu
        const token = localStorage.getItem('access_token');
        if (token) {
          syncCartToBackend(updated, token).catch(err => {
            console.error('Greška pri ažuriranju korpe na backendu:', err);
          });
        }

        return updated;
      });
      return;
    }

    setCartItems(prev => {
      const updated = prev.map((item, idx) =>
        idx === cartItemId
          ? { ...item, kolicina: newQuantity }
          : item
      );

      // Ako je korisnik logovan, ažuriraj i na backendu
      const token = localStorage.getItem('access_token');
      if (token) {
        syncCartToBackend(updated, token).catch(err => {
          console.error('Greška pri ažuriranju korpe na backendu:', err);
        });
      }

      return updated;
    });
  }, [syncCartToBackend]);

  // Očisti korpu
  const clearCart = useCallback(() => {
    setCartItems([]);
    
    // Ako je korisnik logovan, ažuriraj i na backendu
    const token = localStorage.getItem('access_token');
    if (token) {
      syncCartToBackend([], token).catch(err => {
        console.error('Greška pri brisanju korpe na backendu:', err);
      });
    }
  }, [syncCartToBackend]);

  // Izračunaj ukupnu cenu
  const getTotalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const discountedPrice = item.popust > 0
        ? Math.round(item.cena - (item.cena * item.popust / 100))
        : item.cena;
      return total + (discountedPrice * item.kolicina);
    }, 0);
  }, [cartItems]);

  // Izračunaj originalnu cenu
  const getOriginalPrice = useCallback(() => {
    return cartItems.reduce((total, item) => {
      return total + (item.cena * item.kolicina);
    }, 0);
  }, [cartItems]);

  // Izračunaj uštetu
  const getSavings = useCallback(() => {
    return getOriginalPrice() - getTotalPrice();
  }, [getOriginalPrice, getTotalPrice]);

  return {
    cartItems,
    isMounted,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getOriginalPrice,
    getSavings,
    itemCount: cartItems.length,
    totalQuantity: cartItems.reduce((sum, item) => sum + item.kolicina, 0),
  };
}
