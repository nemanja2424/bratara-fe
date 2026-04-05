


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
                    title="Narudžbe" 
                    description="Pregled svih narudžbi korisnika"
                    link="/admin/narudzbe"
                    icon="fas fa-shopping-cart"
                    color="linear-gradient(135deg, #ffc107 0%, #ff9800 100%)"
                />
                <DashboardCard 
                    title="Upravljaj proizvodima" 
                    description="Pregled i uređivanje svih proizvoda"
                    link="/admin/proizvodi"
                    icon="fas fa-box"
                    color="linear-gradient(135deg, #28a745 0%, #1e7e34 100%)"
                />
                <DashboardCard 
                    title="Kupci" 
                    description="Dodaj novi proizvod u katalog"
                    link="/admin/kupci"
                    icon="fas fa-users"
                    color="linear-gradient(135deg, #007bff 0%, #0056cc 100%)"
                />
                <DashboardCard 
                    title="Nalog" 
                    description="Upravljanje svojim nalogom"
                    link="/admin/nalog"
                    icon="fas fa-user"
                    color="linear-gradient(135deg, #17a2b8 0%, #0c5460 100%)"
                />
                <DashboardCard 
                    title="Kategorije" 
                    description="Upravljanje kategorijama proizvoda"
                    link="/admin/kategorije"
                    icon="fas fa-list"
                    color="linear-gradient(135deg, #014fb4 0%, #0066e0 100%)"
                />
                <DashboardCard 
                    title="Statistika" 
                    description="Analitika i izvještaji"
                    link="/admin/statistika"
                    icon="fas fa-chart-bar"
                    color="linear-gradient(135deg, #6f42c1 0%, #4b2f7e 100%)"
                />
            </div>
        </div>
    );
}

function DashboardCard({ title, description, link, icon, color }) {
    return (
        <div 
            onClick={() => window.open(link, '_blank')}
            className={styles.card}
            style={{ background: color }}
        >
            <div className={styles.cardIcon}>
                <i className={icon}></i>
            </div>
            <h3>{title}</h3>
            <p>{description}</p>
            <span className={styles.cardArrow}>→</span>
        </div>
    );
}