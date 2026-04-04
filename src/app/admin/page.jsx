


'use client';

import { useRouter } from 'next/navigation';
import useLogout from '@/hooks/useLogout';
import styles from './admin.module.css';

export default function AdminPage() {
    const logout = useLogout();
    const router = useRouter();

    return (
        <div className={styles.adminContainer}>
            <div className={styles.headerSection}>
                <h1>Admin Panel</h1>
                <p className={styles.subtitle}>Upravljajte online shopom</p>
            </div>

            <div className={styles.dashboardGrid}>
                <DashboardCard 
                    title="Dodaj proizvod" 
                    description="Dodaj novi proizvod u katalog"
                    link="/admin/dodaj-proizvod"
                    icon="➕"
                    color="linear-gradient(135deg, #007bff 0%, #0056cc 100%)"
                />
                <DashboardCard 
                    title="Upravljaj proizvodima" 
                    description="Pregled i uređivanje svih proizvoda"
                    link="/admin/proizvodi"
                    icon="📦"
                    color="linear-gradient(135deg, #28a745 0%, #1e7e34 100%)"
                />
                <DashboardCard 
                    title="Narudžbe" 
                    description="Pregled svih narudžbi korisnika"
                    link="/admin/narudzbe"
                    icon="🛒"
                    color="linear-gradient(135deg, #ffc107 0%, #ff9800 100%)"
                />
                <DashboardCard 
                    title="Korisnici" 
                    description="Upravljanje korisničkim računima"
                    link="/admin/korisnici"
                    icon="👥"
                    color="linear-gradient(135deg, #17a2b8 0%, #0c5460 100%)"
                />
                <DashboardCard 
                    title="Statistika" 
                    description="Analitika i izvještaji"
                    link="/admin/statistika"
                    icon="📊"
                    color="linear-gradient(135deg, #6f42c1 0%, #4b2f7e 100%)"
                />
                <DashboardCard 
                    title="Postavke" 
                    description="Konfiguracija online shopa"
                    link="/admin/postavke"
                    icon="⚙️"
                    color="linear-gradient(135deg, #868e96 0%, #495057 100%)"
                />
            </div>
        </div>
    );
}

function DashboardCard({ title, description, link, icon, color }) {
    const router = useRouter();

    return (
        <div 
            onClick={() => router.push(link)}
            className={styles.card}
            style={{ background: color }}
        >
            <div className={styles.cardIcon}>{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
            <span className={styles.cardArrow}>→</span>
        </div>
    );
}