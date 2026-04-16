'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from '../porudzbine.module.css';
import { COLORS } from '@/constants';

const API_BASE = 'https://butikirna.com';

// Mapiranje statusa sa backend vrednostima
const STATUS_MAP = {
  'u_pripremi': { label: 'U pripremi', value: 'u_pripremi' },
  'u_tranzitu': { label: 'U tranzitu', value: 'u_tranzitu' },
  'dostavljeno': { label: 'Dostavljeno', value: 'dostavljeno' },
  'nedostavljeno': { label: 'Nije preuzeto', value: 'nedostavljeno' },
};

const STATUS_OPTIONS = Object.values(STATUS_MAP);

export default function PoruzbinaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [porudzbina, setPorudzbina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && id) {
      const fetchPorudzbina = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(`${API_BASE}/api/porudzbine/get?id=${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error('Greška pri učitavanju porudžbine');

          const data = await response.json();
          if (data.porudzbine && data.porudzbine.length > 0) {
            setPorudzbina(data.porudzbine[0]);
          } else {
            setError('Porudžbina nije pronađena');
          }
        } catch (err) {
          console.error('Greška:', err);
          toast.error('⚠️ Greška pri učitavanju porudžbine');
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchPorudzbina();
    }
  }, [isMounted, id]);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/porudzbine/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: porudzbina.id,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Greška pri ažuriranju statusa');

      // Ažuriraj lokalnu porudzbinu
      setPorudzbina(prev => ({ ...prev, status: newStatus }));
      toast.success('✅ Status je ažuriran');
    } catch (err) {
      console.error('Greška:', err);
      toast.error('⚠️ Greška pri ažuriranju statusa');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isMounted) {
    return <div>Učitavanje...</div>;
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>Učitavanje porudžbine...</div>
        </div>
      </div>
    );
  }

  if (error || !porudzbina) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>Greška: {error || 'Porudžbina nije pronađena'}</p>
            <button onClick={() => router.back()} className={styles.backButtonDetail}>
              Nazad
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stavke su direktno dostupne iz response-a
  const stavke = porudzbina.korpa || [];

  // Računanje ukupne cene
  const ukupnaCena = stavke.reduce((sum, stavka) => sum + (stavka.ukupno || 0), 0);

  return (
    <div className={styles.page}>
      <ToastContainer />
      
      <div className={styles.container}>
        {/* Header sa nazad dugmetom */}
        <div className={styles.detailHeader}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <i className="fas fa-arrow-left"></i>
            Nazad
          </button>
          <h1>Porudžbina #{porudzbina.id}</h1>
          <div></div>
        </div>

        <div className={styles.detailContent}>
          {/* Levo: Podaci o kupcu */}
          <div className={styles.leftSection}>
            {/* Kontakt */}
            <div className={styles.infoCard}>
              <h2>Kontaktni podaci</h2>
              <div className={styles.infoRow}>
                <span className={styles.label}>Ime i prezime:</span>
                <span className={styles.value}>{porudzbina.ime} {porudzbina.prezime}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Email:</span>
                <a href={`mailto:${porudzbina.email}`}>{porudzbina.email}</a>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Telefon:</span>
                <a href={`tel:${porudzbina.telefon}`}>{porudzbina.telefon}</a>
              </div>
            </div>

            {/* Adresa */}
            <div className={styles.infoCard}>
              <h2>Lokacija dostave</h2>
              <div className={styles.infoRow}>
                <span className={styles.label}>Adresa:</span>
                <span className={styles.value}>{porudzbina.adresa}</span>
              </div>
            </div>

            {/* Datum i status */}
            <div className={styles.infoCard}>
              <h2>Informacije o porudžbini</h2>
              <div className={styles.infoRow}>
                <span className={styles.label}>Datum narudžbe:</span>
                <span className={styles.value}>
                  {new Date(porudzbina.created_at).toLocaleDateString('sr-RS', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Status:</span>
                <select
                  value={porudzbina.status || 'u_pripremi'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                  className={styles.statusSelect}
                  title="Promeni status porudžbine"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Desno: Stavke u porudžbini */}
          <div className={styles.rightSection}>
            <div className={styles.itemsCard}>
              <h2>Stavke u porudžbini</h2>

              {stavke.length === 0 ? (
                <div className={styles.emptyItems}>
                  <i className="fas fa-inbox"></i>
                  <p>Nema stavki u porudžbini</p>
                </div>
              ) : (
                <>
                  <div className={styles.itemsList}>
                    {stavke.map((stavka, index) => {
                      const proizvod = stavka.proizvod || {};
                      const slika = proizvod.slike && proizvod.slike.length > 0 ? proizvod.slike[0] : null;

                      return (
                        <div key={index} className={styles.purchaseItem}>
                          <div className={styles.itemImageWrapper}>
                            {slika ? (
                              <img
                                src={`${API_BASE}/api/proizvodi/slike/${slika}`}
                                alt={proizvod.ime}
                                onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f0f0f0" width="80" height="80"/%3E%3C/svg%3E'}
                              />
                            ) : (
                              <div style={{ background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                <i className="fas fa-image" style={{ color: '#ccc' }}></i>
                              </div>
                            )}
                          </div>
                          <div className={styles.itemInfo}>
                            <h4>{proizvod.ime}</h4>
                            <div className={styles.itemDetails}>
                              {proizvod.boja && (
                                <span>
                                  <div className={styles.colorDot} style={{ backgroundColor: COLORS[proizvod.boja] || '#ccc' }}></div>
                                  {proizvod.boja}
                                </span>
                              )}
                              {proizvod.velicina && <span>Vel: {proizvod.velicina}</span>}
                            </div>
                          </div>
                          <div className={styles.itemQuantity}>
                            <span>x{stavka.kolicina}</span>
                          </div>
                          <div className={styles.itemPrice}>
                            {stavka.popust > 0 && (
                              <span className={styles.originalPrice}>{stavka.cena_po_komadu} KM</span>
                            )}
                            <span>{stavka.cena_sa_popustom} KM</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Suma */}
                  <div className={styles.orderTotal}>
                    <div className={styles.totalRow}>
                      <span>Ukupno:</span>
                      <span className={styles.totalAmount}>{porudzbina.cena} KM</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
