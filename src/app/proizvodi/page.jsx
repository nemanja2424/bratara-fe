'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useCartContext } from '@/context/CartContext';
import { useFavoritesContext } from '@/context/FavoritesContext';
import styles from './proizvodi.module.css';
import { COLORS, SIZE_PRESETS, GLAVNE_KATEGORIJE } from '@/constants';

const API_BASE = 'https://butikirna.com';
const ITEMS_PER_PAGE = 20;

function ProizvodiPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [proizvodi, setProizvodi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // Search i filteri
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortOption, setSortOption] = useState(''); // Počni prazno da bi prvi klik radio
  const [sortBy, setSortBy] = useState('popust');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProizvodiCount, setTotalProizvodiCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  // Filteri
  const [kategorije, setKategorije] = useState([]);
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterColors, setFilterColors] = useState([]);
  const [filterSizes, setFilterSizes] = useState([]);
  const [expandedParents, setExpandedParents] = useState([]);
  const [sizeCategory, setSizeCategory] = useState('odeca'); // 'obuca' | 'odeca'
  const [showFilters, setShowFilters] = useState(false);
  const [isGrouped, setIsGrouped] = useState(true); // Grupisanje po code_base

  // Funkcija za ažuriranje URL parametara
  const updateUrlParams = (
    page = currentPage,
    search = searchTerm,
    sort = sortOption,
    categories = filterCategories,
    colors = filterColors,
    sizes = filterSizes
  ) => {
    const params = new URLSearchParams();
    
    if (page > 1) params.append('page', page);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);
    if (categories.length > 0) params.append('categories', categories.join(','));
    if (colors.length > 0) params.append('colors', colors.join(','));
    if (sizes.length > 0) params.append('sizes', sizes.join(','));

    const url = params.toString() ? `/proizvodi?${params.toString()}` : '/proizvodi';
    router.push(url, { shallow: false });
  };

  // Funkcija za čitanje URL parametara
  const loadFromUrl = () => {
    const page = parseInt(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'na_popustu';
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const colors = searchParams.get('colors')?.split(',').filter(Boolean) || [];
    const sizes = searchParams.get('sizes')?.split(',').filter(Boolean) || [];

    setCurrentPage(page);
    setSearchTerm(search);
    setSearchInput(search);
    setSortOption(sort);
    setFilterCategories(categories);
    setFilterColors(colors);
    setFilterSizes(sizes);

    const sortMap = {
      'na_popustu': { sortBy: 'popust', sortOrder: 'desc' },
      'novije': { sortBy: 'created_at', sortOrder: 'desc' },
      'starije': { sortBy: 'created_at', sortOrder: 'asc' },
      'skuplje': { sortBy: 'cena', sortOrder: 'desc' },
      'jeftinije': { sortBy: 'cena', sortOrder: 'asc' },
    };
    const { sortBy: newSortBy, sortOrder: newSortOrder } = sortMap[sort] || sortMap['na_popustu'];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Učitaj stanje iz URL-a pri prvoj montaži
  useEffect(() => {
    if (isMounted) {
      loadFromUrl();
    }
  }, [isMounted]);

  // Intersection Observer za animacije
  useEffect(() => {
    if (!isMounted || proizvodi.length === 0) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('observed-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('[data-animate]').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [proizvodi, isMounted]);

  // Fetch kategorije
  const fetchKategorije = async () => {
    try {
      const response = await fetch('https://butikirna.com/api/kategorije/get?active=true');
      if (!response.ok) throw new Error('Greška pri učitavanju kategorija');
      const data = await response.json();
      setKategorije(data.kategorije || []);
    } catch (err) {
      console.error('Greška pri učitavanju kategorija:', err);
    }
  };

  useEffect(() => {
    fetchKategorije();
  }, []);

  // Scroll na vrh kada se promeni strana
  useEffect(() => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [currentPage]);

  // Fetch proizvodi sa filterima
  const fetchProizvod = async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (currentPage - 1) * itemsPerPage;
      const params = new URLSearchParams();
      params.append('limit', itemsPerPage);
      params.append('offset', offset);
      params.append('group_by', 'code_base');
      params.append('min_stanje', 1); // Samo dostupni proizvodi

      if (searchTerm) params.append('search', searchTerm);
      if (filterCategories.length > 0) params.append('kategorije', filterCategories.join(','));
      if (filterColors.length > 0) params.append('boje', filterColors.join(','));
      if (filterSizes.length > 0) params.append('veličine', filterSizes.join(','));

      const { sortBy: sb, sortOrder: so } = (() => {
        const map = {
          'popust': { sortBy: 'popust', sortOrder: sortOrder },
          'created_at': { sortBy: 'created_at', sortOrder: sortOrder },
          'cena': { sortBy: 'cena', sortOrder: sortOrder },
        };
        return map[sortBy] || { sortBy: 'popust', sortOrder: 'desc' };
      })();
      if (sb) params.append('sort_by', sb);
      if (so) params.append('sort_order', so);

      const response = await fetch(`${API_BASE}/api/proizvodi/get?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Greška pri učitavanju proizvoda');
      const data = await response.json();
      setProizvodi(data.proizvodi || []);
      setTotalProizvodiCount(data.pagination.ukupno_proizvoda);
    } catch (err) {
      console.error('Greška:', err);
      setError(err.message);
      setProizvodi([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    fetchProizvod();
  }, [isMounted, currentPage, searchTerm, filterCategories, filterColors, filterSizes, sortBy, sortOrder]);

  // Ažuriraj URL kada se filteri promene
  useEffect(() => {
    if (!isMounted) return;
    updateUrlParams(currentPage, searchTerm, sortOption, filterCategories, filterColors, filterSizes);
  }, [currentPage, searchTerm, sortOption, filterCategories, filterColors, filterSizes]);

  // Handleri
  const handleSearch = () => {
    setCurrentPage(1);
    setSearchTerm(searchInput);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    
    const sortMap = {
      'na_popustu': { sortBy: 'popust', sortOrder: 'desc' },
      'novije': { sortBy: 'created_at', sortOrder: 'desc' },
      'starije': { sortBy: 'created_at', sortOrder: 'asc' },
      'skuplje': { sortBy: 'cena', sortOrder: 'desc' },
      'jeftinije': { sortBy: 'cena', sortOrder: 'asc' },
    };
    const { sortBy: newSortBy, sortOrder: newSortOrder } = sortMap[option] || sortMap['na_popustu'];
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setCurrentPage(1);
  };

  const handleCategoryToggle = (kategorija) => {
    setCurrentPage(1);
    setFilterCategories(prev =>
      prev.includes(kategorija)
        ? prev.filter(k => k !== kategorija)
        : [...prev, kategorija]
    );
  };

  const handleParentExpandToggle = (parent) => {
    setExpandedParents(prev =>
      prev.includes(parent)
        ? prev.filter(p => p !== parent)
        : [parent]  // Samo jedan parent otvorenistovremeno
    );
  };

  // Promeni veličine kada se promeni otvoreni parent
  useEffect(() => {
    const parentToCategoryMap = {
      'Odeća': 'odeca',
      'Obuća': 'obuca',
      'Torbe': 'bezVelicine'
    };
    
    if (expandedParents.length > 0) {
      const newSizeCategory = parentToCategoryMap[expandedParents[0]];
      setSizeCategory(newSizeCategory);
      setFilterSizes([]); // Resetuj filtrirane veličine
    }
  }, [expandedParents]);

  const handleColorToggle = (boja) => {
    setCurrentPage(1);
    setFilterColors(prev =>
      prev.includes(boja)
        ? prev.filter(b => b !== boja)
        : [...prev, boja]
    );
  };

  const handleSizeToggle = (velicina) => {
    setCurrentPage(1);
    setFilterSizes(prev =>
      prev.includes(velicina)
        ? prev.filter(s => s !== velicina)
        : [...prev, velicina]
    );
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setFilterCategories([]);
    setFilterColors([]);
    setFilterSizes([]);
    setSizeCategory('odeca');
    setSortOption('na_popustu');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalProizvodiCount / itemsPerPage);

  return (
    <div className={styles.page}>
      <ToastContainer position="top-right" theme="light" />

      {/* Hero Header */}
      <div className={styles.hero} data-animate>
        <div className={styles.heroContent}>
          <h1>Svi Proizvodi</h1>
          <p>Pronađite savršenu stilaciju iz naše komplentne kolekcije</p>
        </div>
      </div>

      {/* Main Content */}
      <section className={styles.container}>
        <div className={styles.contentWrapper}>
          {/* Sidebar Filter */}
          <div className={`${styles.sidebar} ${showFilters ? styles.active : ''}`}>
            <div className={styles.filterHeader}>
              <h3>Filteri</h3>
              <button 
                className={styles.closeFiltersBtn}
                onClick={() => setShowFilters(false)}
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className={styles.filterSection}>
              <label>Pretraži</label>
              <div className={styles.searchBox}>
                <div className={styles.searchInputWrapper}>
                  <input
                    type="text"
                    placeholder="Naziv proizvoda..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  {searchInput && (
                    <button onClick={handleClearSearch} title="Obriši pretragu" className={styles.clearSearchBtn}>
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                <button onClick={handleSearch} title="Pretraži">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>

            {/* Sort */}
            <div className={styles.filterSection}>
              <label>Sortiranje</label>
              <select 
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="na_popustu">Na popustu</option>
                <option value="novije">Novije</option>
                <option value="starije">Starije</option>
                <option value="skuplje">Skuplje</option>
                <option value="jeftinije">Jeftinije</option>
              </select>
            </div>

            {/* Kategorije Filter */}
            <div className={styles.filterSection}>
              <label>Kategorije</label>
              <div className={styles.parentAccordion}>
                {GLAVNE_KATEGORIJE.map(parent => {
                  const children = kategorije.filter(kat => kat.parent === parent);
                  const isExpanded = expandedParents.includes(parent);
                  return (
                    <div key={parent} className={styles.parentGroup}>
                      <button
                        type="button"
                        className={`${styles.parentToggle} ${isExpanded ? styles.expanded : ''}`}
                        onClick={() => handleParentExpandToggle(parent)}
                      >
                        <span>{parent}</span>
                        <small>{children.length} kategorija</small>
                        <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                      </button>
                      {isExpanded && (
                        <div className={styles.childCheckboxGroup}>
                          {children.length > 0 ? (
                            children.map(child => (
                              <label key={child.id} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={filterCategories.includes(child.kategorija)}
                                  onChange={() => handleCategoryToggle(child.kategorija)}
                                />
                                {child.kategorija}
                              </label>
                            ))
                          ) : (
                            <div className={styles.emptyChildList}>
                              Nema dostupnih kategorija za ovu parent grupu
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Veličine Filter */}
            <div className={styles.filterSection}>
              <label>Veličine</label>
              <div className={styles.sizeCategory} style={{borderBottom:'2px solid #0099cc4d', paddingBottom:'8px'}}>
                {Object.entries({
                  obuca: 'Obuća',
                  odeca: 'Odeća',
                  bezVelicine: 'Bez veličine'
                }).map(([key, label]) => (
                  <button
                    key={key}
                    className={`${styles.sizeCategoryBtn} ${sizeCategory === key ? styles.active : ''}`}
                    onClick={() => setSizeCategory(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={styles.sizeGrid}>
                {SIZE_PRESETS[sizeCategory]?.length > 0 ? (
                  SIZE_PRESETS[sizeCategory].map(size => (
                    <button
                      key={size}
                      className={`${styles.sizeButton} ${filterSizes.includes(size) ? styles.active : ''}`}
                      onClick={() => handleSizeToggle(size)}
                    >
                      {size}
                    </button>
                  ))
                ) : (
                  <p style={{textAlign: 'center', color: '#999'}}>Nema dostupnih veličina za ovu kategoriju</p>
                )}
              </div>
            </div>

            {/* Boje Filter */}
            <div className={styles.filterSection}>
              <label>Boje</label>
              <div className={styles.colorGrid}>
                {Object.entries(COLORS).map(([naz, hex]) => (
                  <button
                    key={naz}
                    className={`${styles.colorButton} ${filterColors.includes(naz) ? styles.active : ''}`}
                    title={naz}
                    style={{
                      backgroundColor: hex,
                      borderColor: filterColors.includes(naz) ? '#333' : 'transparent',
                    }}
                    onClick={() => handleColorToggle(naz)}
                  >
                    {filterColors.includes(naz) && <i className="fas fa-check"></i>}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button 
              className={styles.resetBtn}
              onClick={handleResetFilters}
            >
              Poništi filtere
            </button>
          </div>

          {/* Products Grid */}
          <div className={styles.mainContent}>
            <div className={styles.topBar}>
              <button 
                className={styles.toggleFiltersBtn}
                onClick={() => setShowFilters(!showFilters)}
              >
                ☰ Filteri
              </button>
              <div className={styles.resultsInfo}>
                Prikazano: <strong>{proizvodi.length}</strong> od <strong>{totalProizvodiCount}</strong>
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <p>❌ {error}</p>
                <button onClick={fetchProizvod}>Pokušaj ponovo</button>
              </div>
            )}

            {loading ? (
              <div className={styles.loadingGrid}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={styles.skeletonCard}></div>
                ))}
              </div>
            ) : proizvodi.length > 0 ? (
              <>
                <div className={styles.productsGrid}>
                  {proizvodi.map((proizvod) => (
                    <ProductCard 
                      key={proizvod.code_base} 
                      proizvod={proizvod}
                      onClick={() => router.push(`/proizvodi/${proizvod.code_base}`)}
                    />
                  ))}
                </div>

                {/* Paginacija */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      className={styles.paginationBtn}
                      title="Prva strana"
                    >
                      <i className="fas fa-angles-left"></i> Prva
                    </button>
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className={styles.paginationBtn}
                      title="Prethodna strana"
                    >
                      <i className="fas fa-angle-left"></i>
                    </button>

                    {[...Array(Math.min(6, totalPages))].map((_, i) => {
                      const pageNum = currentPage - 1 + i;
                      if (pageNum < 1 || pageNum > totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`${styles.paginationBtn} ${currentPage === pageNum ? styles.active : ''}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className={styles.paginationBtn}
                      title="Sledeća strana"
                    >
                      <i className="fas fa-angle-right"></i>
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className={styles.paginationBtn}
                      title="Poslednja strana"
                    >
                      Poslednja <i className="fas fa-angles-right"></i>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noProducts}>
                <p>😔 Nema pronađenih proizvoda</p>
                <p className={styles.noProductsSubtext}>Pokušaj sa drugim kriterijumima pretraživanja</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Overlay */}
        <div 
          className={`${styles.filterOverlay} ${showFilters ? styles.active : ''}`}
          onClick={() => setShowFilters(false)}
          style={{ display: showFilters ? 'block' : 'none' }}
        ></div>
      </section>
    </div>
  );
}

export default function ProizvodiPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div>Učitavanje...</div></div>}>
      <ProizvodiPageContent />
    </Suspense>
  );
}

function ProductCard({ proizvod, onClick }) {
  const cart = useCartContext();
  const { favorites, toggleFavorite } = useFavoritesContext();
  const isFavorited = favorites.includes(proizvod.code_base);
  const buttonRef = useRef(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [allVariants, setAllVariants] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState(0);

  // Fetch svi varijanti za ovaj proizvod
  const fetchVariants = async () => {
    setIsLoadingVariants(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/proizvodi/get?search=${proizvod.code_base}&limit=100`
      );
      const data = await response.json();
      const variants = data.proizvodi || [];
      setAllVariants(variants);

      // Izvući jedinstvene boje
      const colors = [...new Set(variants.map(v => v.boja))].filter(Boolean);
      setAvailableColors(colors);
      setSelectedColor(colors[0] || null);
    } catch (err) {
      console.error('Greška pri učitavanju varijanti:', err);
      toast.error('⚠️ Greška pri učitavanju varijanti!');
    } finally {
      setIsLoadingVariants(false);
    }
  };

  // Ažuriraj dostupne veličine kada se promeni boja
  const updateAvailableSizes = (color) => {
    const variantsForColor = allVariants.filter(v => v.boja === color);
    const sizes = [...new Set(variantsForColor.map(v => v.velicina))].filter(Boolean);
    setAvailableSizes(sizes);
    setSelectedSize(sizes[0] || null);
  };

  // Automatski ažuriraj veličine kada se promeni odabrana boja
  useEffect(() => {
    if (selectedColor && allVariants.length > 0) {
      updateAvailableSizes(selectedColor);
    }
  }, [selectedColor, allVariants]);

  // Ažuriraj maxQuantity kada se promeni odabrana kombinacija
  useEffect(() => {
    if (selectedColor && selectedSize && allVariants.length > 0) {
      const selectedProduct = allVariants.find(
        v => v.boja === selectedColor && v.velicina === selectedSize
      );
      if (selectedProduct) {
        setMaxQuantity(selectedProduct.stanje);
        setQuantity(1); // Reset quantity na 1 kada se promeni kombinacija
      }
    }
  }, [selectedColor, selectedSize, allVariants]);

  const handleOpenQuickAdd = (e) => {
    e.stopPropagation();
    setShowQuickAdd(true);
    fetchVariants();
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  const handleConfirm = () => {
    if (!selectedColor || !selectedSize) {
      toast.error('⚠️ Molim odaberite boju i veličinu!');
      return;
    }

    // Nađi proizvod sa odabranom bojom i veličinom
    const selectedProduct = allVariants.find(
      v => v.boja === selectedColor && v.velicina === selectedSize
    );

    if (!selectedProduct) {
      toast.error('⚠️ Kombinacija nije dostupna!');
      return;
    }

    // Proveri je li količina validna
    if (quantity > selectedProduct.stanje) {
      toast.error(`⚠️ Dostupno je samo ${selectedProduct.stanje} komada!`);
      return;
    }

    cart.addToCart(selectedProduct, quantity);
    toast.success('✅ Proizvod je dodat u korpu!', {
      position: 'top-right',
      autoClose: 3000,
    });
    setShowQuickAdd(false);
    setQuantity(1);
  };

  const handleCancel = () => {
    setShowQuickAdd(false);
    setQuantity(1);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite(proizvod.code_base);
    const message = isFavorited ? '❤️ Uklonjen iz omiljenih' : '❤️ Dodano u omiljene';
    toast.success(message, {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  const discountedPrice = proizvod.popust > 0 
    ? parseFloat(proizvod.cena) - (parseFloat(proizvod.cena) * proizvod.popust / 100)
    : parseFloat(proizvod.cena);

  return (
    <div className={styles.productCard} onClick={onClick} data-animate>
      <div className={styles.productImage}>
        <button
          className={`${styles.favoriteBtn} ${isFavorited ? styles.favorited : ''}`}
          onClick={handleToggleFavorite}
          title={isFavorited ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
        >
          <i className={`${isFavorited ? 'fas' : 'far'} fa-heart`}></i>
        </button>
        {proizvod.slike && proizvod.slike.length > 0 ? (
          <img 
            src={`${API_BASE}/api/proizvodi/slike/${proizvod.slike[0]}`}
            alt={proizvod.ime}
            onError={(e) => e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f0f0f0" width="200" height="200"/%3E%3C/svg%3E'}
          />
        ) : (
          <div className={styles.noImage}>
            <i className="fas fa-image"></i>
          </div>
        )}
        {proizvod.popust > 0 && (
          <div className={styles.discountBadge}>
            -{proizvod.popust}%
          </div>
        )}
      </div>
      <div className={styles.productInfo}>
        <h3>{proizvod.ime}</h3>
        <p className={styles.category}>{proizvod.kategorija}</p>
        <div className={styles.priceSection}>
          {proizvod.popust > 0 ? (
            <>
              <span className={styles.originalPrice}>
                <span className={styles.strikeThroughPrice}>{parseFloat(proizvod.cena).toFixed(2)}</span>
                <span className={styles.strikeThrough}></span>
              </span>
              <span className={styles.discountedPrice}>{discountedPrice.toFixed(2)} KM</span>
            </>
          ) : (
            <span className={styles.price}>{parseFloat(proizvod.cena).toFixed(2)} KM</span>
          )}
        </div>
        <div className={styles.buttonWrapper} ref={buttonRef}>
          <button 
            className={styles.cartBtn}
            onClick={handleOpenQuickAdd}
            title="Dodaj u korpu"
          >
            <i className="fas fa-shopping-cart"></i>
            Dodaj u korpu
          </button>

          {/* Quick Add Modal */}
          {showQuickAdd && (
            <div className={styles.quickAddOverlay} onClick={handleCancel}>
              <div className={styles.quickAddPopup} onClick={(e) => e.stopPropagation()}>
                <h4>{proizvod.ime}</h4>

                {isLoadingVariants ? (
                  <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                    <p>Učitavanje varijanti...</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.quickAddChoices}>
                      {/* Boje */}
                      <div className={styles.quickAddSection}>
                        <label>Boja:</label>
                        <div className={styles.colorOptions}>
                          {availableColors.map(color => (
                            <button
                              key={color}
                              className={`${styles.colorOption} ${selectedColor === color ? styles.active : ''}`}
                              style={{ backgroundColor: COLORS[color] || '#ccc' }}
                              onClick={() => handleColorChange(color)}
                              title={color}
                            ></button>
                          ))}
                        </div>
                      </div>

                      {/* Veličine */}
                      <div className={styles.quickAddSection}>
                        <label>Veličina:</label>
                        <div className={styles.sizeOptions}>
                          {availableSizes.map(size => (
                            <button
                              key={size}
                              className={`${styles.sizeOption} ${selectedSize === size ? styles.active : ''}`}
                              onClick={() => setSelectedSize(size)}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Količina */}
                      <div className={styles.quickAddSection}>
                        <label>Količina:</label>
                        <div className={styles.quantityBox}>
                          <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                          <span>{quantity}</span>
                          <button 
                            onClick={() => setQuantity(quantity + 1)}
                            disabled={quantity >= maxQuantity}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dugmeta */}
                    <div className={styles.quickAddFooter}>
                      <button 
                        className={styles.cancelBtn}
                        onClick={handleCancel}
                        title="Otkaži"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                      <button 
                        className={styles.confirmBtn}
                        onClick={handleConfirm}
                        title="Potvrdi"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
