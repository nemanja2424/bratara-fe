'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUserContext } from '@/context/UserContext';
import styles from './signup.module.css';

const API_BASE = 'https://butikirna.com';

const VELIKI_GRADOVI = [
  'Sarajevo',
  'Banja Luka',
  'Tuzla',
  'Mostar',
  'Zenica',
  'Prijedor',
];

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useUserContext();

  const [formData, setFormData] = useState({
    ime: '',
    prezime: '',
    telefon: '',
    email: '',
    grad: '',
    postanskiBroj: '',
    adresa: '',
    lozinka: '',
    lozinkaPotvrd: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const { ime, prezime, telefon, email, grad, postanskiBroj, adresa, lozinka, lozinkaPotvrd } = formData;
    
    if (!ime.trim()) {
      toast.error('⚠️ Molim unesite ime');
      return false;
    }
    if (!prezime.trim()) {
      toast.error('⚠️ Molim unesite prezime');
      return false;
    }
    if (!telefon.trim()) {
      toast.error('⚠️ Molim unesite telefon');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('⚠️ Molim unesite važeću email adresu');
      return false;
    }
    if (!grad.trim()) {
      toast.error('⚠️ Molim unesite grad');
      return false;
    }
    if (!postanskiBroj.trim()) {
      toast.error('⚠️ Molim unesite poštanski broj');
      return false;
    }
    if (!adresa.trim()) {
      toast.error('⚠️ Molim unesite adresu');
      return false;
    }
    if (!lozinka.trim()) {
      toast.error('⚠️ Molim unesite lozinku');
      return false;
    }
    if (lozinka.length < 6) {
      toast.error('⚠️ Lozinka mora imati najmanje 6 karaktera');
      return false;
    }
    if (lozinka !== lozinkaPotvrd) {
      toast.error('⚠️ Lozinke se ne poklapaju');
      return false;
    }
    return true;
  };

  const handleSubmitSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Kreiraj payload sa kombinovanom adresom
      const payload = {
        ime: formData.ime,
        prezime: formData.prezime,
        telefon: formData.telefon,
        email: formData.email,
        adresa: `${formData.postanskiBroj} ${formData.grad}, ${formData.adresa}`,
        lozinka: formData.lozinka,
      };

      // Pošalji na API
      const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Greška pri registraciji');
      }

      const data = await response.json();
      
      // Sačuva token i user podatke u UserContext
      setAuth(data.user, data.access_token);
      
      toast.success('✅ Registracija je uspešna!', {
        position: 'top-right',
        autoClose: 3000,
      });

      // Preusměri na početnu stranicu
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error('Greška pri registraciji:', err);
      toast.error(`⚠️ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <ToastContainer position="top-right" theme="light" />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Kreiraj nalog</h1>
          <p>Unesite svoje podatke i kreirajte nalog</p>
        </div>

        <div className={styles.formWrapper}>
          <form className={styles.form} onSubmit={(e) => { e.preventDefault(); handleSubmitSignup(); }}>
            
            {/* Ime i Prezime - red */}
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>Ime*</label>
                <input
                  type="text"
                  name="ime"
                  value={formData.ime}
                  onChange={handleInputChange}
                  placeholder="Unesite vaše ime"
                  required
                />
              </div>
              <div className={styles.formField}>
                <label>Prezime*</label>
                <input
                  type="text"
                  name="prezime"
                  value={formData.prezime}
                  onChange={handleInputChange}
                  placeholder="Unesite vaše prezime"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className={styles.formField}>
              <label>Email*</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="vasaemail@example.com"
                required
              />
            </div>

            {/* Telefon */}
            <div className={styles.formField}>
              <label>Telefon*</label>
              <input
                type="tel"
                name="telefon"
                value={formData.telefon}
                onChange={handleInputChange}
                placeholder="06XX XXX XXXX"
                required
              />
            </div>

            {/* Grad i Poštanski broj - red */}
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>Grad*</label>
                <input
                  type="text"
                  name="grad"
                  value={formData.grad}
                  onChange={handleInputChange}
                  placeholder="Unesite grad"
                  list="gradovi-list"
                  required
                />
                <datalist id="gradovi-list">
                  {VELIKI_GRADOVI.map((grad) => (
                    <option key={grad} value={grad} />
                  ))}
                </datalist>
              </div>
              <div className={styles.formField}>
                <label>Poštanski broj*</label>
                <input
                  type="text"
                  name="postanskiBroj"
                  value={formData.postanskiBroj}
                  onChange={handleInputChange}
                  placeholder="npr. 71000"
                  required
                />
              </div>
            </div>

            {/* Adresa */}
            <div className={styles.formField}>
              <label>Adresa*</label>
              <input
                type="text"
                name="adresa"
                value={formData.adresa}
                onChange={handleInputChange}
                placeholder="Unesite adresu (npr. Zmaja od Bosne 10)"
                required
              />
            </div>

            {/* Lozinka i Potvrda lozinke - red */}
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>Lozinka*</label>
                <input
                  type="password"
                  name="lozinka"
                  value={formData.lozinka}
                  onChange={handleInputChange}
                  placeholder="Unesite lozinku (min. 6 karaktera)"
                  required
                />
              </div>
              <div className={styles.formField}>
                <label>Potvrdi lozinku*</label>
                <input
                  type="password"
                  name="lozinkaPotvrd"
                  value={formData.lozinkaPotvrd}
                  onChange={handleInputChange}
                  placeholder="Ponovite lozinku"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registam se...' : 'Kreiraj nalog'}
            </button>

            {/* Link na Login */}
            <div className={styles.loginLink}>
              <p>Već imate nalog? <a href="/login">Prijavite se</a></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
