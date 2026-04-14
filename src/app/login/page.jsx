


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from '@/components/Header';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const access_token = localStorage.getItem('access_token');

            if (!access_token) {
                return;
            }

            try {
                const response = await fetch('http://127.0.0.1:5000/api/auth/protected', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('rola');
                    localStorage.removeItem('userId');
                    return;
                }

                const data = await response.json();

                if (data.rola === 1 || data.rola === 2) {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error('Auth check error:', error);
            }
        };

        checkAuth();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Uspješna prijava!');
                setEmail('');
                setPassword('');

                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('rola', data.user.rola);

                // Trigger auth update event za Header
                window.dispatchEvent(new Event('auth-updated'));

                const role = data.user.rola;
                setTimeout(() => {
                    if (role === 1 || role === 2) {
                        router.push('/admin');
                    } else if (role === 0) {
                        router.push('/');
                    }
                }, 0);
            } else {
                toast.error(data.message || 'Greška pri prijavi');
            }
        } catch (error) {
            toast.error('Greška pri povezivanju: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={styles.container}>
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                />
                
                <div className={styles.formWrapper}>
                    <div className={styles.formBox}>
                        <h1>Prijava</h1>
                        <p className={styles.subtitle}>Prijavite se na Butik Irna</p>
                        
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label htmlFor="email">
                                    <i className="fas fa-envelope fa-gradient" style={{marginRight: '8px'}}></i>
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="va@example.com"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="password">
                                    <i className="fas fa-lock fa-gradient" style={{marginRight: '8px'}}></i>
                                    Lozinka
                                </label>
                                <div className={styles.passwordInputWrapper}>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggleBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={`fas fa-eye${showPassword ? '' : '-slash'}`}></i>
                                    </button>
                                </div>
                            </div>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.submitBtn}
                            >
                                <i className="fas fa-sign-in-alt" style={{marginRight: '8px'}}></i>
                                {loading ? 'Učitavanje...' : 'Prijavi se'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}