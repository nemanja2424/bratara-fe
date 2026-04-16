import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'bratara_shop_favorites';
const API_BASE = 'https://butikirna.com';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Učitaj omiljene pri montaži
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        if (token) {
          // Ako je korisnik logovan, pokupi omiljene sa API-ja
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user?.omiljeno && Array.isArray(data.user.omiljeno)) {
              setFavorites(data.user.omiljeno);
              setIsAuthenticated(true);
            }
          } else {
            // Ako API poziv ne uspe, koristi localStorage
            const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
            if (saved) {
              setFavorites(JSON.parse(saved));
            }
          }
        } else {
          // Ako nema tokena, učitaj iz localStorage
          const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
          if (saved) {
            setFavorites(JSON.parse(saved));
          }
        }
      } catch (err) {
        console.error('Greška pri učitavanju omiljenih:', err);
        // Fallback na localStorage
        try {
          const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
          if (saved) {
            setFavorites(JSON.parse(saved));
          }
        } catch (fallbackErr) {
          console.error('Greška pri fallback učitavanju omiljenih:', fallbackErr);
        }
      }
      setIsMounted(true);
      setLoading(false);
    };

    loadFavorites();
  }, []);

  // Očisti omiljene kada se korisnik izloguje, ili ponovno učitaj ako se prijavi
  useEffect(() => {
    const handleAuthUpdate = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        // Korisnik se izlogovao
        setFavorites([]);
        setIsAuthenticated(false);
      } else {
        // Korisnik se prijavio - učitaj omiljene sa API-ja
        try {
          const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.user?.omiljeno && Array.isArray(data.user.omiljeno)) {
              setFavorites(data.user.omiljeno);
              setIsAuthenticated(true);
            }
          }
        } catch (err) {
          console.error('Greška pri učitavanju omiljenih nakon prijave:', err);
        }
      }
    };

    window.addEventListener('auth-updated', handleAuthUpdate);
    return () => window.removeEventListener('auth-updated', handleAuthUpdate);
  }, []);

  // Čuva omiljene u localStorage kada se promene (samo za neprijavljene korisnike)
  useEffect(() => {
    if (isMounted) {
      const token = localStorage.getItem('access_token');
      // Sačuvaj u localStorage samo ako korisnik nije logovan
      if (!token) {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      }
    }
  }, [favorites, isMounted]);

  // Sinhronizuj omiljene sa backendom
  const syncFavoritesToBackend = useCallback(async (favoritesData, token) => {
    try {
      const response = await fetch(`${API_BASE}/api/omiljeno/patch`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ omiljeno: favoritesData }),
      });

      if (!response.ok) {
        console.error('Greška pri ažuriranju omiljenih na backendu');
      }
    } catch (err) {
      console.error('Greška pri sinhronizaciji omiljenih:', err);
    }
  }, []);

  // Dodaj/ukloni iz omiljenih
  const toggleFavorite = useCallback(async (code_base) => {
    try {
      const newFavorites = favorites.includes(code_base)
        ? favorites.filter(fav => fav !== code_base)
        : [...favorites, code_base];

      setFavorites(newFavorites);

      // Ako je korisnik logovan, ažuriraj i na backendu
      const token = localStorage.getItem('access_token');
      if (token) {
        syncFavoritesToBackend(newFavorites, token).catch(err => {
          console.error('Greška pri ažuriranju omiljenih na backendu:', err);
        });
      }

      return true;
    } catch (err) {
      console.error('Greška pri ažuriranju omiljenih:', err);
      return false;
    }
  }, [favorites, syncFavoritesToBackend]);

  // Proveri da li je favorit
  const isFavorite = useCallback((code_base) => {
    return favorites.includes(code_base);
  }, [favorites]);

  // Dodaj bez proveravanja (wrapper)
  const addFavorite = useCallback(async (code_base) => {
    return toggleFavorite(code_base);
  }, [toggleFavorite]);

  // Ukloni bez proveravanja (wrapper)
  const removeFavorite = useCallback(async (code_base) => {
    if (favorites.includes(code_base)) {
      return toggleFavorite(code_base);
    }
    return true;
  }, [toggleFavorite, favorites]);

  return {
    favorites,
    loading,
    isMounted,
    isAuthenticated,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}
