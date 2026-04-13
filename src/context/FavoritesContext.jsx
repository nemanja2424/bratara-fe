'use client';

import { createContext, useContext } from 'react';
import { useFavorites } from '@/hooks/useFavorites';

const FavoritesContext = createContext(undefined);

export function FavoritesProvider({ children }) {
  const favorites = useFavorites();

  return (
    <FavoritesContext.Provider value={favorites}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavoritesContext mora biti korišćen unutar FavoritesProvider-a');
  }
  return context;
}
