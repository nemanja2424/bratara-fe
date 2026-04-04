'use client';
import { useRouter } from "next/navigation";

export default function useLogout() {
  const router = useRouter();

  return () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('rola');
    localStorage.removeItem('userId');
    // Trigger auth update event za Header
    window.dispatchEvent(new Event('auth-updated'));
    router.push('/login');
  };
}
