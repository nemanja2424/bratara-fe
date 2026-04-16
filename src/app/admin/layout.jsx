'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useLogout from '@/hooks/useLogout';
import Header from '@/components/Header';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const logout = useLogout();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        
        if (!token) {
          if (isMounted) logout();
          return;
        }

        try {
          const response = await fetch('https://butikirna.com/api/auth/protected', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });

          if (!response.ok) {
            if (isMounted) logout();
            return;
          }

          const data = await response.json();
          
          if (data.rola !== 1 && data.rola !== 2) {
            if (isMounted) {
              localStorage.setItem('rola', data.rola);
              router.push('/');
            }
            return;
          }

          if (isMounted) setIsAuthenticated(true);
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Auth check error:', error);
            if (isMounted) logout();
          }
          return;
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [logout, router]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Učitavanje...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <main>{children}</main>
    </>
  );
}
