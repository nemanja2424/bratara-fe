'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useCartContext } from '@/context/CartContext';
import { useFavoritesContext } from '@/context/FavoritesContext';
import styles from './proizvod-detail.module.css';
import { COLORS } from '@/constants';

const API_BASE = 'http://127.0.0.1:5000';

export default function ProizvodDetail() {
  const router = useRouter();
  const params = useParams();
  const code_base = params.code_base;
  const cart = useCartContext();
  const { favorites, toggleFavorite } = useFavoritesContext();
  const isFavorited = favorites.includes(code_base);

  const [proizvodi, setProizvodi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // Izbor boje i veličine
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [thumbScrollPos, setThumbScrollPos] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Učitaj sve verzije proizvoda sa istim code_base
  useEffect(() => {
    if (!isMounted || !code_base) return;

    const fetchProizvodDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/proizvodi/get?code_base=${code_base}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Greška pri učitavanju proizvoda');
        
        const data = await response.json();
        const prods = data.proizvodi || [];

        if (prods.length === 0) {
          throw new Error('Proizvod nije pronađen');
        }

        setProizvodi(prods);
        // Postavi prvi color kao default
        if (prods.length > 0) {
          setSelectedColor(prods[0].boja);
          setSelectedSize(prods[0].velicina);
        }
      } catch (err) {
        console.error('Greška:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProizvodDetail();
  }, [isMounted, code_base]);

  // Grupe dostupnih boja
  const dostupneBoje = [...new Set(proizvodi.map(p => p.boja))];

  // Dostupne veličine za izabranu boju
  const dostupneVelicine = proizvodi
    .filter(p => p.boja === selectedColor)
    .map(p => p.velicina);

  // Trenutni proizvod sa izabranom bojom i veličinom
  const trenutniProizvod = proizvodi.find(
    p => p.boja === selectedColor && p.velicina === selectedSize
  );

  const handleAddToCart = () => {
    if (!trenutniProizvod) {
      toast.error('❌ Molimo izaberite boju i veličinu', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    if (quantity > trenutniProizvod.stanje) {
      toast.error(`❌ Nema dovoljno proizvoda na zalihi. Dostupno: ${trenutniProizvod.stanje}`, {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    // Dodaj u korpu
    cart.addToCart(trenutniProizvod, quantity);
    toast.success('✅ Proizvod je dodat u korpu!', {
      position: 'top-right',
      autoClose: 3000,
    });
    
    // Resetuj quantidade
    setQuantity(1);
  };

  const handleToggleFavorite = () => {
    toggleFavorite(code_base);
    const message = isFavorited ? '❤️ Uklonjen iz omiljenih' : '❤️ Dodano u omiljene';
    toast.success(message, {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <i className="fas fa-spinner"></i>
          <p>Učitavanje proizvoda...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-circle"></i>
          <h2>Greška</h2>
          <p>{error}</p>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <i className="fas fa-arrow-left"></i> Nazad
          </button>
        </div>
      </div>
    );
  }

  if (!trenutniProizvod) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <i className="fas fa-inbox"></i>
          <h2>Proizvod nije dostupan</h2>
          <p>Izabraна kombinacija boje i veličine nije dostupna</p>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <i className="fas fa-arrow-left"></i> Nazad
          </button>
        </div>
      </div>
    );
  }

  const discountedPrice = trenutniProizvod.popust > 0
    ? parseFloat(trenutniProizvod.cena) - (parseFloat(trenutniProizvod.cena) * trenutniProizvod.popust / 100)
    : parseFloat(trenutniProizvod.cena);

  return (
    <div className={styles.container}>
      <ToastContainer position="top-right" theme="light" />

      <button onClick={() => router.back()} className={styles.backBtn}>
        <i className="fas fa-arrow-left"></i> Nazad
      </button>

      <div className={styles.content}>
        
        {/* Leva strana - Slike */}
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            {trenutniProizvod.slike && trenutniProizvod.slike.length > 0 ? (
              <img
                src={`${API_BASE}/api/proizvodi/slike/${trenutniProizvod.slike[selectedImage]}`}
                alt={trenutniProizvod.ime}
                onClick={() => setIsFullscreen(true)}
                style={{ cursor: 'pointer' }}
                onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="%23999"%3ENema slike%3C/text%3E%3C/svg%3E'}
              />
            ) : (
              <div className={styles.noImage}>
                <i className="fas fa-image"></i>
                <p>Nema dostupnih slika</p>
              </div>
            )}
            {trenutniProizvod.popust > 0 && (
              <div className={styles.discountBadge}>
                -{trenutniProizvod.popust}%
              </div>
            )}
            {/* Strelice za navigaciju */}
            {trenutniProizvod.slike && trenutniProizvod.slike.length > 1 && (
              <>
                <button
                  className={styles.imagePrevBtn}
                  onClick={() => setSelectedImage(prev => (prev === 0 ? trenutniProizvod.slike.length - 1 : prev - 1))}
                  title="Prethodna slika"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  className={styles.imageNextBtn}
                  onClick={() => setSelectedImage(prev => (prev === trenutniProizvod.slike.length - 1 ? 0 : prev + 1))}
                  title="Sledeća slika"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {trenutniProizvod.slike && trenutniProizvod.slike.length > 1 && (
            <div className={styles.thumbnailsContainer}>
              <button
                className={styles.thumbScrollBtn}
                onClick={() => setThumbScrollPos(prev => Math.max(0, prev - 100))}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className={styles.thumbnailsScroll}>
                <div className={styles.thumbnails} style={{ transform: `translateX(-${thumbScrollPos}px)` }}>
                  {trenutniProizvod.slike.map((slika, index) => (
                    <button
                      key={index}
                      className={`${styles.thumbnail} ${selectedImage === index ? styles.active : ''}`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={`${API_BASE}/api/proizvodi/slike/${slika}`}
                        alt={`Slika ${index + 1}`}
                        onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect fill="%23f0f0f0" width="60" height="60"/%3E%3C/svg%3E'}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <button
                className={styles.thumbScrollBtn}
                onClick={() => setThumbScrollPos(prev => Math.min(prev + 100, (trenutniProizvod.slike.length * 70) - 300))}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>

        {/* Desna strana - Detaljи */}
        <div className={styles.detailsSection}>
          <div className={styles.header}>
            <span className={styles.category}>{trenutniProizvod.kategorija}</span>
            <h1>{trenutniProizvod.ime}</h1>
          </div>

          {/* Cena */}
          <div className={styles.priceSection}>
            {trenutniProizvod.popust > 0 ? (
              <>
                <span className={styles.originalPrice}>
                  <span className={styles.strikeThroughPrice}>{parseFloat(trenutniProizvod.cena).toFixed(2)} KM</span>
                  <span className={styles.strikeThrough}></span>
                </span>
                <span className={styles.price}>{discountedPrice.toFixed(2)} KM</span>
                <span className={styles.discountPercent}>Ušteda: {trenutniProizvod.popust}%</span>
              </>
            ) : (
              <span className={styles.price}>{parseFloat(trenutniProizvod.cena).toFixed(2)} KM</span>
            )}
          </div>

          {/* Opis */}
          {trenutniProizvod.opis && (
            <div className={styles.description}>
              <p>{trenutniProizvod.opis}</p>
            </div>
          )}

          {/* Stanje */}
          <div className={styles.stock}>
            {trenutniProizvod.stanje > 0 ? (
              <span className={styles.inStock}>
                <i className="fas fa-check-circle"></i>
                Na zalihi: <strong>{trenutniProizvod.stanje} kom</strong>
              </span>
            ) : (
              <span className={styles.outOfStock}>
                <i className="fas fa-times-circle"></i>
                Nema na zalihi
              </span>
            )}
          </div>

          {/* Izbor boje */}
          <div className={styles.optionsSection}>
            <label className={styles.optionLabel}>
              <span>Boja</span>
              <span className={styles.selectedValue}>{selectedColor}</span>
            </label>
            <div className={styles.colorGrid}>
              {dostupneBoje.map(boja => (
                <button
                  key={boja}
                  className={`${styles.colorButton} ${selectedColor === boja ? styles.active : ''}`}
                  title={boja}
                  style={{
                    backgroundColor: COLORS[boja] || '#ccc',
                    borderColor: selectedColor === boja ? '#333' : 'transparent',
                  }}
                  onClick={() => {
                    setSelectedColor(boja);
                    // Postavi prvi dostupan size za novu boju
                    const firstSizeForColor = proizvodi.find(p => p.boja === boja)?.velicina;
                    if (firstSizeForColor) {
                      setSelectedSize(firstSizeForColor);
                    }
                  }}
                >
                  {selectedColor === boja && <i className="fas fa-check"></i>}
                </button>
              ))}
            </div>
          </div>

          {/* Izbor veličine */}
          <div className={styles.optionsSection}>
            <label className={styles.optionLabel}>
              <span>Veličina</span>
              <span className={styles.selectedValue}>{selectedSize}</span>
            </label>
            <div className={styles.sizeGrid}>
              {dostupneVelicine.map(velicina => (
                <button
                  key={velicina}
                  className={`${styles.sizeButton} ${selectedSize === velicina ? styles.active : ''}`}
                  onClick={() => setSelectedSize(velicina)}
                >
                  {velicina}
                </button>
              ))}
            </div>
          </div>

          {/* Količina */}
          <div className={styles.optionsSection}>
            <label className={styles.optionLabel}>Količina</label>
            <div className={styles.quantityControl}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className={styles.quantityBtn}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={trenutniProizvod.stanje}
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.min(val, trenutniProizvod.stanje));
                }}
                className={styles.quantityInput}
              />
              <button
                onClick={() => setQuantity(q => Math.min(q + 1, trenutniProizvod.stanje))}
                className={styles.quantityBtn}
              >
                +
              </button>
            </div>
          </div>

          {/* Akcije */}
          <div className={styles.actions}>
            <button
              className={styles.addToCartBtn}
              onClick={handleAddToCart}
              disabled={trenutniProizvod.stanje === 0}
            >
              <i className="fas fa-shopping-cart"></i>
              Dodaj u korpu
            </button>
            <button
              className={`${styles.addToFavoritesBtn} ${isFavorited ? styles.favorited : ''}`}
              onClick={handleToggleFavorite}
            >
              <i className={`${isFavorited ? 'fas' : 'far'} fa-heart`}></i>
              {isFavorited ? 'Iz omiljenih' : 'Omiljeni'}
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreen && trenutniProizvod.slike && (
        <div className={styles.fullscreenModal}>
          <div className={styles.fullscreenOverlay} onClick={() => setIsFullscreen(false)}></div>
          
          <button
            className={styles.fullscreenClose}
            onClick={() => setIsFullscreen(false)}
            title="Zatvori fullscreen"
          >
            <i className="fas fa-times"></i>
          </button>

          <div className={styles.fullscreenContent}>
            <button
              className={styles.fullscreenPrevBtn}
              onClick={() => setSelectedImage(prev => (prev === 0 ? trenutniProizvod.slike.length - 1 : prev - 1))}
              title="Prethodna slika"
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            <img
              src={`${API_BASE}/api/proizvodi/slike/${trenutniProizvod.slike[selectedImage]}`}
              alt={trenutniProizvod.ime}
              className={styles.fullscreenImage}
              onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800"%3E%3Crect fill="%23f0f0f0" width="800" height="800"/%3E%3C/svg%3E'}
            />

            <button
              className={styles.fullscreenNextBtn}
              onClick={() => setSelectedImage(prev => (prev === trenutniProizvod.slike.length - 1 ? 0 : prev + 1))}
              title="Sledeća slika"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          <div className={styles.fullscreenCounter}>
            {selectedImage + 1} / {trenutniProizvod.slike.length}
          </div>
        </div>
      )}
    </div>
  );
}
