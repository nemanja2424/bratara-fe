'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useCart } from '@/hooks/useCart';
import { useFavoritesContext } from '@/context/FavoritesContext';
import useLogout from '@/hooks/useLogout';
import styles from './kupac.module.css';

const API_BASE = 'http://127.0.0.1:5000';

export default function KupacContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logout = useLogout();
  const { cartItems, getTotalPrice, getOriginalPrice, getSavings } = useCart();
  const { favorites, removeFavorite } = useFavoritesContext();

  // User state
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('licni-podaci');
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [porudzbine, setPorudzbine] = useState([]);
  const [loadingPorudzbine, setLoadingPorudzbine] = useState(false);

  // Edit mode fields
  const [editData, setEditData] = useState({
    ime: '',
    prezime: '',
    email: '',
    telefon: '',
    postanskiBroj: '',
    grad: '',
    adresa: '',
  });

  // Password change fields
  const [passwordData, setPasswordData] = useState({
    old_pwd: '',
    new_pwd: '',
    new_pwd_confirm: '',
  });

  // Učitaj user podatke pri montaži
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Učitaj tab iz URL params
  useEffect(() => {
    if (isMounted) {
      const tabParam = searchParams.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, [isMounted, searchParams]);

  useEffect(() => {
    if (isMounted) {
      fetchUserData();
    }
  }, [isMounted]);

  const fetchPorudzbine = useCallback(async () => {
    try {
      setLoadingPorudzbine(true);
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        setPorudzbine([]);
        return;
      }

      const response = await fetch(`${API_BASE}/api/porudzbine/get`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Greška pri učitavanju porudžbina');
      }

      const data = await response.json();
      setPorudzbine(data.porudzbine || []);
    } catch (err) {
      console.error('Greška pri učitavanju porudžbina:', err);
      setPorudzbine([]);
    } finally {
      setLoadingPorudzbine(false);
    }
  }, []);

  // Učitaj porudžbine kada se tab promeni na 'porudzbine'
  useEffect(() => {
    if (activeTab === 'porudzbine' && isMounted) {
      fetchPorudzbine();
    }
  }, [activeTab, isMounted, fetchPorudzbine]);

  // Funkcija za promenu taba sa URL update-om
  const handleTabChange = useCallback((tabName) => {
    setActiveTab(tabName);
    router.push(`/kupac?tab=${tabName}`, { shallow: true });
  }, [router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setToken(accessToken);

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Greška pri učitavanju podataka');
      }

      const data = await response.json();
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Greška pri učitavanju korisnika:', err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Učitaj detalje omiljenih proizvoda
  useEffect(() => {
    if (favorites.length > 0) {
      fetchFavoriteProducts();
    } else {
      setFavoriteProducts([]);
    }
  }, [favorites]);

  const fetchFavoriteProducts = useCallback(async () => {
    setLoadingFavorites(true);
    try {
      const favoriteDetails = await Promise.all(
        favorites.map(async (code) => {
          try {
            const response = await fetch(
              `${API_BASE}/api/proizvodi/get?search=${code}&limit=1`
            );
            if (response.ok) {
              const data = await response.json();
              return data.proizvodi?.[0] || null;
            }
          } catch (err) {
            console.error(`Greška pri učitavanju proizvoda ${code}:`, err);
          }
          return null;
        })
      );
      setFavoriteProducts(favoriteDetails.filter(p => p !== null));
    } catch (err) {
      console.error('Greška pri učitavanju omiljenih:', err);
    }
    setLoadingFavorites(false);
  }, [favorites]);

  // Ažuriraj edited data kada se user promeni
  useEffect(() => {
    if (user) {
      const addressParts = user.adresa?.split(', ') || [];
      const postalAndCity = addressParts[0]?.split(' ') || [];
      const postanskiBroj = postalAndCity[0] || '';
      const grad = postalAndCity.slice(1).join(' ') || '';
      const adresa = addressParts.slice(1).join(', ') || '';

      setEditData({
        ime: user.ime || '',
        prezime: user.prezime || '',
        email: user.email || '',
        telefon: user.telefon || '',
        postanskiBroj: postanskiBroj,
        grad: grad,
        adresa: adresa,
      });
    }
  }, [user, isEditMode]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingMessage}>Učitavanje...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.notLoggedIn}>
            <i className="fas fa-lock"></i>
            <h2>Nije pristup</h2>
            <p>Molim prijavite se da vidite vaš profil</p>
            <button 
              className={styles.loginBtn}
              onClick={() => router.push('/login')}
            >
              Prijavi se
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    if (!editData.ime.trim() || !editData.prezime.trim() || !editData.email.trim() || 
        !editData.telefon.trim() || !editData.postanskiBroj.trim() || 
        !editData.grad.trim() || !editData.adresa.trim()) {
      toast.error('⚠️ Sva polja su obavezna');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ime: editData.ime,
          prezime: editData.prezime,
          email: editData.email,
          telefon: editData.telefon,
          adresa: `${editData.postanskiBroj} ${editData.grad}, ${editData.adresa}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Greška pri ažuriranju podataka');
      }

      const data = await response.json();
      
      // Ažuriraj local state sa novim podacima
      setUser(data.user);
      setEditData({
        ime: data.user.ime || '',
        prezime: data.user.prezime || '',
        email: data.user.email || '',
        telefon: data.user.telefon || '',
        postanskiBroj: data.user.adresa?.split(', ')[0]?.split(' ')[0] || '',
        grad: data.user.adresa?.split(', ')[0]?.split(' ').slice(1).join(' ') || '',
        adresa: data.user.adresa?.split(', ').slice(1).join(', ') || '',
      });
      
      setIsEditMode(false);
      toast.success('✅ Podaci su uspešno ažurirani!');
    } catch (err) {
      console.error('Greška:', err);
      toast.error(`⚠️ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.old_pwd || !passwordData.new_pwd || !passwordData.new_pwd_confirm) {
      toast.error('⚠️ Sva polja su obavezna');
      return;
    }

    if (passwordData.new_pwd !== passwordData.new_pwd_confirm) {
      toast.error('⚠️ Nove lozinke se ne poklapaju');
      return;
    }

    if (passwordData.new_pwd.length < 3) {
      toast.error('⚠️ Nova lozinka mora imati najmanje 3 karaktera');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/lozinka`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_pwd: passwordData.old_pwd,
          new_pwd: passwordData.new_pwd,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Greška pri promeni lozinke');
      }

      setPasswordData({
        old_pwd: '',
        new_pwd: '',
        new_pwd_confirm: '',
      });
      setIsChangingPassword(false);
      toast.success('✅ Lozinka je uspešno promenjena!');
    } catch (err) {
      console.error('Greška:', err);
      toast.error(`⚠️ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <ToastContainer position="top-right" theme="light" />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Moj Profil</h1>
          <p>Vaši podaci i informacije</p>
        </div>

        <div className={styles.content}>
          {/* Tab Navigation */}
          <div className={styles.tabsNav}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'licni-podaci' ? styles.active : ''}`}
              onClick={() => handleTabChange('licni-podaci')}
            >
              <i className="fas fa-user"></i> Lični podaci
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'sigurnost' ? styles.active : ''}`}
              onClick={() => handleTabChange('sigurnost')}
            >
              <i className="fas fa-lock"></i> Sigurnost
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'omiljeni' ? styles.active : ''}`}
              onClick={() => handleTabChange('omiljeni')}
            >
              <i className="fas fa-heart"></i> Omiljeni ({favorites.length})
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'korpa' ? styles.active : ''}`}
              onClick={() => handleTabChange('korpa')}
            >
              <i className="fas fa-shopping-cart"></i> Korpa ({cartItems.length})
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'porudzbine' ? styles.active : ''}`}
              onClick={() => handleTabChange('porudzbine')}
            >
              <i className="fas fa-file-alt"></i> Porudžbine
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles.tabsContent}>
          {/* Lični podaci - Tab Content */}
          {activeTab === 'licni-podaci' && (
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <h2>Lični podaci</h2>
              {!isEditMode && (
                <button 
                  className={styles.editModeBtn}
                  onClick={() => setIsEditMode(true)}
                >
                  <i className="fas fa-edit"></i> Uredi
                </button>
              )}
            </div>
            
            {isEditMode ? (
              <>
                <div className={styles.infoGrid}>
                  <div className={styles.infoField}>
                    <label>Ime</label>
                    <input
                      type="text"
                      name="ime"
                      value={editData.ime}
                      onChange={handleEditChange}
                      placeholder="Unesite ime"
                    />
                  </div>

                  <div className={styles.infoField}>
                    <label>Prezime</label>
                    <input
                      type="text"
                      name="prezime"
                      value={editData.prezime}
                      onChange={handleEditChange}
                      placeholder="Unesite prezime"
                    />
                  </div>

                  <div className={styles.infoField + ' ' + styles.fullWidth}>
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editData.email}
                      onChange={handleEditChange}
                      placeholder="Unesite email"
                    />
                  </div>

                  <div className={styles.infoField + ' ' + styles.fullWidth}>
                    <label>Telefon</label>
                    <input
                      type="tel"
                      name="telefon"
                      value={editData.telefon}
                      onChange={handleEditChange}
                      placeholder="06XX XXX XXXX"
                    />
                  </div>

                  <div className={styles.infoField}>
                    <label>Poštanski broj</label>
                    <input
                      type="text"
                      name="postanskiBroj"
                      value={editData.postanskiBroj}
                      onChange={handleEditChange}
                      placeholder="npr. 71000"
                    />
                  </div>

                  <div className={styles.infoField}>
                    <label>Grad</label>
                    <input
                      type="text"
                      name="grad"
                      value={editData.grad}
                      onChange={handleEditChange}
                      placeholder="Unesite grad"
                      list="gradovi-list"
                    />
                    <datalist id="gradovi-list">
                      <option value="Sarajevo" />
                      <option value="Banja Luka" />
                      <option value="Tuzla" />
                      <option value="Mostar" />
                      <option value="Zenica" />
                      <option value="Prijedor" />
                    </datalist>
                  </div>

                  <div className={styles.infoField + ' ' + styles.fullWidth}>
                    <label>Adresa</label>
                    <input
                      type="text"
                      name="adresa"
                      value={editData.adresa}
                      onChange={handleEditChange}
                      placeholder="npr. Zmaja od Bosne 10"
                    />
                  </div>
                </div>

                <div className={styles.editActions}>
                  <button 
                    className={styles.saveBtn}
                    onClick={handleSaveChanges}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Čuvam...' : '✓ Sačuvaj'}
                  </button>
                  <button 
                    className={styles.cancelBtn}
                    onClick={() => {
                      setIsEditMode(false);
                      // Resetuj na originalne vrednosti
                      if (user) {
                        const addressParts = user.adresa?.split(', ') || [];
                        const postalAndCity = addressParts[0]?.split(' ') || [];
                        setEditData({
                          ime: user.ime || '',
                          prezime: user.prezime || '',
                          email: user.email || '',
                          telefon: user.telefon || '',
                          postanskiBroj: postalAndCity[0] || '',
                          grad: postalAndCity.slice(1).join(' ') || '',
                          adresa: addressParts.slice(1).join(', ') || '',
                        });
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    ✕ Otkaži
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.infoGrid}>
                <div className={styles.infoField}>
                  <label>Ime</label>
                  <p>{user?.ime || '-'}</p>
                </div>

                <div className={styles.infoField}>
                  <label>Prezime</label>
                  <p>{user?.prezime || '-'}</p>
                </div>

                <div className={styles.infoField}>
                  <label>Email</label>
                  <p>{user?.email || '-'}</p>
                </div>

                <div className={styles.infoField}>
                  <label>Telefon</label>
                  <p>{user?.telefon || '-'}</p>
                </div>

                <div className={styles.infoField}>
                  <label>Poštanski broj</label>
                  <p>{(() => {
                    const addressParts = user?.adresa?.split(', ') || [];
                    const postalAndCity = addressParts[0]?.split(' ') || [];
                    return postalAndCity[0] || '-';
                  })()}</p>
                </div>

                <div className={styles.infoField}>
                  <label>Grad</label>
                  <p>{(() => {
                    const addressParts = user?.adresa?.split(', ') || [];
                    const postalAndCity = addressParts[0]?.split(' ') || [];
                    return postalAndCity.slice(1).join(' ') || '-';
                  })()}</p>
                </div>

                <div className={styles.infoField + ' ' + styles.fullWidth}>
                  <label>Adresa</label>
                  <p>{(() => {
                    const addressParts = user?.adresa?.split(', ') || [];
                    return addressParts.slice(1).join(', ') || '-';
                  })()}</p>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Sigurnost - Tab Content */}
          {activeTab === 'sigurnost' && (
          <div className={styles.profileCard}>
            <h2>Sigurnost</h2>
            
            {isChangingPassword ? (
              <>
                <div className={styles.passwordForm}>
                  <div className={styles.infoField}>
                    <label>Stara lozinka</label>
                    <input
                      type="password"
                      name="old_pwd"
                      value={passwordData.old_pwd}
                      onChange={handlePasswordChange}
                      placeholder="Unesite staru lozinku"
                    />
                  </div>

                  <div className={styles.infoField}>
                    <label>Nova lozinka</label>
                    <input
                      type="password"
                      name="new_pwd"
                      value={passwordData.new_pwd}
                      onChange={handlePasswordChange}
                      placeholder="Unesite novu lozinku"
                    />
                  </div>

                  <div className={styles.infoField}>
                    <label>Potvrdi novu lozinku</label>
                    <input
                      type="password"
                      name="new_pwd_confirm"
                      value={passwordData.new_pwd_confirm}
                      onChange={handlePasswordChange}
                      placeholder="Ponovite novu lozinku"
                    />
                  </div>
                </div>

                <div className={styles.editActions}>
                  <button 
                    className={styles.saveBtn}
                    onClick={handleChangePassword}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Čuvam...' : '✓ Promeni lozinku'}
                  </button>
                  <button 
                    className={styles.cancelBtn}
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        old_pwd: '',
                        new_pwd: '',
                        new_pwd_confirm: '',
                      });
                    }}
                    disabled={isSubmitting}
                  >
                    ✕ Otkaži
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.securityInfo}>
                <p>Čuvajte vašu lozinku sigurnom. Preporučujemo da promenite lozinku redovno.</p>
                <button 
                  className={styles.changePasswordBtn}
                  onClick={() => setIsChangingPassword(true)}
                >
                  <i className="fas fa-key"></i> Promeni lozinku
                </button>
              </div>
            )}
          </div>
          )}

          {/* Omiljeni - Tab Content */}
          {activeTab === 'omiljeni' && (
          <div className={styles.profileCard}>
            <h2>Moji omiljeni proizvodi ({favorites.length})</h2>
            
            {favorites.length === 0 ? (
              <div className={styles.emptyFavorites}>
                <i className="fas fa-heart"></i>
                <p>Nemate omiljenih proizvoda</p>
                <button 
                  className={styles.browseBtn}
                  onClick={() => router.push('/proizvodi')}
                >
                  Pregledaj proizvode
                </button>
              </div>
            ) : loadingFavorites ? (
              <div className={styles.loadingFavorites}>
                Učitavanje omiljenih...
              </div>
            ) : (
              <div className={styles.favoritesGrid}>
                {favoriteProducts.map((proizvod) => (
                  <div 
                    key={proizvod.code_base} 
                    className={styles.favoriteItem}
                    onClick={() => router.push(`/proizvodi/${proizvod.code_base}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.favoriteImage}>
                      {proizvod.slike && proizvod.slike.length > 0 ? (
                        <img 
                          src={`${API_BASE}/api/proizvodi/slike/${proizvod.slike[0]}`}
                          alt={proizvod.ime}
                          onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="150"%3E%3Crect fill="%23f0f0f0" width="150" height="150"/%3E%3C/svg%3E'}
                        />
                      ) : (
                        <div className={styles.noImage}>
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </div>
                    <div className={styles.favoriteInfo}>
                      <h4>{proizvod.ime}</h4>
                      <p className={styles.favoriteCategory}>{proizvod.kategorija}</p>
                      <div className={styles.favoritePrice}>
                        {proizvod.popust > 0 ? (
                          <>
                            <span className={styles.originalPrice}>{parseFloat(proizvod.cena).toFixed(2)} KM</span>
                            <span className={styles.discountedPrice}>
                              {(parseFloat(proizvod.cena) - (parseFloat(proizvod.cena) * proizvod.popust / 100)).toFixed(2)} KM
                            </span>
                          </>
                        ) : (
                          <span className={styles.price}>{parseFloat(proizvod.cena).toFixed(2)} KM</span>
                        )}
                      </div>
                    </div>
                    <button 
                      className={styles.removeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(proizvod.code_base);
                        toast.success('✅ Uklonjen iz omiljenih');
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Korpa - Tab Content */}
          {activeTab === 'korpa' && (
          <div className={styles.profileCard}>
            <h2>Moja korpa ({cartItems.length})</h2>
            
            {cartItems.length === 0 ? (
              <div className={styles.emptyCart}>
                <i className="fas fa-shopping-cart"></i>
                <p>Vaša korpa je prazna</p>
                <button 
                  className={styles.browseBtn}
                  onClick={() => router.push('/proizvodi')}
                >
                  Pregledaj proizvode
                </button>
              </div>
            ) : (
              <>
                <div className={styles.cartItems}>
                  {cartItems.map((item, idx) => (
                    <div key={idx} className={styles.cartItem}>
                      <div className={styles.cartItemImage}>
                        {item.slika ? (
                          <img 
                            src={`${API_BASE}/api/proizvodi/slike/${item.slika}`}
                            alt={item.ime}
                            onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f0f0f0" width="80" height="80"/%3E%3C/svg%3E'}
                          />
                        ) : (
                          <div className={styles.noImage}>
                            <i className="fas fa-image"></i>
                          </div>
                        )}
                      </div>
                      <div className={styles.cartItemInfo}>
                        <h4>{item.ime}</h4>
                        <p className={styles.cartItemCategory}>{item.kategorija}</p>
                        <div className={styles.cartItemDetails}>
                          <span>Boja: {item.boja}</span>
                          <span>Veličina: {item.velicina}</span>
                          <span>Količina: {item.kolicina}</span>
                        </div>
                      </div>
                      <div className={styles.cartItemPrice}>
                        {item.popust > 0 ? (
                          <>
                            <span className={styles.originalPrice}>{parseFloat(item.cena).toFixed(2)} KM</span>
                            <span className={styles.discountedPrice}>
                              {(parseFloat(item.cena) - (parseFloat(item.cena) * item.popust / 100)).toFixed(2)} KM
                            </span>
                          </>
                        ) : (
                          <span className={styles.price}>{parseFloat(item.cena).toFixed(2)} KM</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pregled cena */}
                <div className={styles.cartSummary}>
                  <div className={styles.priceBreakdown}>
                    <div className={styles.priceRow}>
                      <span>Subtotal:</span>
                      <span>{getOriginalPrice().toFixed(2)} KM</span>
                    </div>
                    {getSavings() > 0 && (
                      <div className={styles.priceRow}>
                        <span className={styles.savings}>Ušteda:</span>
                        <span className={styles.savings}>-{getSavings().toFixed(2)} KM</span>
                      </div>
                    )}
                    <div className={styles.priceRow}>
                      <span>Dostava:</span>
                      <span>10.00 KM</span>
                    </div>
                    <div className={styles.priceRow + ' ' + styles.total}>
                      <span>Ukupno:</span>
                      <span>{(getTotalPrice() + 10).toFixed(2)} KM</span>
                    </div>
                  </div>

                  {/* Akcije za korpu */}
                  <div className={styles.cartActions}>
                    <button 
                      className={styles.checkoutBtn}
                      onClick={() => router.push('/poruci')}
                    >
                      <i className="fas fa-credit-card"></i> Nastavi na plaćanje
                    </button>
                    <button 
                      className={styles.continueShoppingBtn}
                      onClick={() => router.push('/proizvodi')}
                    >
                      <i className="fas fa-shopping-bag"></i> Nastavi kupovinu
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          )}

          {/* Porudžbine - Tab Content */}
          {activeTab === 'porudzbine' && (
          <div className={styles.profileCard}>
            <h2>Moje Porudžbine</h2>
            
            {loadingPorudzbine ? (
              <div className={styles.loadingState}>
                <i className="fas fa-spinner"></i>
                <p>Učitavanje porudžbina...</p>
              </div>
            ) : porudzbine.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-inbox"></i>
                <p>Nemate porudžbina</p>
                <button 
                  className={styles.browseBtn}
                  onClick={() => router.push('/proizvodi')}
                >
                  Pregledaj proizvode
                </button>
              </div>
            ) : (
              <div className={styles.porudzbinaList}>
                {porudzbine.map((porudzbina) => (
                  <div key={porudzbina.id} className={styles.porudzbinaItem}>
                    <div className={styles.porudzbinaHeader}>
                      <div className={styles.porudzbinaInfo}>
                        <h3>Porudžbina #{porudzbina.id}</h3>
                        <p className={styles.porudzbinaDate}>
                          {new Date(porudzbina.created_at).toLocaleDateString('sr-RS')}
                        </p>
                      </div>
                      <div className={styles.porudzbinaStatus}>
                        <span className={`${styles.statusBadge} ${styles[`status-${porudzbina.status?.toLowerCase() || 'pending'}`]}`}>
                          {porudzbina.status === 'u_pripremi' ? 'U pripremi' :
                           porudzbina.status === 'poslato' ? 'Poslato' :
                           porudzbina.status === 'dostavljeno' ? 'Dostavljeno' :
                           porudzbina.status === 'otkazano' ? 'Otkazano' :
                           porudzbina.status === 'potvrdjeno' ? 'Potvrđeno' :
                           porudzbina.status || 'Čekanje'}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.porudzbinaDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Ukupno:</span>
                        <span className={styles.value}>{porudzbina.cena} KM</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.label}>Stavki:</span>
                        <span className={styles.value}>{porudzbina.korpa?.length || 0}</span>
                      </div>
                      {porudzbina.telefon && (
                        <div className={styles.detailRow}>
                          <span className={styles.label}>Telefon:</span>
                          <span className={styles.value}>{porudzbina.telefon}</span>
                        </div>
                      )}
                      {porudzbina.adresa && (
                        <div className={styles.detailRow}>
                          <span className={styles.label}>Adresa:</span>
                          <span className={styles.value}>{porudzbina.adresa}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.porudzbinaActions}>
                      <button 
                        className={styles.detailsBtn}
                        onClick={() => router.push(`/narudzbina/${porudzbina.id}`)}
                      >
                        <i className="fas fa-eye"></i> Detalji
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
