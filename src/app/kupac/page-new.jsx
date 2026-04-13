'use client';

import { Suspense } from 'react';
import KupacContent from './KupacContent';
import styles from './kupac.module.css';

export default function KupacPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingMessage}>Učitavanje...</div>
        </div>
      </div>
    }>
      <KupacContent />
    </Suspense>
  );
}
