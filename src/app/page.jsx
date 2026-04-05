'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
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
        </div>
        <div className={styles.heroImage}>
          <div className={styles.heroPlaceholder}>
            <i className="fas fa-sparkles fa-gradient"></i>
          </div>
        </div>
      </div>

      <section className={styles.features}>
        <div className={styles.container}>
          <h2>Zašto Butik Irna?</h2>
          <div className={styles.featureGrid}>
            <FeatureCard
              icon="fas fa-truck"
              title="Brza Dostava"
              description="Dostava na vašu adresu u roku od 2-3 radna dana"
            />
            <FeatureCard
              icon="fas fa-credit-card"
              title="Sigurna Plaćanja"
              description="Sve metode plaćanja su enkriptovane i sigurne"
            />
            <FeatureCard
              icon="fas fa-sync-alt"
              title="Povrat Garantovan"
              description="30 dana za povrat ili zamjenu bez uzroka"
            />
            <FeatureCard
              icon="fas fa-trophy"
              title="Kvaliteta 100%"
              description="Samo proizvodi od najboljih materijala"
            />
          </div>
        </div>
      </section>

      <section className={styles.cta}>
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
    <div className={styles.featureCard}>
      <div className={styles.featureIcon}>
        <i className={`${icon} fa-gradient`}></i>
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
