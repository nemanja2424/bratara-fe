'use client';

import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function About() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>O Nama</h1>
          <p>Irna butik - gdje stil susreće svakodnevnicu</p>
          <div className={styles.heroCtas}>
            <button 
              className={styles.primaryBtn}
              onClick={() => router.push('/proizvodi')}
            >
              Pregledaj proizvode
            </button>
            <button 
              className={styles.secondaryBtn}
              onClick={() => router.push('/kontakt')}
            >
              Kontaktiraj nas
            </button>
          </div>
        </div>
        <div className={styles.heroImage}>
        </div>
      </div>

      <section className={styles.aboutContent}>
        <div className={styles.aboutContainer}>
          <article className={styles.aboutText}>
            <h2>Naša Priča</h2>
            
            <p>
              Irna butik je osnovan 2022. godine s jasnom vizijom – ponuditi pažljivo odabrane modne komade koji spajaju kvalitet, stil i pristupačnost. Od samog početka, naš fokus bio je na raznovrsnoj ponudi obuće, torbi i modnih dodataka za žene i muškarce, uključujući novčanike, kaiševe, marame, šalove i druge detalje koji upotpunjuju svaki stil.
            </p>

            <p>
              Prateći potrebe naših kupaca i savremene modne trendove, nedavno smo napravili značajan iskorak i proširili naš asortiman uvođenjem ženske konfekcije. Na taj način, Irna butik postaje mjesto gdje možete pronaći kompletnu modnu kombinaciju – od odjeće do dodataka – na jednom mjestu.
            </p>

            <h3>Naš Pristup</h3>

            <p>
              Posebnu pažnju posvećujemo kvaliteti proizvoda, ali i iskustvu kupovine. Zato smo omogućili dostavu na području cijele Bosne i Hercegovine, kako bismo naše proizvode učinili dostupnim svima, bez obzira na lokaciju.
            </p>

            <h3>Radno vrijeme</h3>

            <p>
              Naš butik se nalazi na adresi <strong>Džemala Bijedića 4</strong> (u redu glavne pošte) u Tuzli. Radno vrijeme je radnim danima od <strong>09:00 do 18:00</strong> sati, subotom od <strong>09:00 do 15:00</strong> sati, dok je nedjelja neradna.
            </p>

            <p>
              Online narudžbe su dostupne u bilo koje vrijeme, a nakon kupovine kupci putem e-maila dobijaju detaljne informacije o svojoj narudžbi.
            </p>

            <h3>Naša Vizija</h3>

            <p>
              Irna nije samo butik – to je prostor gdje stil susreće svakodnevnicu, a zadovoljstvo kupaca ostaje naš najveći prioritet.
            </p>
          </article>
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
