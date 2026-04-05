'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './Header.module.css';

export default function Header({ adminPanel = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const updateAuthState = () => {
      const token = localStorage.getItem('access_token');
      const rola = localStorage.getItem('rola');
      setIsLoggedIn(!!token);
      setUserRole(rola ? parseInt(rola) : null);
    };

    updateAuthState();

    // Listen za custom auth event
    window.addEventListener('auth-updated', updateAuthState);
    
    return () => {
      window.removeEventListener('auth-updated', updateAuthState);
    };
  }, []);

    const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('rola');
    localStorage.removeItem('userId');

    setIsLoggedIn(false);
    setUserRole(null);
    setMobileMenuOpen(false);

    // obavesti druge komponente (npr Header)
    window.dispatchEvent(new Event('auth-updated'));

    // ✅ redirect samo ako je admin ruta
    if (pathname.startsWith('/admin')) {
        router.replace('/');
    }
    };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="/brateraLogo.webp"
              alt="Butik Irna Logo"
              width={120}
              height={50}
              priority
              style={{ width: 'auto', height: '50px' }}
            />
          </Link>
        </div>

        <button
          className={styles.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`${styles.nav} ${mobileMenuOpen ? styles.navOpen : ''}`}>
          <Link href="/" className={styles.navLink}>
            Početna
          </Link>
          <Link href="/proizvodi" className={styles.navLink}>
            Proizvodi
          </Link>
          <Link href="/o-nama" className={styles.navLink}>
            O nama
          </Link>
          <Link href="/kontakt" className={styles.navLink}>
            Kontakt
          </Link>

          <div className={styles.authLinks}>
            {isMounted && isLoggedIn && (userRole === 1 || userRole === 2) && (
              <Link href="/admin" className={styles.adminLink}>
                Admin Panel
              </Link>
            )}
            {isMounted && isLoggedIn && (
              <button onClick={handleLogout} className={styles.logoutBtn}>
                Odjavi se
              </button>
            )}
            {isMounted && !isLoggedIn && (
              <Link href="/login" className={styles.loginLink}>
                Prijavi se
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
