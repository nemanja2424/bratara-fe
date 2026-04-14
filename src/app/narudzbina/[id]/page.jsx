'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import Link from 'next/link';
import styles from './narudzbina.module.css';
import { COLORS } from '@/constants';

const API_BASE = 'http://127.0.0.1:5000';

const MONTHS_BS = {
  0: 'januar', 1: 'februar', 2: 'mart', 3: 'april', 4: 'maj', 5: 'jun',
  6: 'jul', 7: 'август', 8: 'septembar', 9: 'oktobar', 10: 'novembar', 11: 'decembar'
};

const WEEKDAYS_BS = {
  0: 'nedjelja', 1: 'ponedeljak', 2: 'utorak', 3: 'srijeda', 4: 'četvrtak', 5: 'petak', 6: 'subota'
};

const formatDateBosanski = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = MONTHS_BS[date.getMonth()];
  const year = date.getFullYear();
  const weekday = WEEKDAYS_BS[date.getDay()];
  return `${weekday}, ${day}. ${month} ${year}.`;
};

export default function NarudzbinDetailPage() {
  const router = useRouter();
  const params = useParams();
  const narudzbinaId = params.id;

  const [narudzbina, setNarudzbina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && narudzbinaId) {
      fetchNarudzbinaDetail();
    }
  }, [isMounted, narudzbinaId]);

  const fetchNarudzbinaDetail = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        toast.error('⚠️ Molim prijavite se da vidite detalje porudžbine');
        router.push('/login');
        return;
      }

      // Učitaj sve porudžbine korisnika i nađi onu sa odgovarajućim ID-om
      const response = await fetch(`${API_BASE}/api/porudzbine/get`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Greška pri učitavanju porudžbina');
      }

      const data = await response.json();
      const foundNarudzbina = data.porudzbine?.find(n => n.id === parseInt(narudzbinaId));

      if (!foundNarudzbina) {
        toast.error('⚠️ Porudžbina nije pronađena');
        router.push('/kupac?tab=porudzbine');
        return;
      }

      setNarudzbina(foundNarudzbina);
    } catch (err) {
      console.error('Greška pri učitavanju detalja porudžbine:', err);
      toast.error('⚠️ Greška pri učitavanju detalja porudžbine');
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Učitavanje...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!narudzbina) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <i className="fas fa-exclamation-circle"></i>
            <h2>Porudžbina nije pronađena</h2>
            <button 
              className={styles.backBtn}
              onClick={() => router.push('/kupac?tab=porudzbine')}
            >
              <i className="fas fa-arrow-left"></i>
              Nazad na porudžbine
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusDisplay = {
    'u_pripremi': 'U pripremi',
    'poslato': 'Poslato',
    'dostavljeno': 'Dostavljeno',
    'otkazano': 'Otkazano',
    'potvrdjeno': 'Potvrđeno',
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button 
            className={styles.backBtn}
            onClick={() => router.push('/kupac?tab=porudzbine')}
          >
            <i className="fas fa-arrow-left"></i>
            Nazad
          </button>
          <h1>Porudžbina #{narudzbina.id}</h1>
          <span className={`${styles.statusBadge} ${styles[`status-${narudzbina.status?.toLowerCase() || 'pending'}`]}`}>
            {statusDisplay[narudzbina.status] || narudzbina.status || 'Čekanje'}
          </span>
        </div>

        <div className={styles.content}>
          {/* Leva strana - Info */}
          <div className={styles.infoSection}>
            <div className={styles.infoCard}>
              <h2>Osnovne informacije</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Datum narudžbine:</span>
                  <span className={styles.value}>
                    {formatDateBosanski(narudzbina.created_at)}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Vreme:</span>
                  <span className={styles.value}>
                    {new Date(narudzbina.created_at).toLocaleTimeString('bs-BA', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Status:</span>
                  <span className={`${styles.statusBadge} ${styles[`status-${narudzbina.status?.toLowerCase() || 'pending'}`]}`}>
                    {statusDisplay[narudzbina.status] || narudzbina.status || 'Čekanje'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <h2>Dostava</h2>
              <div className={styles.infoGrid}>
                {narudzbina.ime && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Ime i prezime:</span>
                    <span className={styles.value}>{narudzbina.ime} {narudzbina.prezime}</span>
                  </div>
                )}
                {narudzbina.telefon && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Telefon:</span>
                    <span className={styles.value}>{narudzbina.telefon}</span>
                  </div>
                )}
                {narudzbina.email && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>E-pošta:</span>
                    <span className={styles.value}>{narudzbina.email}</span>
                  </div>
                )}
                {narudzbina.adresa && (
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Adresa:</span>
                    <span className={styles.value}>{narudzbina.adresa}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.infoCard}>
              <h2>Cena</h2>
              <div className={styles.priceInfo}>
                <div className={styles.priceRow}>
                  <span>Međuzbir proizvoda:</span>
                  <span>
                    {(narudzbina.korpa?.reduce((sum, item) => sum + (item.ukupno || 0), 0) || 0).toFixed(2)} KM
                  </span>
                </div>
                <div className={styles.priceRow}>
                  <span>Dostava:</span>
                  <span>10,00 KM</span>
                </div>
                <div className={`${styles.priceRow} ${styles.total}`}>
                  <span>Ukupna cena:</span>
                  <span>{parseFloat(narudzbina.cena || 0).toFixed(2)} KM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desna strana - Proizvodi */}
          <div className={styles.productsSection}>
            <h2>Proizvodi ({narudzbina.korpa?.length || 0})</h2>
            <div className={styles.productsList}>
              {narudzbina.korpa && narudzbina.korpa.length > 0 ? (
                narudzbina.korpa.map((item, index) => (
                  <div key={index} className={styles.productItem}>
                    {item.proizvod?.slike && item.proizvod.slike.length > 0 ? (
                      <img
                        src={`${API_BASE}/api/proizvodi/slike/${item.proizvod.slike[0]}`}
                        alt={item.proizvod.ime}
                        onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E'}
                        className={styles.productImage}
                      />
                    ) : (
                      <div className={styles.productImagePlaceholder}>
                        <i className="fas fa-image"></i>
                      </div>
                    )}
                    <div className={styles.productInfo}>
                      <h4>{item.proizvod?.ime}</h4>
                      <div className={styles.productMeta}>
                        {item.proizvod?.boja && (
                          <span>
                            <div className={styles.colorDot} style={{ backgroundColor: COLORS[item.proizvod.boja] || '#ccc' }}></div>
                            {item.proizvod.boja}
                          </span>
                        )}
                        {item.proizvod?.velicina && <span>Veličina: {item.proizvod.velicina}</span>}
                      </div>
                      <div className={styles.productPrice}>
                        {item.popust > 0 && (
                          <span className={styles.originalPrice}>{parseFloat(item.cena_po_komadu).toFixed(2)} KM</span>
                        )}
                        <span className={styles.price}>
                          {parseFloat(item.cena_sa_popustom).toFixed(2)} KM
                        </span>
                      </div>
                      <div className={styles.quantity}>
                        Količina: <strong>{item.kolicina}x</strong>
                      </div>
                    </div>
                    <div className={styles.productTotal}>
                      {parseFloat(item.ukupno).toFixed(2)} KM
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyProducts}>Nema proizvoda u ovoj porudžbini</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.backBtn}
            onClick={() => router.push('/kupac?tab=porudzbine')}
          >
            <i className="fas fa-arrow-left"></i>
            Nazad na sve porudžbine
          </button>
          <button 
            className={styles.continueBtn}
            onClick={() => router.push('/proizvodi')}
          >
            <i className="fas fa-shopping-bag"></i>
            Nastavi kupovanje
          </button>
        </div>
      </div>
    </div>
  );
}
