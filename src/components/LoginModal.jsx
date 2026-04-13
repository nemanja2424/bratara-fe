'use client';

import { useRouter } from 'next/navigation';
import styles from './LoginModal.module.css';

export default function LoginModal({ onClose }) {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
    onClose();
  };

  const handleSignup = () => {
    router.push('/signup');
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        <div className={styles.content}>
          <i className="fas fa-lock"></i>
          <h2>Dodaj u omiljene</h2>
          <p>Trebate biti prijavljeni da biste dodavanje proizvode u omiljene</p>

          <div className={styles.buttons}>
            <button className={styles.loginBtn} onClick={handleLogin}>
              <i className="fas fa-sign-in-alt"></i> Prijavi se
            </button>
            <button className={styles.signupBtn} onClick={handleSignup}>
              <i className="fas fa-user-plus"></i> Registruj se
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
