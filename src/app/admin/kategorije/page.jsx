'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './kategorije.module.css';

const API_BASE = 'http://127.0.0.1:5000';
const ITEMS_PER_PAGE = 50;

export default function KategorijeAdmin() {
  const router = useRouter();
  const [kategorije, setKategorije] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    kategorija: '',
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch kategorije
  useEffect(() => {
    if (!isMounted) return;

    const fetchKategorije = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('Niste autentifikovani. Molimo vas da se prijavite.');
          return;
        }

        const response = await fetch(`${API_BASE}/api/kategorije/get`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Greška: ${response.status}`);
        }

        const data = await response.json();
        const kategorijeLista = data.kategorije || [];
        setKategorije(kategorijeLista);
      } catch (err) {
        console.error('Greška pri učitavanju kategorija:', err);
        setError(err.message || 'Greška pri učitavanju kategorija');
      } finally {
        setLoading(false);
      }
    };

    fetchKategorije();
  }, [isMounted]);

  // Filtriraj i sortiraj kategorije
  const filteredAndSorted = useMemo(() => {
    let result = kategorije.filter(kat =>
      kat.kategorija.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let aVal = a.kategorija;
      let bVal = b.kategorija;

      if (sortBy === 'id') {
        aVal = a.id;
        bVal = b.id;
      } else if (sortBy === 'status') {
        aVal = a.active;
        bVal = b.active;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [kategorije, searchTerm, sortBy, sortOrder]);

  // Paginacija
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedKategorije = filteredAndSorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ kategorija: '' });
    setShowModal(true);
  };

  const handleEditClick = (kategorija) => {
    setEditingId(kategorija.id);
    setFormData({
      kategorija: kategorija.kategorija || '',
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    setDeleteConfirmId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const id = deleteConfirmId;
    setShowDeleteConfirm(false);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/kategorije/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Greška pri brisanju: ${response.status}`);
      }

      setKategorije(kategorije.filter(k => k.id !== id));
      toast.success('✅ Kategorija je uspešno obrisana!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Greška pri brisanju kategorije:', err);
      toast.error(`❌ ${err.message}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.kategorija.trim()) {
      toast.error('❌ Molimo unesite naziv kategorije', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId 
        ? `${API_BASE}/api/kategorije/put` 
        : `${API_BASE}/api/kategorije/post`;

      // Za POST - šalјamo samo kategorija
      // Za PUT - šalјamo id i kategorija
      let body;
      if (editingId) {
        const existingKat = kategorije.find(k => k.id === editingId);
        body = { 
          id: editingId, 
          kategorija: formData.kategorija,
          active: existingKat?.active || true
        };
      } else {
        body = { kategorija: formData.kategorija };
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Greška pri čuvanju: ${response.status}`);
      }

      if (editingId) {
        // PUT - koristi vraćeni objekat iz responsa
        const updatedKat = data.kategorija;
        setKategorije(kategorije.map(k => 
          k.id === editingId ? updatedKat : k
        ));
        toast.success('✅ Kategorija je uspešno ažurirana!', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        // POST - koristi vraćeni objekat iz responsa
        const newKat = data.kategorija;
        setKategorije([...kategorije, newKat]);
        toast.success('✅ Kategorija je uspešno dodata sa ID: ' + newKat.id, {
          position: 'top-right',
          autoClose: 3000,
        });
      }

      setShowModal(false);
      setFormData({ kategorija: '' });
    } catch (err) {
      console.error('Greška pri čuvanju kategorije:', err);
      toast.error(`❌ ${err.message}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleToggleActive = async (kategorija) => {
    try {
      const token = localStorage.getItem('access_token');
      const newActiveStatus = !kategorija.active;

      const response = await fetch(`${API_BASE}/api/kategorije/put`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: kategorija.id,
          kategorija: kategorija.kategorija,
          active: newActiveStatus
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Greška pri ažuriranju: ${response.status}`);
      }

      const updatedKat = data.kategorija;
      setKategorije(kategorije.map(k => 
        k.id === kategorija.id ? updatedKat : k
      ));

      toast.success(`✅ Kategorija je sada ${updatedKat.active ? 'aktivna' : 'neaktivna'}!`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Greška pri promeni statusa:', err);
      toast.error(`❌ ${err.message}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ kategorija: '' });
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return 'fas fa-sort';
    return sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  };

  if (!isMounted) return null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>
            Kategorije
          </h1>
          <p>Upravljajte kategorijama vašeg online shopu</p>
        </div>
        <button className={styles.addButton} onClick={handleAddClick}>
          <i className="fas fa-plus"></i>
          Dodaj Kategoriju
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loading}>
          <i className="fas fa-spinner"></i>
          <p style={{ marginTop: '20px', color: '#0099cc', fontSize: '1.1rem' }}>
            Učitavanje kategorija...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className={styles.error}>
          <i className="fas fa-exclamation-circle"></i>
          <p><strong>Greška:</strong> {error}</p>
          <button 
            className={styles.addButton}
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
          >
            <i className="fas fa-redo"></i>
            Pokušaj Ponovo
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && kategorije.length === 0 && (
        <div className={styles.emptyState}>
          <i className="fas fa-inbox"></i>
          <h3>Nema Kategorija</h3>
          <p>Počnite dodavanjem prve kategorije za vaš shop</p>
          <button className={styles.addButton} onClick={handleAddClick}>
            <i className="fas fa-plus"></i>
            Dodaj Prvu Kategoriju
          </button>
        </div>
      )}

      {/* Table View */}
      {!loading && !error && kategorije.length > 0 && (
        <div className={styles.tableSection}>
          {/* Search Bar */}
          <div className={styles.searchBar}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Pretraži kategorije..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          {/* Results Info */}
          <div className={styles.resultInfo}>
            <span>
              Prikazano <strong>{paginatedKategorije.length}</strong> od <strong>{filteredAndSorted.length}</strong> kategorija
              {searchTerm && ` (Ukupno: ${kategorije.length})`}
            </span>
          </div>

          {/* Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.idColumn}>
                    <button className={styles.sortBtn} onClick={() => handleSort('id')}>
                      ID <i className={getSortIcon('id')}></i>
                    </button>
                  </th>
                  <th className={styles.nameColumn}>
                    <button className={styles.sortBtn} onClick={() => handleSort('name')}>
                      Naziv <i className={getSortIcon('name')}></i>
                    </button>
                  </th>
                  <th className={styles.statusColumn}>
                    <button className={styles.sortBtn} onClick={() => handleSort('status')}>
                      Status <i className={getSortIcon('status')}></i>
                    </button>
                  </th>
                  <th className={styles.actionColumn}>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {paginatedKategorije.map((kat, index) => (
                  <tr key={kat.id} className={index % 2 === 0 ? styles.rowEven : ''}>
                    <td className={styles.idColumn}>
                      <span className={styles.idBadge}>{kat.id}</span>
                    </td>
                    <td className={styles.nameColumn}>
                      <div className={styles.categoryName}>
                        <i className="fas fa-tag"></i>
                        {kat.kategorija}
                      </div>
                    </td>
                    <td className={styles.statusColumn}>
                      <button
                        className={`${styles.statusBadge} ${kat.active ? styles.activeBadge : styles.inactiveBadge}`}
                        onClick={() => handleToggleActive(kat)}
                        title={kat.active ? 'Klikni da deaktivirate' : 'Klikni da aktivirate'}
                      >
                        <i className={kat.active ? 'fas fa-check-circle' : 'fas fa-circle'}></i>
                        {kat.active ? 'Aktivna' : 'Neaktivna'}
                      </button>
                    </td>
                    <td className={styles.actionColumn}>
                      <button
                        className={styles.actionBtnEdit}
                        onClick={() => handleEditClick(kat)}
                        title="Uredi"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        className={styles.actionBtnDelete}
                        onClick={() => handleDeleteClick(kat.id)}
                        title="Obriši"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <i className="fas fa-edit"></i>
                {editingId ? 'Uredi Kategoriju' : 'Nova Kategorija'}
              </h2>
              <p>{editingId ? 'Ažurirajte detalje kategorije' : 'Kreirajte novu kategoriju'}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>
                  <i className="fas fa-heading"></i>
                  Naziv Kategorije
                </label>
                <input
                  type="text"
                  name="kategorija"
                  value={formData.kategorija}
                  onChange={handleInputChange}
                  placeholder="npr. Patike, Duksevi..."
                  autoFocus
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button"
                  className={styles.modalBtn + ' ' + styles.secondary}
                  onClick={handleCloseModal}
                >
                  <i className="fas fa-times"></i>
                  Otkaži
                </button>
                <button 
                  type="submit"
                  className={styles.modalBtn + ' ' + styles.primary}
                >
                  <i className="fas fa-check"></i>
                  Sačuvaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={cancelDelete}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <i className="fas fa-exclamation-triangle" style={{ color: '#e74c3c' }}></i>
                Potvrdi Brisanje
              </h2>
              <p>Ova akcija se ne može poništiti</p>
            </div>

            <p style={{
              color: '#666',
              fontSize: '1rem',
              lineHeight: '1.6',
              textAlign: 'center',
              marginBottom: '30px'
            }}>
              Da li ste sigurni da želite da obrišete ovu kategoriju?
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalBtn + ' ' + styles.secondary}
                onClick={cancelDelete}
              >
                <i className="fas fa-times"></i>
                Otkaži
              </button>
              <button
                type="button"
                className={styles.modalBtn + ' ' + styles.primary}
                onClick={confirmDelete}
                style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
              >
                <i className="fas fa-trash"></i>
                Obriši
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}