'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './porudzbine.module.css';

const API_BASE = 'https://butikirna.com';
const ITEMS_PER_PAGE = 10;

// Mapiranje statusa sa backend vrednostima
const STATUS_MAP = {
  'u_pripremi': { label: 'U pripremi', value: 'u_pripremi' },
  'u_tranzitu': { label: 'U tranzitu', value: 'u_tranzitu' },
  'dostavljeno': { label: 'Dostavljeno', value: 'dostavljeno' },
  'nedostavljeno': { label: 'Nije preuzeto', value: 'nedostavljeno' },
};

const STATUS_OPTIONS = Object.values(STATUS_MAP);

export default function PoruzdbineAdmin() {
  const router = useRouter();
  const [porudzbine, setPorudzbine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [filterStatus, setFilterStatus] = useState('');

  // Fetch porudzbine
  const fetchPorudzbine = async (limit = itemsPerPage, offset = 0, search = '', sort = sortBy, order = sortOrder, status = filterStatus) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit,
        offset,
        sort_by: sort,
        sort_order: order,
      });
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/porudzbine/get?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Greška pri učitavanju porudzbina');

      const data = await response.json();
      setPorudzbine(data.porudzbine || []);
      setTotalCount(data.pagination?.ukupno || 0);
    } catch (err) {
      console.error('Greška:', err);
      toast.error('⚠️ Greška pri učitavanju porudzbina');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Učitaj porudzbine pri montaži
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const offset = (currentPage - 1) * itemsPerPage;
      fetchPorudzbine(itemsPerPage, offset, searchTerm, sortBy, sortOrder, filterStatus);
    }
  }, [currentPage, itemsPerPage, searchTerm, sortBy, sortOrder, filterStatus, isMounted]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleSortIcon = (column) => {
    if (sortBy !== column) return 'fas fa-sort';
    return sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  };

  const handleStatusChange = async (porudzbinaId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [porudzbinaId]: true }));
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/porudzbine/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: porudzbinaId,
          status: newStatus,
        }),
      });

      if (!response.ok) throw new Error('Greška pri ažuriranju statusa');

      // Ažuriraj lokalnu listu
      setPorudzbine(prev =>
        prev.map(p => p.id === porudzbinaId ? { ...p, status: newStatus } : p)
      );

      toast.success('✅ Status je ažuriran');
    } catch (err) {
      console.error('Greška:', err);
      toast.error('⚠️ Greška pri ažuriranju statusa');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [porudzbinaId]: false }));
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (!isMounted) {
    return <div>Učitavanje...</div>;
  }

  return (
    <div className={styles.page}>
      <ToastContainer />
      
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Porudžbine</h1>
          <p>Upravljanje i pregled svih porudžbina</p>
        </div>

        {/* Kontrole */}
        <div className={styles.controls}>
          <form className={styles.searchBox} onSubmit={handleSearch}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Pretraga po imenu, email-u, adresi..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit">Pretraži</button>
          </form>

          <div className={styles.rightControls}>
            <select 
              value={filterStatus} 
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              title="Filtriraj po statusu"
            >
              <option value="">Svi statusi</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>


            <select 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5 stavki</option>
              <option value={10}>10 stavki</option>
              <option value={20}>20 stavki</option>
              <option value={50}>50 stavki</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className={styles.loading}>Učitavanje porudžbina...</div>
        ) : error ? (
          <div className={styles.error}>Greška: {error}</div>
        ) : porudzbine.length === 0 ? (
          <div className={styles.empty}>
            <i className="fas fa-inbox"></i>
            <p>Nema porudžbina</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.idColumn}>
                      <button className={styles.sortBtn} onClick={() => handleSort('id')}>
                        ID <i className={handleSortIcon('id')}></i>
                      </button>
                    </th>
                    <th className={styles.nameColumn}>
                      <button className={styles.sortBtn} onClick={() => handleSort('ime')}>
                        Ime i Prezime <i className={handleSortIcon('ime')}></i>
                      </button>
                    </th>
                    <th className={styles.emailColumn}>
                      <button className={styles.sortBtn} onClick={() => handleSort('email')}>
                        Email <i className={handleSortIcon('email')}></i>
                      </button>
                    </th>
                    <th className={styles.telefonColumn} style={{ textAlign: 'center' }}>Telefon</th>
                    <th className={styles.adresaColumn}>
                      <button className={styles.sortBtn} onClick={() => handleSort('adresa')}>
                        Lokacija <i className={handleSortIcon('adresa')}></i>
                      </button>
                    </th>
                    <th className={styles.datumColumn} style={{ textAlign: 'center' }}>
                      <button className={styles.sortBtn} onClick={() => handleSort('created_at')}>
                        Datum <i className={handleSortIcon('created_at')}></i>
                      </button>
                    </th>
                    <th className={styles.actionColumn} style={{ textAlign: 'center' }}>
                      <button className={styles.sortBtn} onClick={() => handleSort('status')}>
                        Status <i className={handleSortIcon('status')}></i>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {porudzbine.map((porudzbina, index) => (
                    <tr 
                      key={porudzbina.id} 
                      className={`${styles.row} ${index % 2 === 0 ? styles.rowEven : ''}`}
                      onClick={() => router.push(`/admin/porudzbine/${porudzbina.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className={styles.idColumn}>
                        <span className={styles.idBadge}>#{porudzbina.id}</span>
                      </td>
                      <td className={styles.nameColumn}>
                        <div className={styles.name}>
                          <i className="fas fa-user"></i>
                          {porudzbina.ime} {porudzbina.prezime}
                        </div>
                      </td>
                      <td className={styles.emailColumn}>
                        <a href={`mailto:${porudzbina.email}`} onClick={(e) => e.stopPropagation()}>
                          {porudzbina.email}
                        </a>
                      </td>
                      <td className={styles.telefonColumn} style={{ textAlign: 'center' }}>
                        <a href={`tel:${porudzbina.telefon}`} onClick={(e) => e.stopPropagation()}>
                          {porudzbina.telefon}
                        </a>
                      </td>
                      <td className={styles.adresaColumn}>
                        {porudzbina.adresa}
                      </td>
                      <td className={styles.datumColumn} style={{ textAlign: 'center' }}>
                        <span className={styles.datumBadge}>
                          {new Date(porudzbina.created_at).toLocaleDateString('sr-RS')}
                        </span>
                      </td>
                      <td className={styles.actionColumn} style={{ textAlign: 'center' }}>
                        <select
                          value={porudzbina.status || 'pending'}
                          onChange={(e) => handleStatusChange(porudzbina.id, e.target.value)}
                          disabled={updatingStatus[porudzbina.id]}
                          className={styles.statusSelect}
                          onClick={(e) => e.stopPropagation()}
                          title="Promeni status porudžbine"
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginacija */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button 
                  onClick={() => setCurrentPage(1)} 
                  disabled={currentPage === 1}
                >
                  ⏮
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                >
                  ◀
                </button>

                <div className={styles.pageNumbers}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={page}
                        className={currentPage === page ? styles.activePage : ''}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                >
                  ▶
                </button>
                <button 
                  onClick={() => setCurrentPage(totalPages)} 
                  disabled={currentPage === totalPages}
                >
                  ⏭
                </button>
              </div>
            )}

            {/* Info */}
            <div className={styles.info}>
              Prikazujem {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} od {totalCount} porudžbina
            </div>
          </>
        )}
      </div>
    </div>
  );
}
