'use client';
import { useRouter } from "next/navigation";

export default function useLogout() {
  const router = useRouter();

  return () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('rola');
    localStorage.removeItem('userId');
    localStorage.removeItem('bratara_shop_cart');
    localStorage.removeItem('bratara_shop_favorites');
    // Trigger auth update event za Header
    window.dispatchEvent(new Event('auth-updated'));
    router.push('/login');
  };
}
