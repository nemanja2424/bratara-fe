'use client';

import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './page.module.css';

const API_BASE = 'https://butikirna.com';

export default function Kontakt() {
  const [formData, setFormData] = useState({
    ime: '',
    email: '',
    poruka: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validacija
    if (!formData.ime.trim()) {
      toast.error('Molimo unesite vaše ime');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Molimo unesite validan email');
      return;
    }
    if (!formData.poruka.trim()) {
      toast.error('Molimo unesite poruku');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/kontakt/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Greška pri slanju poruke');
      }

      const data = await response.json();
      toast.success('Poruka je uspešno poslana! Hvala što ste nam kontaktirali.');
      
      // Resetuj formu
      setFormData({
        ime: '',
        email: '',
        poruka: ''
      });
    } catch (err) {
      console.error('Greška:', err);
      toast.error('Došlo je do greške pri slanju poruke. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Kontaktiraj Nas</h1>
          <p>Imamo pitanja? Pošalji nam poruku</p>
          <div className={styles.heroCtas}>
            <button 
              className={styles.primaryBtn}
              onClick={() => router.push('/proizvodi')}
            >
              Pregledaj proizvode
            </button>
            <button 
              className={styles.secondaryBtn}
              onClick={() => router.push('/about')}
            >
              Saznaj više
            </button>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className={styles.contactSection}>
        <div className={styles.contactContainer}>
          {/* Contact Info */}
          <div className={styles.contactInfo}>
            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <i className="fas fa-envelope fa-gradient"></i>
              </div>
              <h3>Email</h3>
              <p>
                <a href="mailto:butikirna@gmail.com">butikirna@gmail.com</a>
              </p>
              <span className={styles.subtext}>Odgovoriće vam u roku od 24 sata</span>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <i className="fas fa-map-marker-alt fa-gradient"></i>
              </div>
              <h3>Lokacija</h3>
              <p>Džemala Bijedića 4<br />(u redu glavne pošte)<br />Tuzla</p>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoIcon}>
                <i className="fas fa-clock fa-gradient"></i>
              </div>
              <h3>Radno Vrijeme</h3>
              <p>
                <strong>Ponedjeljak - Petak:</strong> 09:00 - 18:00<br />
                <strong>Subota:</strong> 09:00 - 15:00<br />
                <strong>Nedjelja:</strong> Zatvoreno
              </p>
            </div>
          </div>

          {/* Contact Form */}
          {/*
          <div className={styles.contactFormWrapper}>
            <div className={styles.formCard}>
              <h2>Pošalji Nam Poruku</h2>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="ime">Ime *</label>
                  <input
                    type="text"
                    id="ime"
                    name="ime"
                    value={formData.ime}
                    onChange={handleChange}
                    placeholder="Unesite vaše ime"
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Unesite vaš email"
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="poruka">Poruka *</label>
                  <textarea
                    id="poruka"
                    name="poruka"
                    value={formData.poruka}
                    onChange={handleChange}
                    placeholder="Unesite vašu poruku..."
                    rows="6"
                    disabled={loading}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      {' '}Slanje...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      {' '}Pošalji Poruku
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}
