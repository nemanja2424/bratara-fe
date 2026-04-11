'use client';

import { usePathname } from 'next/navigation';
import CartButton from '@/components/Cart/CartButton';

export default function RootContent({ children }) {
  const pathname = usePathname();
  
  // Prikaži CartButton-a samo ako ruta ne počinje sa /admin
  const showCart = !pathname.startsWith('/admin');

  return (
    <>
      {children}
      {showCart && <CartButton />}
    </>
  );
}
