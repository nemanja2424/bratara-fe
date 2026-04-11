import { useState, useEffect, useCallback } from 'react';

const CART_STORAGE_KEY = 'bratara_shop_cart';

export function useCart() {
  const [cartItems, setCartItems] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  // Učitaj korpu iz localStorage pri montaži
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setCartItems(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Greška pri učitavanju korpe:', err);
    }
    setIsMounted(true);
  }, []);

  // Čuva korpu u localStorage kada se promeni
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isMounted]);

  // Dodaj proizvod u korpu
  const addToCart = useCallback((proizvod, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(
        item => item.id === proizvod.id && 
                 item.boja === proizvod.boja && 
                 item.velicina === proizvod.velicina
      );

      if (existing) {
        return prev.map(item =>
          item === existing
            ? { ...item, kolicina: item.kolicina + quantity }
            : item
        );
      }

      return [...prev, {
        id: proizvod.id,
        code_base: proizvod.code_base,
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
    });
  }, []);

  // Ukloni proizvod iz korpe
  const removeFromCart = useCallback((cartItemId) => {
    setCartItems(prev => prev.filter(item => item !== cartItems[cartItemId]));
  }, [cartItems]);

  // Ažuriraj količinu proizvoda
  const updateQuantity = useCallback((cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCartItems(prev => 
      prev.map((item, idx) =>
        idx === cartItemId
          ? { ...item, kolicina: newQuantity }
          : item
      )
    );
  }, [removeFromCart]);

  // Očisti korpu
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

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
