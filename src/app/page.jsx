'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import styles from "./page.module.css";

const API_BASE = 'http://127.0.0.1:5000';

export default function Home() {
  const router = useRouter();
  const [proizvodi, setProizvodi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Intersection Observer za animacije na scroll
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('observed-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Počni sa observovanjem nakon što se komponenta montira
    setTimeout(() => {
      document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
      });
    }, 50);

    return () => observer.disconnect();
  }, []);

  // Re-observe elemente kada se proizvodi učitaju
  useEffect(() => {
    if (proizvodi.length > 0) {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('observed-visible');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
      });

      return () => observer.disconnect();
    }
  }, [proizvodi]);

  useEffect(() => {
    const fetchProizvodi = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * itemsPerPage;
        const params = new URLSearchParams();
        params.append('limit', itemsPerPage);
        params.append('offset', offset);
        params.append('group_by', 'code_base');
        params.append('min_stanje', 1);  // Samo dostupni proizvodi
        params.append('sort_by', 'popust');  // Sortiraj po popustu
        params.append('sort_order', 'desc');  // Najveći popust prvi

        const response = await fetch(`${API_BASE}/api/proizvodi/get?${params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Greška pri učitavanju proizvoda');
        const data = await response.json();
        setProizvodi(data.proizvodi || []);
      } catch (err) {
        console.error('Greška:', err);
        setProizvodi([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProizvodi();
  }, [currentPage]);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.badgeDot}></span>
            Kolekciјa 2026 - Novi Proizvodi
          </div>
          <h1>Butik Irna</h1>
          <p>Pronađite savršenu stilaciju za svaku priliku</p>
          <div className={styles.heroCtas}>
            <button 
              className={styles.primaryBtn}
              onClick={() => router.push('/proizvodi')}
            >
              Pregledaj proizvode
            </button>
            <button 
              className={styles.secondaryBtn}
              onClick={() => router.push('/o-nama')}
            >
              Saznaj više
            </button>
          </div>
          <p className={styles.heroSubtext}>Dostupno u preko 50 stilova i boja</p>
        </div>
        <div className={styles.heroImage}>
          <div className={styles.orbitContainer}>
            <div className={styles.orbitRing}></div>
            <div className={styles.orbitRing} style={{animationDelay: '1s'}}></div>
            <div className={styles.orbitRing} style={{animationDelay: '2s'}}></div>
          </div>
          <div className={styles.heroPlaceholder}>
            <div className={styles.fashionFigure}>
              <div className={styles.fashionCenter}>NOVO</div>
              <div className={styles.fashionOrbit} style={{animationDelay: '0s'}}>
                <i className="fas fa-heart"></i>
              </div>
              <div className={styles.fashionOrbit} style={{animationDelay: '0.5s'}}>
                <i className="fas fa-star"></i>
              </div>
              <div className={styles.fashionOrbit} style={{animationDelay: '1s'}}>
                <i className="fas fa-shopping-bag"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <section className={styles.productsSection} data-animate>
        <div className={styles.container}>
          <h2>Preporučeni Proizvodi</h2>
          <p className={styles.sectionSubtitle}>Pronađite nove stilove iz naše kolekcije</p>
          
          {loading ? (
            <div className={styles.loadingGrid}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}></div>
              ))}
            </div>
          ) : proizvodi.length > 0 ? (
            <>
              <div className={styles.productsGrid}>
                {proizvodi.map((proizvod) => (
                  <ProductCard 
                    key={proizvod.code_base} 
                    proizvod={proizvod}
                    onClick={() => router.push(`/proizvodi/${proizvod.code_base}`)}
                  />
                ))}
              </div>
              <div className={styles.browseAll}>
                <button 
                  className={styles.browseAllBtn}
                  onClick={() => router.push('/proizvodi')}
                >
                  Pregledaj sve proizvode →
                </button>
              </div>
            </>
          ) : (
            <div className={styles.noProducts}>
              <p>Nema dostupnih proizvoda</p>
            </div>
          )}
        </div>
      </section>

      <section className={styles.cta} data-animate>
        <div className={styles.ctaContent}>
          <h2>Spreman za narudžbu?</h2>
          <p>Otvori račun ili nastavi sa kupovinom bez registracije</p>
          <div className={styles.ctaButtons}>
            <button 
              className={styles.ctaPrimaryBtn}
              onClick={() => router.push('/login')}
            >
              Prijavi se
            </button>
            <button 
              className={styles.ctaSecondaryBtn}
              onClick={() => router.push('/proizvodi')}
            >
              Nastavi kupovanje
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className={styles.featureCard} data-animate>
      <div className={styles.featureIcon}>
        <i className={`${icon} fa-gradient`}></i>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function ProductCard({ proizvod, onClick }) {
  const discountedPrice = proizvod.popust > 0 
    ? Math.round(proizvod.cena - (proizvod.cena * proizvod.popust / 100))
    : proizvod.cena;

  return (
    <div className={styles.productCard} onClick={onClick} data-animate>
      <div className={styles.productImage}>
        {proizvod.slike && proizvod.slike.length > 0 ? (
          <img 
            src={`${API_BASE}/api/proizvodi/slike/${proizvod.slike[0]}`}
            alt={proizvod.ime}
            onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3C/svg%3E'}
          />
        ) : (
          <div className={styles.noImage}>
            <i className="fas fa-image"></i>
          </div>
        )}
        {proizvod.popust > 0 && (
          <div className={styles.discountBadge}>
            -{proizvod.popust}%
          </div>
        )}
      </div>
      <div className={styles.productInfo}>
        <h3>{proizvod.ime}</h3>
        <p className={styles.category}>{proizvod.kategorija}</p>
        <div className={styles.priceSection}>
          {proizvod.popust > 0 ? (
            <>
              <span className={styles.originalPrice}>
                <span className={styles.strikeThroughPrice}>{proizvod.cena}</span>
                <span className={styles.strikeThrough}></span>
              </span>
              <span className={styles.discountedPrice}>{discountedPrice} KM</span>
            </>
          ) : (
            <span className={styles.price}>{proizvod.cena} KM</span>
          )}
        </div>
        <button 
          className={styles.cartBtn}
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Dodaj u korpu
          }}
          title="Dodaj u korpu"
        >
          <i className="fas fa-shopping-cart"></i>
          Dodaj u korpu
        </button>
      </div>
    </div>
  );
}
