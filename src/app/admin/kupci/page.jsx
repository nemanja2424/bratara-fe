'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './kupci.module.css';

const API_BASE = 'https://butikirna.com';
const ITEMS_PER_PAGE = 10;

export default function KupciAdmin() {
  const router = useRouter();
  const [kupci, setKupci] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('ime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalKupciCount, setTotalKupciCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchKupci = async (page = 1, limit = itemsPerPage) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const offset = (page - 1) * limit;
      
      const response = await fetch(`${API_BASE}/api/kupci/get?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Greška pri učitavanju kupaca');
      }

      const data = await response.json();
      const kupciArray = data.kupci || [];
      setKupci(kupciArray);
      setTotalKupciCount(data.pagination?.ukupno_kupaca || 0);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Greška pri učitavanju:', err);
      setError(err.message);
      toast.error('Greška pri učitavanju kupaca: ' + err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchKupci(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, router]);

  const totalPages = Math.ceil(totalKupciCount / itemsPerPage);
  const displayedKupci = kupci;

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
    // TODO: Implementirati server-side sortiranje sa sortBy i sortOrder parametrima
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return 'fas fa-sort';
    return sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Učitavanje kupaca...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Kupci</h1>
          <p>Ukupno kupaca: <strong>{totalKupciCount}</strong></p>
        </div>
      </div>

      <div className={styles.tableSection}>
        {/* Stavki po stranici i Results Info */}
        <div className={styles.controlsBar}>
          <div className={styles.itemsPerPageBar}>
            <label>Stavki po stranici:</label>
            <select 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Results Info */}
          <div className={styles.resultInfo}>
            <span>
              Prikazano <strong>{displayedKupci.length}</strong> od <strong>{totalKupciCount}</strong> kupaca
            </span>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          {displayedKupci.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="fas fa-inbox"></i>
              <h3>Nema Kupaca</h3>
              <p>Nema kupaca koji odgovaraju vašoj pretrazi</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.idColumn}>
                    <button className={styles.sortBtn} onClick={() => handleSort('id')}>
                      ID <i className={getSortIcon('id')}></i>
                    </button>
                  </th>
                  <th className={styles.imeColumn}>
                    <button className={styles.sortBtn} onClick={() => handleSort('ime')}>
                      Ime <i className={getSortIcon('ime')}></i>
                    </button>
                  </th>
                  <th className={styles.prezimeColumn}>
                    <button className={styles.sortBtn} onClick={() => handleSort('prezime')}>
                      Prezime <i className={getSortIcon('prezime')}></i>
                    </button>
                  </th>
                  <th className={styles.emailColumn}>
                    <button className={styles.sortBtn} onClick={() => handleSort('email')}>
                      Email <i className={getSortIcon('email')}></i>
                    </button>
                  </th>
                  <th className={styles.telefonColumn}>Telefon</th>
                  <th className={styles.adresaColumn}>Adresa</th>
                </tr>
              </thead>
              <tbody>
                {displayedKupci.map((kupac, index) => (
                  <tr key={kupac.id || index} className={index % 2 === 0 ? styles.rowEven : ''}>
                    <td className={styles.idColumn}>
                      <span className={styles.idBadge}>{kupac.id}</span>
                    </td>
                    <td className={styles.imeColumn}>
                      <div className={styles.kupacName}>
                        <i className="fas fa-user"></i>
                        {kupac.ime || '-'}
                      </div>
                    </td>
                    <td className={styles.prezimeColumn}>{kupac.prezime || '-'}</td>
                    <td className={styles.emailColumn}>
                      <a href={`mailto:${kupac.email}`} title={kupac.email}>
                        {kupac.email || '-'}
                      </a>
                    </td>
                    <td className={styles.telefonColumn}>
                      <a href={`tel:${kupac.telefon}`} title={kupac.telefon}>
                        {kupac.telefon || '-'}
                      </a>
                    </td>
                    <td className={styles.adresaColumn}>{kupac.adresa || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className={styles.pageBtn}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
