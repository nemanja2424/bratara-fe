'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './proizvodi.module.css';
import { COLORS, SIZE_PRESETS, PRESET_LABELS } from '@/constants';

const API_BASE = 'https://butikirna.com';
const ITEMS_PER_PAGE = 10;

export default function ProizvodiAdmin() {
  const router = useRouter();
  const [proizvodi, setProizvodi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('ime');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProizvodiCount, setTotalProizvodiCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isGrouped, setIsGrouped] = useState(false);

  // Kategorije
  const [kategorije, setKategorije] = useState([]);
  const [kategorijanjeLoading, setKategorijeLoading] = useState(false);

  // Modal kontrola
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: Info, 2: Boje, 3: Pregled

  // Step 1: Osnovno info
  const [step1Data, setStep1Data] = useState({
    ime: '',
    opis: '',
    cena: '',
    popust: 0,
    kategorija: '',
    preset: 'obuca',
  });

  // Step 2: Boje i varijante
  // colorVariants = { 'Crna': {slike: [], selectedSizes: []}, 'Bela': {...} }
  const [colorVariants, setColorVariants] = useState({});
  const [currentColorForm, setCurrentColorForm] = useState({
    boja: '',
    slike: [],
    selectedSizes: [], // [{velicina: '36', stanje: 5}, ...]
  });
  const [editingColorName, setEditingColorName] = useState(null); // Koji color se edituje
  const [favoriteBoja, setFavoriteBoja] = useState(null); // Koja boja je favorite (prva za prikazivanje kupcima)

  // Pomoćni state za Step 2 iteraciju
  const [sizeDropdown, setSizeDropdown] = useState(''); // Privremeni value za dropdown

  // Step 3: Pregled
  const [variants, setVariants] = useState([]);

  // Edit mode
  const [isEditingMode, setIsEditingMode] = useState(false); // Da li je modal u edit modu
  const [editingProizvodCodeBase, setEditingProizvodCodeBase] = useState(null); // code_base proizvoda koji se edituje

  // Quick edit stanje
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [quickEditItem, setQuickEditItem] = useState(null);
  const [quickEditStanje, setQuickEditStanje] = useState(0);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [isGroupedEdit, setIsGroupedEdit] = useState(false);

  // Filteri
  const [filterCategories, setFilterCategories] = useState([]);
  const [filterSizes, setFilterSizes] = useState([]);
  const [filterColors, setFilterColors] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Recommended Products Modal
  const [showRecommendedModal, setShowRecommendedModal] = useState(false);
  const [preporuceni, setPreporuceni] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [searchRecommendedInput, setSearchRecommendedInput] = useState('');

  // Image Gallery Modal
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProizvodForImages, setSelectedProizvodForImages] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageThumbScrollPos, setImageThumbScrollPos] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch kategorije
  const fetchKategorije = async () => {
    try {
      setKategorijeLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://butikirna.com/api/kategorije/get?active=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Greška pri učitavanju kategorija');
      const data = await response.json();
      setKategorije(data.kategorije || []);
    } catch (err) {
      console.error('Greška pri učitavanju kategorija:', err);
      toast.error('⚠️ Greška pri učitavanju kategorija');
    } finally {
      setKategorijeLoading(false);
    }
  };
  useEffect(() => {
    fetchKategorije();
  }, []);

  // Fetch recommended products
  const fetchPreporuceni = async () => {
    try {
      setRecommendedLoading(true);
      const response = await fetch(`${API_BASE}/api/preporuceno/get`);
      if (!response.ok) throw new Error('Greška pri učitavanju preporučenih proizvoda');
      const data = await response.json();
      setPreporuceni(data.preporuceni || []);
    } catch (err) {
      console.error('Greška pri učitavanju preporučenih proizvoda:', err);
      toast.error('⚠️ Greška pri učitavanju preporučenih proizvoda');
    } finally {
      setRecommendedLoading(false);
    }
  };

  // Fetch available products for adding to recommended
  const fetchAvailableProducts = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      params.append('limit', 100);
      params.append('offset', 0);
      params.append('group_by', 'code_base');

      if (searchRecommendedInput) {
        params.append('search', searchRecommendedInput);
      }

      const response = await fetch(
        `${API_BASE}/api/proizvodi/get?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Greška pri učitavanju proizvoda');
      const data = await response.json();
      
      // Filter out products that are already recommended
      const recommendedCodes = preporuceni.map(p => p.code_base);
      const filtered = (data.proizvodi || []).filter(p => !recommendedCodes.includes(p.code_base));
      setAvailableProducts(filtered);
    } catch (err) {
      console.error('Greška pri učitavanju dostupnih proizvoda:', err);
      toast.error('⚠️ Greška pri učitavanju dostupnih proizvoda');
    }
  };

  // Add product to recommended
  const handleAddRecommended = async (codeBase) => {
    // Validate max 12
    if (preporuceni.length >= 12) {
      toast.error('⚠️ Maksimalno 12 preporučenih proizvoda!');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/preporuceno/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code_base: codeBase }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Greška pri dodavanju proizvoda');
      }
      
      toast.success('✅ Proizvod je dodan u preporučene');
      await fetchPreporuceni();
      await fetchAvailableProducts();
    } catch (err) {
      console.error('Greška:', err);
      toast.error(`⚠️ ${err.message}`);
    }
  };

  // Remove product from recommended and reorder others
  const handleRemoveRecommended = async (codeBase) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/preporuceno/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code_base: codeBase }),
      });
      
      if (!response.ok) throw new Error('Greška pri brisanju proizvoda');
      
      toast.success('✅ Proizvod je obrisan iz preporučenih');
      
      // Fetch all remaining products and sort them by current redosled
      const currentPreporuceni = await (await fetch(`${API_BASE}/api/preporuceno/get`)).json();
      let items = currentPreporuceni.preporuceni || [];
      
      // Sort by redosled first to ensure proper order
      items = items.sort((a, b) => a.redosled - b.redosled);
      
      // Reorder all items SEQUENTIALLY to have sequential redoslede (1, 2, 3, ...)
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const newRedosled = index + 1;
        
        if (item.redosled !== newRedosled) {
          const patchResponse = await fetch(`${API_BASE}/api/preporuceno/patch`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              code_base: item.code_base,
              redosled: newRedosled,
            }),
          });
          
          if (!patchResponse.ok) {
            console.error(`Greška pri ažuriranju redosleda za ${item.code_base}`);
          }
        }
      }
      
      await fetchPreporuceni();
      await fetchAvailableProducts();
    } catch (err) {
      console.error('Greška:', err);
      toast.error('⚠️ Greška pri brisanju proizvoda');
    }
  };

  // Move product up in recommended list
  const handleMoveUp = async (currentRedosled) => {
    if (currentRedosled <= 1) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/preporuceno/patch`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          redosled_1: currentRedosled - 1,
          redosled_2: currentRedosled,
        }),
      });
      
      if (!response.ok) throw new Error('Greška pri premještanju proizvoda');
      
      await fetchPreporuceni();
    } catch (err) {
      console.error('Greška:', err);
      toast.error('⚠️ Greška pri premještanju proizvoda');
    }
  };

  // Move product down in recommended list
  const handleMoveDown = async (currentRedosled, totalCount) => {
    if (currentRedosled >= totalCount) return;
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/preporuceno/patch`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          redosled_1: currentRedosled,
          redosled_2: currentRedosled + 1,
        }),
      });
      
      if (!response.ok) throw new Error('Greška pri premještanju proizvoda');
      
      await fetchPreporuceni();
    } catch (err) {
      console.error('Greška:', err);
      toast.error('⚠️ Greška pri premještanju proizvoda');
    }
  };

  // Open recommended products modal
  const handleOpenRecommendedModal = async () => {
    setShowRecommendedModal(true);
    setSearchRecommendedInput('');
    await fetchPreporuceni();
    // Fetch available products will be called when preporuceni updates
  };

  // Fetch proizvodi - server-side filtering, sorting, searching
  const fetchProizvodi = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Niste autentifikovani. Molimo vas da se prijavite.');
        return;
      }

      // Izračunaj offset na osnovu trenutne stranice
      const offset = (currentPage - 1) * itemsPerPage;

      // Построј query parametre
      const params = new URLSearchParams();
      params.append('limit', itemsPerPage);
      params.append('offset', offset);
      
      // Grupisanje
      if (isGrouped) params.append('group_by', 'code_base');
      
      // Filteri
      if (searchTerm) params.append('search', searchTerm);
      if (filterCategories.length > 0) params.append('kategorije', filterCategories.join(','));
      if (filterColors.length > 0) params.append('boje', filterColors.join(','));
      if (filterSizes.length > 0 && !isGrouped) params.append('veličine', filterSizes.join(','));
      
      // Sortiranje
      if (sortBy) params.append('sort_by', sortBy);
      if (sortBy) params.append('sort_order', sortOrder);

      const response = await fetch(
        `${API_BASE}/api/proizvodi/get?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Greška: ${response.status}`);
      }

      const data = await response.json();
      setProizvodi(data.proizvodi || []);
      setTotalProizvodiCount(data.pagination.ukupno_proizvoda);
    } catch (err) {
      console.error('Greška pri učitavanju proizvoda:', err);
      setError(err.message || 'Greška pri učitavanju proizvoda');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!isMounted) return;

    fetchProizvodi();
  }, [isMounted, currentPage, itemsPerPage, searchTerm, filterCategories, filterColors, filterSizes, sortBy, sortOrder]);

  // Reset sortiranje kada se promijeni grupisanje
  useEffect(() => {
    setSortBy(null);
    setSortOrder('asc');
    setFilterCategories([]);
    setFilterSizes([]);
    setFilterColors([]);
    setCurrentPage(1);
  }, [isGrouped]);

  // Fetch available products when preporuceni changes or search input changes
  useEffect(() => {
    if (showRecommendedModal && preporuceni.length >= 0) {
      fetchAvailableProducts();
    }
  }, [showRecommendedModal, preporuceni, searchRecommendedInput]);

  // Grupisanje proizvoda po code_base
  const getGroupedProizvodi = () => {
    const grouped = {};
    proizvodi.forEach((p) => {
      if (!grouped[p.code_base]) {
        grouped[p.code_base] = {
          code_base: p.code_base,
          ime: p.ime,
          kategorija: p.kategorija,
          cena: p.cena,
          popust: p.popust,
          stanje: 0,
          originalItem: p,
        };
      }
      grouped[p.code_base].stanje += p.stanje;
    });
    return Object.values(grouped);
  };

  // Paginacija - koristi totalProizvodiCount od backenda (backend radi filtriranje, sortiranje, i grupisanje)
  const totalPages = Math.ceil(totalProizvodiCount / itemsPerPage);
  const paginatedProizvodi = proizvodi; // Backend već vraća grupirane ili sortirane podatke

  // === MODAL FUNKCIJE ===

  const handleOpenModal = () => {
    setShowModal(true);
    setModalStep(1);
    setStep1Data({ ime: '', opis: '', cena: '', popust: 0, kategorija: '', preset: 'obuca' });
    setColorVariants({});
    setCurrentColorForm({
      boja: '',
      slike: [],
      selectedSizes: [],
    });
    setSizeDropdown('');
    setVariants([]);
    setEditingColorName(null);
    setFavoriteBoja(null);
    setIsEditingMode(false);
    setEditingProizvodCodeBase(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalStep(1);
    setStep1Data({ ime: '', opis: '', cena: '', popust: 0, kategorija: '', preset: 'obuca' });
    setColorVariants({});
    setCurrentColorForm({
      boja: '',
      slike: [],
      selectedSizes: [],
    });
    setSizeDropdown('');
    setVariants([]);
    setEditingColorName(null);
    setFavoriteBoja(null);
    setIsEditingMode(false);
    setEditingProizvodCodeBase(null);
    setIsGroupedEdit(false);
  };

  // Quick edit funkcije
  const handleQuickEdit = (proizvod) => {
    setQuickEditItem(proizvod);
    setQuickEditStanje(proizvod.stanje);
    setQuickEditOpen(true);
  };

  const handleConfirmQuickEdit = async () => {
    if (!quickEditItem) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/proizvodi/put`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: quickEditItem.id,
          stanje: parseInt(quickEditStanje)
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success('✅ Stanje ažurirano!', { position: 'top-right' });
      fetchProizvodi();
      setQuickEditOpen(false);
    } catch (err) {
      toast.error(`❌ ${err.message}`, { position: 'top-right' });
    }
  };

  const handleCancelQuickEdit = () => {
    setQuickEditOpen(false);
    setQuickEditItem(null);
    setQuickEditStanje(0);
  };

  // Delete funkcije
  const handleOpenDeleteConfirm = (proizvod) => {
    setDeleteConfirmItem(proizvod);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;

    if (isGrouped) {
      // Grupisano - obriši sve varijante sa ovim code_base
      await handleDeleteAllVariants(deleteConfirmItem.code_base);
    } else {
      // Obična tabela - obriši samo ovaj proizvod
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE}/api/proizvodi/delete/${deleteConfirmItem.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        toast.success('Proizvod je uspešno obrisan!', { position: 'top-right' });
        fetchProizvodi();
        setDeleteConfirmOpen(false);
        setDeleteConfirmItem(null);
      } catch (err) {
        toast.error(`Greška: ${err.message}`, { position: 'top-right' });
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeleteConfirmItem(null);
  };

  // Grupisanje i brisanje svih varijanti
  const handleDeleteAllVariants = async (codeBase) => {
    if (!codeBase) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/proizvodi/delete-all-variants/${codeBase}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success('Sve varijante su uspešno obrisane!', { position: 'top-right' });
      fetchProizvodi();
      setDeleteConfirmOpen(false);
      setDeleteConfirmItem(null);
    } catch (err) {
      toast.error(`Greška: ${err.message}`, { position: 'top-right' });
    }
  };

  const handleStep1Submit = () => {
    if (!step1Data.ime.trim()) {
      toast.error('Unesi naziv proizvoda', { position: 'top-right' });
      return;
    }
    if (!step1Data.cena || step1Data.cena <= 0) {
      toast.error('Unesi validnu cenu', { position: 'top-right' });
      return;
    }
    if (!step1Data.kategorija.trim()) {
      toast.error('Odaberi kategoriju', { position: 'top-right' });
      return;
    }
    setModalStep(2);
  };

  const getSizes = () => {
    return SIZE_PRESETS[step1Data.preset] || SIZE_PRESETS.obuca;
  };

  const handleImageUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    const newImages = [];
    let filesProcessed = 0;

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} nije slika`, { position: 'top-right' });
        filesProcessed++;
        if (filesProcessed === files.length) {
          event.target.value = '';
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        newImages.push({
          name: file.name,
          base64: e.target.result,
        });
        filesProcessed++;

        if (filesProcessed === files.length) {
          setCurrentColorForm({
            ...currentColorForm,
            slike: [...currentColorForm.slike, ...newImages],
          });
          toast.success(`${newImages.length} slika${newImages.length !== 1 ? 'e' : ''} dodate!`, { position: 'top-right' });
          event.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveSlika = (index) => {
    setCurrentColorForm({
      ...currentColorForm,
      slike: currentColorForm.slike.filter((_, i) => i !== index),
    });
  };

  // === STEP 2: NOVE FUNKCIJE ZA VELIČINE ===

  const handleAddSize = () => {
    if (!sizeDropdown) {
      toast.error('Odaberi veličinu', { position: 'top-right' });
      return;
    }

    // Proveri da li je već dodana
    if (currentColorForm.selectedSizes.some(s => s.velicina === sizeDropdown)) {
      toast.error(`Veličina "${sizeDropdown}" je već dodata`, { position: 'top-right' });
      return;
    }

    setCurrentColorForm({
      ...currentColorForm,
      selectedSizes: [
        ...currentColorForm.selectedSizes,
        { velicina: sizeDropdown, stanje: '' },
      ],
    });
    setSizeDropdown('');
  };

  const handleRemoveSize = (velicina) => {
    setCurrentColorForm({
      ...currentColorForm,
      selectedSizes: currentColorForm.selectedSizes.filter(s => s.velicina !== velicina),
    });
  };

  const handleUpdateSizeStanje = (velicina, newStanje) => {
    setCurrentColorForm({
      ...currentColorForm,
      selectedSizes: currentColorForm.selectedSizes.map(s =>
        s.velicina === velicina ? { ...s, stanje: newStanje } : s
      ),
    });
  };

  // EDIT COLOR FUNKCIJE
  const handleEditColor = (colorName) => {
    const colorData = colorVariants[colorName];
    setCurrentColorForm({
      boja: colorName,
      slike: colorData.slike,
      selectedSizes: colorData.selectedSizes,
    });
    setEditingColorName(colorName);
    toast.info(`Uredj boju "${colorName}" ili klikni "Otkaži"`, { position: 'top-center' });
  };

  const handleCancelEdit = () => {
    setEditingColorName(null);
    setCurrentColorForm({
      boja: '',
      slike: [],
      selectedSizes: [],
    });
    setSizeDropdown('');
  };

  const handleDeleteColor = (colorName) => {
    const newColorVariants = { ...colorVariants };
    delete newColorVariants[colorName];
    setColorVariants(newColorVariants);
    if (editingColorName === colorName) {
      handleCancelEdit();
    }
    toast.success(`Boja "${colorName}" obrisana!`, { position: 'top-right' });
  };

  // Konvertuj colorVariants u variants array za Step 3
  const handleProceedFromStep2 = () => {
    if (Object.keys(colorVariants).length === 0) {
      toast.error('Dodaj bar jednu boju sa varijantama!', { position: 'top-right' });
      return;
    }

    // Kreiraj variants iz colorVariants
    const allVariants = [];
    Object.entries(colorVariants).forEach(([colorName, colorData]) => {
      colorData.selectedSizes.forEach(sizeObj => {
        allVariants.push({
          ime: step1Data.ime,
          opis: step1Data.opis,
          cena: step1Data.cena,
          popust: step1Data.popust,
          kategorija: step1Data.kategorija,
          boja: colorName,
          velicina: sizeObj.velicina,
          stanje: parseInt(sizeObj.stanje) || 0,
          slike: colorData.slike,
        });
      });
    });

    setVariants(allVariants);
    setModalStep(3);
  };

  const handleAddColor = () => {
    if (!currentColorForm.boja.trim()) {
      toast.error('Odaberi boju', { position: 'top-right' });
      return;
    }
    if (currentColorForm.selectedSizes.length === 0) {
      toast.error('⚠️ Dodaj bar jednu veličinu sa stanjem', { position: 'top-right' });
      return;
    }

    // Proveri da li su sva stanja popunjena
    const incompleteSizes = currentColorForm.selectedSizes.filter(s => !s.stanje);
    if (incompleteSizes.length > 0) {
      toast.error(`⚠️ Popuni stanje za sve veličine`, { position: 'top-right' });
      return;
    }

    if (editingColorName) {
      // Ažuriranje postojeće boje
      setColorVariants({
        ...colorVariants,
        [editingColorName]: {
          slike: currentColorForm.slike,
          selectedSizes: currentColorForm.selectedSizes,
        }
      });
      toast.success(`✅ Boja "${editingColorName}" ažurirana!`, { position: 'top-right' });
      setEditingColorName(null);
    } else {
      // Dodavanje nove boje
      if (colorVariants[currentColorForm.boja]) {
        toast.error('⚠️ Ova boja je već dodata!', { position: 'top-right' });
        return;
      }
      setColorVariants({
        ...colorVariants,
        [currentColorForm.boja]: {
          slike: currentColorForm.slike,
          selectedSizes: currentColorForm.selectedSizes,
        }
      });
      toast.success(`✅ Boja "${currentColorForm.boja}" dodana sa ${currentColorForm.selectedSizes.length} varijanti!`, { position: 'top-right' });
    }

    // Resetuj formu za sledeću boju
    setCurrentColorForm({
      boja: '',
      slike: [],
      selectedSizes: [],
    });
    setSizeDropdown('');
  };

  const handleSubmitVarijante = async () => {
    // U edit modu, prvo napravi variants iz TRENUTNOG colorVariants
    let variantsToSubmit = variants;
    
    if (isEditingMode) {
      const allVariants = [];
      Object.entries(colorVariants).forEach(([colorName, colorData]) => {
        colorData.selectedSizes.forEach(sizeObj => {
          allVariants.push({
            ime: step1Data.ime,
            opis: step1Data.opis,
            cena: step1Data.cena,
            popust: step1Data.popust,
            kategorija: step1Data.kategorija,
            boja: colorName,
            velicina: sizeObj.velicina,
            stanje: parseInt(sizeObj.stanje) || 0,
            slike: colorData.slike,
          });
        });
      });
      variantsToSubmit = allVariants;
    }

    if (variantsToSubmit.length === 0) {
      toast.error('Dodaj bar jednu boju sa varijantama', { position: 'top-right' });
      return;
    }

    // Ako ni jedna boja nije označena kao favorite, postavi prvu
    let finalFavorite = favoriteBoja || Object.keys(colorVariants)[0];

    // Dodaj fav svojstvo svakoj varijanti
    const variantsWithFav = variantsToSubmit.map(variant => ({
      ...variant,
      fav: variant.boja === finalFavorite,
    }));

    try {
      const token = localStorage.getItem('access_token');
      
      // Odaberi endpoint i metodu prema modu
      const endpoint = isEditingMode 
        ? `${API_BASE}/api/proizvodi/put`
        : `${API_BASE}/api/proizvodi/post`;
      const method = isEditingMode ? 'PUT' : 'POST';
      
      // Ako je edit mode, dodaj code_base u payload
      const payload = isEditingMode 
        ? { code_base: editingProizvodCodeBase, varijante: variantsWithFav }
        : variantsWithFav;

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Greška: ${response.status}`);
      }

      const actionText = isEditingMode ? 'ažurirano' : 'dodat';
      toast.success(`✅ Proizvod je uspešno ${actionText}!`, { position: 'top-right' });
      fetchProizvodi();
      handleCloseModal();
      // Osvežava proizvode - vrati na prvu stranicu
      setCurrentPage(1);
    } catch (err) {
      console.error('Greška pri submite proizvoda:', err);
      toast.error(`❌ ${err.message}`, { position: 'top-right' });
    }
  };

  const handleEditProizvod = (proizvod) => {
    // Ako je grupisano i nema originalItem, pronađi prvi proizvod sa tim code_base
    let selectedProizvod = proizvod.originalItem || proizvod;
    if (isGrouped && !proizvod.originalItem) {
      selectedProizvod = proizvodi.find(p => p.code_base === proizvod.code_base) || proizvod;
    }

    // Učitaj SVE varijante sa istim code_base
    const allVariantsForProduct = proizvodi.filter(p => p.code_base === selectedProizvod.code_base);
    
    // Grupiraj po boji
    const groupedByColor = {};
    
    allVariantsForProduct.forEach(var_item => {
      if (!groupedByColor[var_item.boja]) {
        // Parsiraj slike iz JSON stringa ako je potrebno
        let parsedSlike = [];
        if (var_item.slike) {
          if (typeof var_item.slike === 'string') {
            try {
              parsedSlike = JSON.parse(var_item.slike);
            } catch (e) {
              parsedSlike = [];
            }
          } else if (Array.isArray(var_item.slike)) {
            parsedSlike = var_item.slike;
          }
        }
        
        groupedByColor[var_item.boja] = {
          slike: parsedSlike,
          selectedSizes: []
        };
      }
      groupedByColor[var_item.boja].selectedSizes.push({
        velicina: var_item.velicina,
        stanje: var_item.stanje,
      });
    });

    // Detektuj preset na osnovu veličine
    let detectedPreset = 'odeca'; // Default
    
    if (!selectedProizvod.velicina || selectedProizvod.velicina.trim() === '') {
      detectedPreset = 'bezVelicine';
    } else if (/^\d+$/.test(selectedProizvod.velicina)) {
      const sizeNum = parseInt(selectedProizvod.velicina);
      // 32-52 su pantalone, 36-52 su obuća
      if (sizeNum >= 32 && sizeNum <= 52) {
        detectedPreset = SIZE_PRESETS.pantalone.includes(selectedProizvod.velicina) ? 'pantalone' : 'obuca';
      } else {
        detectedPreset = 'obuca';
      }
    } else {
      detectedPreset = 'odeca';
    }

    // Postavi edit mode
    setIsEditingMode(true);
    setEditingProizvodCodeBase(selectedProizvod.code_base);

    // Popuni formu
    setStep1Data({
      ime: selectedProizvod.ime,
      opis: selectedProizvod.opis,
      cena: selectedProizvod.cena || '',
      popust: selectedProizvod.popust || 0,
      kategorija: selectedProizvod.kategorija,
      preset: detectedPreset,
    });

    setColorVariants(groupedByColor);
    setFavoriteBoja(selectedProizvod.fav ? selectedProizvod.boja : null);
    
    // Ako je grupisano, preskočir Step 2 i idi direktno na Step 1
    if (isGrouped) {
      setIsGroupedEdit(true);
      
      // Kreiraj variants iz colorVariants odmah
      const allVariants = [];
      Object.entries(groupedByColor).forEach(([colorName, colorData]) => {
        colorData.selectedSizes.forEach(sizeObj => {
          allVariants.push({
            ime: selectedProizvod.ime,
            opis: selectedProizvod.opis,
            kategorija: selectedProizvod.kategorija,
            boja: colorName,
            velicina: sizeObj.velicina,
            stanje: parseInt(sizeObj.stanje) || 0,
            slike: colorData.slike,
          });
        });
      });
      
      setVariants(allVariants);
      setShowModal(true);
      setModalStep(1);
      toast.info(`Uređivanje proizvoda: ${selectedProizvod.ime} - sve varijante učitane!`, { position: 'top-right' });
    } else {
      // Obično menjanje - Step 2 sa izborom boje
      setIsGroupedEdit(false);
      
      // Odmah aktiviraj edit mode za prvu boju
      const firstColor = Object.keys(groupedByColor)[0];
      setEditingColorName(firstColor);
      setCurrentColorForm({
        boja: firstColor,
        slike: groupedByColor[firstColor].slike,
        selectedSizes: groupedByColor[firstColor].selectedSizes
      });
      
      // Otvori modal na Step 2 (boje i varijante)
      setShowModal(true);
      setModalStep(2);
      
      toast.info(`Uređivanje proizvoda: ${proizvod.ime} - sve boje učitane!`, { position: 'top-right' });
    }
  };

  const handleSortIcon = (column) => {
    if (sortBy !== column) return 'fas fa-sort';
    return sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Resetuj na prvu stranicu kada se menja sortiranje
  };

  if (!isMounted) return null;

  return (
    <div className={styles.container}>
      <ToastContainer />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Proizvodi</h1>
          <p>Upravljajte proizvodima vašeg online shopu</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={styles.addButton} onClick={handleOpenRecommendedModal}>
            <i className="fas fa-star"></i>
            Preporučeni
          </button>
          <button className={styles.addButton} onClick={handleOpenModal}>
            <i className="fas fa-plus"></i>
            Dodaj Proizvod
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loading}>
          <i className="fas fa-spinner"></i>
          <p style={{ marginTop: '20px', color: '#0099cc', fontSize: '1.1rem' }}>
            Učitavanje proizvoda...
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

      {/* Table View */}
      {!loading && !error && (
        <div className={styles.tableSection}>
          {/* Search Bar */}
          <div className={styles.searchBar}>
            <input
              type="text"
              placeholder="Pretraži proizvode..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setSearchTerm(searchInput);
                  setCurrentPage(1);
                }
              }}
            />
            <button
              className={styles.searchBtn}
              onClick={() => {
                setSearchTerm(searchInput);
                setCurrentPage(1);
              }}
              title="Pretraži (Enter ili klik)"
            >
              <i className="fas fa-search"></i>
            </button>
            {searchInput && (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          {/* Controls: Items Per Page + Group Button + Filter Button */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            gap: '12px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#666' }}>
                Stavke po stranici:
              </label>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 10px',
                  paddingRight: '30px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  backgroundColor: 'white',
                }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setIsGrouped(!isGrouped)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #0099cc',
                  background: isGrouped ? '#0099cc' : 'white',
                  color: isGrouped ? 'white' : '#0099cc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '13px',
                  transition: 'all 0.2s',
                }}
              >
                <i className={`fas fa-${isGrouped ? 'unlink' : 'link'}`}></i> 
                {isGrouped ? 'Razdeli' : 'Grupiši'}
              </button>

              <button 
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${showFilters ? '#ff6b6b' : '#6c757d'}`,
                  background: showFilters ? '#ff6b6b' : 'white',
                  color: showFilters ? 'white' : '#6c757d',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '13px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="fas fa-filter"></i>
                Filteri
                {(filterCategories.length > 0 || filterColors.length > 0 || filterSizes.length > 0) && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                    height: '20px',
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    borderRadius: '50%',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}>
                    {filterCategories.length + filterColors.length + filterSizes.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filteri - Collapsible Panel */}
          {showFilters && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}>
              {/* Filter po kategoriji */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '6px' }}>
                  <i className="fas fa-tag" style={{ fontSize: '12px', color: '#0099cc' }}></i>
                  Kategorija
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto', paddingRight: '8px' }}>
                  {kategorije.map(kat => (
                    <label key={kat.id || kat.kategorija} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={filterCategories.includes(kat.kategorija)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterCategories([...filterCategories, kat.kategorija]);
                          } else {
                            setFilterCategories(filterCategories.filter(f => f !== kat.kategorija));
                          }
                          setCurrentPage(1);
                        }}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <span style={{ color: '#333', fontSize: '12px' }}>{kat.kategorija}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter po bojama */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '6px' }}>
                  <i className="fas fa-palette" style={{ fontSize: '12px', color: '#9b59b6' }}></i>
                  Boje
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto', paddingRight: '8px' }}>
                  {Object.keys(COLORS).map(boja => (
                    <label key={boja} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={filterColors.includes(boja)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilterColors([...filterColors, boja]);
                          } else {
                            setFilterColors(filterColors.filter(f => f !== boja));
                          }
                          setCurrentPage(1);
                        }}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <div style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        backgroundColor: COLORS[boja],
                        border: '1px solid #999',
                        borderRadius: '3px',
                      }}></div>
                      <span style={{ color: '#333', fontSize: '12px' }}>{boja}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter po veličinama (samo za ungrouped prikaz) */}
              {!isGrouped && (
                <>
                  {/* Veličine Obuće */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '6px' }}>
                      <i className="fas fa-shoe-prints" style={{ fontSize: '12px', color: '#e67e22' }}></i>
                      Veličine - Obuća
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto', paddingRight: '8px' }}>
                      {SIZE_PRESETS.obuca.map(size => (
                        <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            checked={filterSizes.includes(size)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilterSizes([...filterSizes, size]);
                              } else {
                                setFilterSizes(filterSizes.filter(f => f !== size));
                              }
                              setCurrentPage(1);
                            }}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <span style={{ color: '#333', fontSize: '12px' }}>{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Veličine Odeće */}
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '6px' }}>
                      <i className="fas fa-shirt" style={{ fontSize: '12px', color: '#3498db' }}></i>
                      Veličine - Odeća
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto', paddingRight: '8px' }}>
                      {SIZE_PRESETS.odeca.map(size => (
                        <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
                          <input
                            type="checkbox"
                            checked={filterSizes.includes(size)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilterSizes([...filterSizes, size]);
                              } else {
                                setFilterSizes(filterSizes.filter(f => f !== size));
                              }
                              setCurrentPage(1);
                            }}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                          <span style={{ color: '#333', fontSize: '12px' }}>{size}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Očisti filtere */}
              {(filterCategories.length > 0 || filterColors.length > 0 || filterSizes.length > 0) && (
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setFilterCategories([]);
                      setFilterColors([]);
                      setFilterSizes([]);
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#ff6b6b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#ee5a52'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#ff6b6b'}
                  >
                    <i className="fas fa-filter-circle-xmark"></i>
                    Očisti sve
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Info */}
          <div className={styles.resultInfo}>
            <span>
              Prikazano <strong>{paginatedProizvodi.length}</strong> od <strong>{totalProizvodiCount}</strong> proizvoda
              {isGrouped && ' (grupisano po code_base)'}
            </span>
          </div>

          {/* Empty State or Table */}
          {proizvodi.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: '40px 20px', textAlign: 'center' }}>
              <i className="fas fa-inbox"></i>
              <h3>Nema Proizvoda</h3>
              <p>Počnite dodavanjem prvog proizvoda za vaš shop</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.codeColumn} style={{ textAlign: 'center' }}>
                      Šifra
                    </th>
                    <th className={styles.nameColumn}>
                      <button className={styles.sortBtn} onClick={() => handleSort('ime')}>
                        Naziv <i className={handleSortIcon('ime')}></i>
                      </button>
                    </th>
                    {!isGrouped && (
                      <>
                        <th className={styles.bojaColumn} style={{ textAlign: 'center' }}>Boja</th>
                        <th className={styles.sizeColumn} style={{ textAlign: 'center' }}>Veličina</th>
                      </>
                    )}
                    <th className={styles.stanjeColumn} style={{ textAlign: 'center' }}>
                      <button className={styles.sortBtn} onClick={() => handleSort('stanje')}>
                        Stanje <i className={handleSortIcon('stanje')}></i>
                      </button>
                    </th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', minWidth: '100px' }}>
                      <button className={styles.sortBtn} onClick={() => handleSort('cena')}>
                        Cena <i className={handleSortIcon('cena')}></i>
                      </button>
                    </th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', minWidth: '80px' }}>
                      <button className={styles.sortBtn} onClick={() => handleSort('popust')}>
                        Popust <i className={handleSortIcon('popust')}></i>
                      </button>
                    </th>
                    <th className={styles.categoryColumn}>
                      <button className={styles.sortBtn} onClick={() => handleSort('kategorija')}>
                        Kategorija <i className={handleSortIcon('kategorija')}></i>
                      </button>
                    </th>
                    <th style={{ textAlign: 'center', padding: '12px 8px', minWidth: '80px' }}>Slike</th>
                    <th className={styles.actionColumn} style={{ textAlign: 'center' }}>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProizvodi.map((proizvod, index) => (
                  <tr key={`${proizvod.code_base}-${index}`} className={index % 2 === 0 ? styles.rowEven : ''}>
                    <td className={styles.codeColumn}>
                      <span className={styles.codeBadge}>
                        {isGrouped ? proizvod.code_base : `${proizvod.code_base}-${proizvod.code_variant}`}
                      </span>
                    </td>
                    <td className={styles.nameColumn}>
                      <div className={styles.productName}>
                        <i className="fas fa-box"></i>
                        {proizvod.ime}
                      </div>
                    </td>
                    {!isGrouped && (
                      <>
                        <td className={styles.bojaColumn}>
                          <span className={styles.bojaBadge}>{proizvod.boja}</span>
                        </td>
                        <td className={styles.sizeColumn}>
                          <span className={styles.sizeBadge}>{proizvod.velicina}</span>
                        </td>
                      </>
                    )}
                    <td className={styles.stanjeColumn}>
                      <span 
                        className={`${styles.stanjeBadge} ${proizvod.stanje === 0 ? styles.outOfStock : ''}`}
                        onClick={() => !isGrouped && handleQuickEdit(proizvod)}
                        style={{ cursor: !isGrouped ? 'pointer' : 'default' }}
                        title={!isGrouped ? 'Klikni da izmeniš stanje' : ''}
                      >
                        {proizvod.stanje}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 8px', minWidth: '100px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        {proizvod.popust > 0 ? (
                          <>
                            <span style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '14px' }}>
                              {(parseFloat(proizvod.cena) - (parseFloat(proizvod.cena) * proizvod.popust / 100)).toFixed(2)} KM
                            </span>
                            <span style={{ color: '#999', fontSize: '12px' }}>
                              {parseFloat(proizvod.cena).toFixed(2)} KM
                            </span>
                          </>
                        ) : (
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>
                            {parseFloat(proizvod.cena).toFixed(2)} KM
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 8px', minWidth: '80px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        backgroundColor: proizvod.popust > 0 ? '#fff3cd' : '#e9ecef',
                        color: proizvod.popust > 0 ? '#856404' : '#6c757d',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {proizvod.popust}%
                      </span>
                    </td>
                    <td className={styles.categoryColumn}>
                      {proizvod.kategorija}
                    </td>
                    <td style={{ textAlign: 'center', padding: '2px', minWidth: '80px' }}>
                      {proizvod.slike && proizvod.slike.length > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedProizvodForImages(proizvod);
                            setSelectedImageIndex(0);
                            setImageThumbScrollPos(0);
                            setShowImageModal(true);
                          }}
                          style={{
                            border: 'none',
                            background: 'none',
                            padding: '0',
                            cursor: 'pointer',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <img
                            src={`${API_BASE}/api/proizvodi/slike/${proizvod.slike[0]}`}
                            alt="Thumbnail"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '60px',
                              objectFit: 'contain'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </button>
                      ) : (
                        <span style={{ color: '#999', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td className={styles.actionColumn}>
                      <button 
                        className={styles.actionBtnEdit} 
                        title="Uredi"
                        onClick={() => handleEditProizvod(proizvod)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className={styles.actionBtnDelete} 
                        title={isGrouped ? "Obriši sve varijante" : "Obriši"} 
                        onClick={() => handleOpenDeleteConfirm(isGrouped ? { code_base: proizvod.code_base, ime: proizvod.ime, kategorija: proizvod.kategorija } : proizvod)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                  </tbody>
                </table>
              </div>
            )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      )}

      {/* === MODAL - MULTI-STEP FORMA === */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                {isEditingMode && <span style={{ fontSize: '0.8em', color: '#0099cc', marginRight: '10px' }}>[IZMJENA]</span>}
                {modalStep === 1 && <span><i className="fas fa-file-alt" style={{ marginRight: '10px' }}></i>Osnovne Informacije</span>}
                {modalStep === 2 && <span><i className="fas fa-palette" style={{ marginRight: '10px' }}></i>Dodaj Boje i Varijante</span>}
                {modalStep === 3 && <span><i className="fas fa-clipboard-list" style={{ marginRight: '10px' }}></i>Pregled Proizvoda</span>}
              </h2>
              <button className={styles.closeBtn} onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* === STEP 1: OSNOVNO INFO === */}
            {modalStep === 1 && (
              <div className={styles.modalBody}>
                <div className={styles.stepIndicator}>
                  <div className={styles.step + ' ' + styles.active}>1</div>
                  <div className={styles.stepLine}></div>
                  <div className={styles.step}>2</div>
                  <div className={styles.stepLine}></div>
                  <div className={styles.step}>3</div>
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <i className="fas fa-heading"></i>
                    Naziv Proizvoda
                  </label>
                  <input
                    type="text"
                    placeholder="npr. Nike Patika"
                    value={step1Data.ime}
                    onChange={(e) => setStep1Data({ ...step1Data, ime: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <i className="fas fa-align-left"></i>
                    Opis
                  </label>
                  <textarea
                    placeholder="npr. Zimska patika od kvalitetnih materijala..."
                    value={step1Data.opis}
                    onChange={(e) => setStep1Data({ ...step1Data, opis: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className={styles.formGroup} style={{ flex: '0 0 70%' }}>
                    <label>
                      <i className="fas fa-tag"></i>
                      Cena
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="1"
                        placeholder=""
                        value={step1Data.cena}
                        onChange={(e) => setStep1Data({ ...step1Data, cena: e.target.value })}
                        style={{ 
                          paddingRight: '30px',
                          /* Remove number spinners */
                        }}
                      />
                      <span style={{ position: 'absolute', right: '12px', color: '#666', fontWeight: '600', fontSize: '16px', pointerEvents: 'none' }}>KM</span>
                    </div>
                  </div>

                  <div className={styles.formGroup} style={{ flex: '0 0 30%' }}>
                    <label>
                      <i className="fas fa-percent"></i>
                      Popust
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={step1Data.popust}
                        onChange={(e) => {
                          let val = parseInt(e.target.value) || 0;
                          if (val < 0) val = 0;
                          if (val > 100) val = 100;
                          setStep1Data({ ...step1Data, popust: val });
                        }}
                        style={{ paddingRight: '30px' }}
                      />
                      <span style={{ position: 'absolute', right: '12px', color: '#666', fontWeight: '600', fontSize: '16px', pointerEvents: 'none' }}>%</span>
                    </div>
                  </div>
                </div>

                <style>{`
                  input[type="number"]::-webkit-outer-spin-button,
                  input[type="number"]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                  }
                  
                  input[type="number"] {
                    -moz-appearance: textfield;
                  }
                `}</style>

                <div className={styles.formGroup}>
                  <label>
                    <i className="fas fa-folder"></i>
                    Kategorija
                  </label>
                  <select
                    value={step1Data.kategorija}
                    onChange={(e) => setStep1Data({ ...step1Data, kategorija: e.target.value })}
                    disabled={kategorijanjeLoading}
                  >
                    <option value="">-- Odaberi kategoriju --</option>
                    {kategorije.map((kat) => (
                      <option key={kat.id || kat.kategorija} value={kat.kategorija}>
                        {kat.kategorija}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>
                    <i className="fas fa-ruler"></i>
                    Preset Veličina
                  </label>
                  <select
                    value={step1Data.preset}
                    onChange={(e) => setStep1Data({ ...step1Data, preset: e.target.value })}
                  >
                    {Object.entries(PRESET_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.presetPreview}>
                  <strong><i className="fas fa-ruler"></i> Dostupne veličine:</strong>
                  <div className={styles.sizeList}>
                    {getSizes().map(size => (
                      <span key={size} className={styles.sizeTag}>{size}</span>
                    ))}
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.modalBtn + ' ' + styles.secondary} onClick={handleCloseModal}>
                    <i className="fas fa-times"></i>
                    Otkaži
                  </button>
                  <button className={styles.modalBtn + ' ' + styles.primary} onClick={handleStep1Submit}>
                    <i className="fas fa-arrow-right"></i>
                    Dalje
                  </button>
                </div>
              </div>
            )}

            {/* === STEP 2: BOJE I VARIJANTE === */}
            {modalStep === 2 && (
              <div className={styles.modalBody}>
                <div className={styles.stepIndicator}>
                  <div className={styles.step}>1</div>
                  <div className={styles.stepLine}></div>
                  <div className={styles.step + ' ' + styles.active}>2</div>
                  <div className={styles.stepLine}></div>
                  <div className={styles.step}>3</div>
                </div>

                <div className={styles.colorFormSection}>
                  <h3><i className="fas fa-plus"></i> Dodaj Novu Boju</h3>

                  <div className={styles.formGroup}>
                    <label>
                      <i className="fas fa-palette"></i>
                      Odaberi Boju
                    </label>
                    <div className={styles.colorPickerGrid}>
                      {Object.entries(COLORS).map(([colorName, colorHex]) => {
                        const isSelected = currentColorForm.boja === colorName;
                        const isAdded = colorVariants[colorName] && colorName !== editingColorName;
                        return (
                          <button
                            key={colorName}
                            className={`${styles.colorPickerItem} ${isSelected ? styles.selected : ''} ${isAdded ? styles.disabled : ''}`}
                            onClick={() => !isAdded && setCurrentColorForm({ ...currentColorForm, boja: colorName })}
                            type="button"
                            disabled={isAdded}
                            title={isAdded ? 'Već je dodana' : ''}
                          >
                            <div className={styles.colorCircle} style={{ backgroundColor: colorHex }}></div>
                            <span className={styles.colorLabel}>{colorName}</span>
                            {isAdded && <i className="fas fa-check"></i>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <i className="fas fa-images"></i>
                      Slike
                    </label>
                    <div className={styles.imagesContainer}>
                      {currentColorForm.slike.length > 0 && (
                        <div className={styles.imagesList}>
                          {currentColorForm.slike.map((slika, idx) => (
                            <div key={idx} className={styles.imageItem}>
                              {typeof slika === 'string' ? (
                                // Slika iz backenda - samo filename
                                <img 
                                  src={`${API_BASE}/api/proizvodi/slike/${slika}`} 
                                  alt={slika} 
                                  className={styles.imagePreview}
                                  onError={(e) => e.target.style.display = 'none'}
                                />
                              ) : (
                                // Nova slika sa base64
                                <img 
                                  src={slika.base64} 
                                  alt={slika.name} 
                                  className={styles.imagePreview}
                                />
                              )}
                              <span className={styles.imageName}>
                                {typeof slika === 'string' ? slika : slika.name}
                              </span>
                              <button
                                className={styles.removeBtn}
                                onClick={() => handleRemoveSlika(idx)}
                                type="button"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className={styles.addImageBtn}>
                        <i className="fas fa-plus"></i>
                        Dodaj Slike
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className={styles.sizesStanjeSection}>
                    <label>
                      <i className="fas fa-ruler"></i>
                      Odaberi Veličine i Stanje
                    </label>
                    
                    <div className={styles.sizeGridPicker}>
                      {getSizes().map(size => {
                        const isAdded = currentColorForm.selectedSizes.some(s => s.velicina === size);
                        return (
                          <button
                            key={size}
                            className={`${styles.sizePickerItem} ${isAdded ? styles.added : ''}`}
                            onClick={() => {
                              if (!isAdded) {
                                setCurrentColorForm({
                                  ...currentColorForm,
                                  selectedSizes: [
                                    ...currentColorForm.selectedSizes,
                                    { velicina: size, stanje: '1' },
                                  ],
                                });
                              }
                            }}
                            type="button"
                            disabled={isAdded}
                            title={isAdded ? 'Već je dodana' : 'Klikni da dodaš'}
                          >
                            {size}
                            {isAdded && <i className="fas fa-check"></i>}
                          </button>
                        );
                      })}
                    </div>

                    {currentColorForm.selectedSizes.length > 0 && (
                      <div className={styles.selectedSizesList}>
                        {currentColorForm.selectedSizes.map(sizeObj => (
                          <div key={sizeObj.velicina} className={styles.selectedSizeItem}>
                            <span className={styles.sizeLabel}>{sizeObj.velicina}</span>
                            <div className={styles.stanjInputWrapper}>
                              <button
                                className={styles.stanjMinusBtn}
                                onClick={() => {
                                  const currentVal = parseInt(sizeObj.stanje) || 0;
                                  if (currentVal > 0) {
                                    handleUpdateSizeStanje(sizeObj.velicina, (currentVal - 1).toString());
                                  }
                                }}
                                type="button"
                                title="Smanji stanje"
                              >
                                <i className="fas fa-minus"></i>
                              </button>
                              <input
                                type="number"
                                min="0"
                                placeholder="Stanje"
                                value={sizeObj.stanje}
                                onChange={(e) => handleUpdateSizeStanje(sizeObj.velicina, e.target.value)}
                                style={{ width: '80px' }}
                              />
                              <button
                                className={styles.stanjPlusBtn}
                                onClick={() => {
                                  const currentVal = parseInt(sizeObj.stanje) || 0;
                                  handleUpdateSizeStanje(sizeObj.velicina, (currentVal + 1).toString());
                                }}
                                type="button"
                                title="Povećaj stanje"
                              >
                                <i className="fas fa-plus"></i>
                              </button>
                              <button
                                className={styles.removeSizeBtn}
                                onClick={() => handleRemoveSize(sizeObj.velicina)}
                                type="button"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    className={styles.addColorBtn + (editingColorName ? ' ' + styles.editing : '')}
                    onClick={handleAddColor}
                    type="button"
                  >
                    <i className={`fas fa-${editingColorName ? 'save' : 'check'}`}></i>
                    {editingColorName ? `Ažuriraj Boju` : `Dodaj Boju`} ({currentColorForm.selectedSizes.length} varijanti)
                  </button>
                </div>

                {Object.keys(colorVariants).length > 0 && (
                  <div className={styles.addedColorsSection}>
                    <h3><i className="fas fa-check-circle"></i> Dodate Boje ({Object.keys(colorVariants).length})</h3>
                    <div className={styles.colorsList}>
                      {Object.keys(colorVariants).map((boja) => (
                        <span
                          key={boja}
                          className={styles.colorTag + (editingColorName === boja ? ' ' + styles.editing : '')}
                          onClick={() => handleEditColor(boja)}
                          title="Klikni da urediš"
                        >
                          {boja}
                          {editingColorName === boja && <i className="fas fa-edit"></i>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className={styles.modalActions}>
                  {editingColorName && (
                    <>
                      <button
                        className={styles.modalBtn + ' ' + styles.danger}
                        onClick={() => handleDeleteColor(editingColorName)}
                      >
                        <i className="fas fa-trash"></i>
                        Obriši
                      </button>
                      <button
                        className={styles.modalBtn + ' ' + styles.secondary}
                        onClick={handleCancelEdit}
                      >
                        <i className="fas fa-times"></i>
                        Otkaži
                      </button>
                    </>
                  )}
                  {!editingColorName && (
                    <>
                      <button className={styles.modalBtn + ' ' + styles.secondary} onClick={() => setModalStep(1)}>
                        <i className="fas fa-arrow-left"></i>
                        Nazad
                      </button>
                      <button
                        className={styles.modalBtn + ' ' + styles.primary}
                        onClick={handleProceedFromStep2}
                        disabled={Object.keys(colorVariants).length === 0}
                      >
                        <i className="fas fa-arrow-right"></i>
                        Pregled
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* === STEP 3: PREGLED === */}
            {modalStep === 3 && (
              <div className={styles.modalBody}>
                <div className={styles.stepIndicator}>
                  <div className={styles.step}>1</div>
                  <div className={styles.stepLine}></div>
                  <div className={styles.step}>2</div>
                  <div className={styles.stepLine}></div>
                  <div className={styles.step + ' ' + styles.active}>3</div>
                </div>

                <div className={styles.previewSection}>
                  <div className={styles.productInfo}>
                    <h3><i className="fas fa-box"></i> {step1Data.ime}</h3>
                    <p>{step1Data.opis}</p>
                    <p>
                      <i className="fas fa-tag"></i>
                      <strong> Cena:</strong> {parseFloat(step1Data.cena).toFixed(2)} KM
                    </p>
                    <p>
                      <i className="fas fa-percent"></i>
                      <strong> Popust:</strong> {step1Data.popust}%
                    </p>
                    <p>
                      <i className="fas fa-folder"></i>
                      <strong> Kategorija:</strong> {step1Data.kategorija}
                    </p>
                  </div>

                  <div className={styles.variantsPreview}>
                    <h4>Odaberite boju za prikaz kupcima</h4>
                    
                    {/* Uniqne boje sa zvezdama */}
                    <div className={styles.bojasSummary}>
                      {Object.keys(colorVariants).map((boja) => {
                        const bojaVariants = variants.filter(v => v.boja === boja);
                        const bojaStanje = bojaVariants.reduce((sum, v) => sum + parseInt(v.stanje), 0);
                        const isFavorite = favoriteBoja === boja;

                        return (
                          <div
                            key={boja}
                            className={styles.bojaSummaryItem}
                            onClick={(e) => {
                              e.preventDefault();
                              setFavoriteBoja(boja);
                              toast.info(`Boja "${boja}" je sada prikazna prvo kupcima!`);
                            }}
                          >
                            <span className={styles.bojaBadge}>{boja}</span>
                            <span className={styles.bojaStanje}>{bojaStanje} kom</span>
                            <button
                              className={styles.favoriteStar + (isFavorite ? ' ' + styles.favoriteActive : '')}
                              onClick={(e) => {
                                e.stopPropagation();
                                setFavoriteBoja(isFavorite ? null : boja);
                                if (!isFavorite) {
                                  toast.info(`Boja "${boja}" je sada prikazna prvo kupcima!`);
                                } else {
                                  toast.info(`Boja "${boja}" više nije favorite`);
                                }
                              }}
                              title={isFavorite ? 'Klikni da uklonoš kao favorite' : 'Klikni da učiniš favorite'}
                              type="button"
                            >
                              <i className={isFavorite ? `fas fa-star` : `far fa-star`}></i>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Ukupno stanje */}
                    <div className={styles.totalStanjeBox}>
                      <strong><i className="fas fa-box"></i> Ukupno Stanje:</strong>
                      <span className={styles.totalStanje}>
                        {variants.reduce((sum, v) => sum + parseInt(v.stanje), 0)} kom
                      </span>
                    </div>

                    <h4>Varijante ({variants.length})</h4>
                    <div className={styles.variantsList}>
                      {variants.map((variant, idx) => (
                        <div key={idx} className={styles.variantItem}>
                          <div className={styles.variantInfo}>
                            <span className={styles.variantBoja}>{variant.boja}</span>
                            <span className={styles.variantSize}>Veličina: {variant.velicina}</span>
                            <span className={styles.variantStanje}>Stanje: {variant.stanje}</span>
                            <span className={styles.variantSlike}>Slika: {variant.slike.length}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button className={styles.modalBtn + ' ' + styles.secondary} onClick={() => setModalStep(2)}>
                    <i className="fas fa-arrow-left"></i>
                    Nazad
                  </button>
                  <button
                    className={styles.modalBtn + ' ' + styles.primary}
                    onClick={handleSubmitVarijante}
                  >
                    <i className={`fas fa-${isEditingMode ? 'save' : 'check'}`}></i>
                    {isEditingMode ? 'Ažuriraj Proizvod' : 'Dodaj Proizvod'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Edit Modal */}
      {quickEditOpen && quickEditItem && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleCancelQuickEdit}
        >
          <div 
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '340px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              zIndex: 1001,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>Izmeni Stanje</h3>
            <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '13px' }}>
              <strong>Šifra:</strong> {quickEditItem.code_base}-{quickEditItem.code_variant}
            </p>
            <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
              {quickEditItem.ime} - {quickEditItem.boja} ({quickEditItem.velicina})
            </p>

            {/* Plus Minus Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              margin: '28px 0',
              alignItems: 'center',
            }}>
              <button 
                onClick={() => setQuickEditStanje(Math.max(0, quickEditStanje - 1))}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: '#dc3545',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                <i className="fas fa-minus"></i>
              </button>
              <input 
                type="number" 
                value={quickEditStanje} 
                onChange={(e) => setQuickEditStanje(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  width: '90px',
                  padding: '12px',
                  fontSize: '18px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              />
              <button 
                onClick={() => setQuickEditStanje(quickEditStanje + 1)}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: '#28a745',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              marginTop: '28px',
            }}>
              <button 
                onClick={handleConfirmQuickEdit}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: '#007bff',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  flex: 1,
                }}
              >
                Potvrdi
              </button>
              <button 
                onClick={handleCancelQuickEdit}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: '#6c757d',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  flex: 1,
                }}
              >
                Otkaži
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && deleteConfirmItem && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleCancelDelete}
        >
          <div 
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '360px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              zIndex: 1001,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '20px' }}>
              <i 
                className="fas fa-exclamation-triangle" 
                style={{ fontSize: '48px', color: '#dc3545', marginBottom: '12px' }}
              ></i>
            </div>
            
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px', color: '#333' }}>
              Potvrdi brisanje
            </h3>
            
            {isGrouped ? (
              <>
                <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '13px' }}>
                  <strong>Code Base:</strong> {deleteConfirmItem.code_base}
                </p>
                <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
                  {deleteConfirmItem.ime}
                </p>
                <p style={{ margin: '0 0 24px 0', color: '#dc3545', fontSize: '13px', fontWeight: 'bold' }}>
                  Obrisaće se SVE varijante za ovaj proizvod!<br />
                  Ova akcija se ne može povratiti!
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '13px' }}>
                  <strong>Kod:</strong> {deleteConfirmItem.code_base}-{deleteConfirmItem.code_variant}
                </p>
                <p style={{ margin: '0 0 24px 0', color: '#666', fontSize: '14px' }}>
                  {deleteConfirmItem.ime} - {deleteConfirmItem.boja} ({deleteConfirmItem.velicina})
                </p>
                <p style={{ margin: '0 0 24px 0', color: '#dc3545', fontSize: '13px', fontWeight: 'bold' }}>
                  Ova akcija se ne može povratiti!
                </p>
              </>
            )}

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
            }}>
              <button 
                onClick={handleConfirmDelete}
                style={{
                  padding: '12px 28px',
                  border: 'none',
                  background: '#dc3545',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  flex: 1,
                }}
              >
                <i className="fas fa-trash"></i> Obriši
              </button>
              <button 
                onClick={handleCancelDelete}
                style={{
                  padding: '12px 28px',
                  border: 'none',
                  background: '#6c757d',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  flex: 1,
                }}
              >
                <i className="fas fa-times"></i> Otkaži
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recommended Products Modal */}
      {showRecommendedModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            overflow: 'auto',
          }}
          onClick={() => setShowRecommendedModal(false)}
        >
          <div 
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '900px',
              width: '95%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              zIndex: 1001,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
                <i className="fas fa-star"></i> Preporučeni Proizvodi
              </h2>
              <button 
                onClick={() => setShowRecommendedModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                }}
              >
                ✕
              </button>
            </div>

            {recommendedLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#0099cc' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px' }}></i>
                <p style={{ marginTop: '12px' }}>Učitavanje...</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left Column - Recommended Products */}
                <div style={{
                  border: '2px solid rgba(0, 153, 204, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: 'rgba(0, 153, 204, 0.03)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, color: '#333' }}>
                      Trenutni Preporučeni
                    </h3>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      backgroundColor: preporuceni.length >= 12 ? '#dc3545' : '#0099cc',
                      color: 'white',
                    }}>
                      {preporuceni.length}/12
                    </span>
                  </div>
                  
                  {preporuceni.length >= 12 && (
                    <div style={{
                      padding: '12px',
                      marginBottom: '12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                    }}>
                      ⚠️ Maksimalno 12 proizvoda! Obriši jedan da dodaš novi.
                    </div>
                  )}

                  {preporuceni.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                      <i className="fas fa-inbox" style={{ fontSize: '32px', marginBottom: '12px' }}></i>
                      <p>Nema preporučenih proizvoda</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                      {preporuceni.map((item, index) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                              {item.redosled}. {item.ime}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                              {item.code_base}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleMoveUp(item.redosled)}
                              disabled={item.redosled <= 1}
                              style={{
                                padding: '8px 12px',
                                background: item.redosled <= 1 ? '#ccc' : '#0099cc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: item.redosled <= 1 ? 'not-allowed' : 'pointer',
                              }}
                            >
                              <i className="fas fa-arrow-up"></i>
                            </button>
                            <button
                              onClick={() => handleMoveDown(item.redosled, preporuceni.length)}
                              disabled={item.redosled >= preporuceni.length}
                              style={{
                                padding: '8px 12px',
                                background: item.redosled >= preporuceni.length ? '#ccc' : '#0099cc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: item.redosled >= preporuceni.length ? 'not-allowed' : 'pointer',
                              }}
                            >
                              <i className="fas fa-arrow-down"></i>
                            </button>
                            <button
                              onClick={() => handleRemoveRecommended(item.code_base)}
                              style={{
                                padding: '8px 12px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column - Available Products */}
                <div style={{
                  border: '2px solid rgba(100, 200, 100, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: preporuceni.length >= 12 ? 'rgba(150, 150, 150, 0.05)' : 'rgba(100, 200, 100, 0.03)',
                }}>
                  <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
                    Dostupni Proizvodi
                  </h3>
                  
                  {preporuceni.length >= 12 && (
                    <div style={{
                      padding: '12px',
                      marginBottom: '12px',
                      backgroundColor: '#f8d7da',
                      color: '#721c24',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      border: '1px solid #f5c6cb',
                    }}>
                      🔒 Maksimalno dostignut limit. Obriši proizvod sa lijeve strane da dodaš novi.
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Pretraži proizvode..."
                    value={searchRecommendedInput}
                    onChange={(e) => setSearchRecommendedInput(e.target.value)}
                    disabled={preporuceni.length >= 12}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: '12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      opacity: preporuceni.length >= 12 ? 0.6 : 1,
                      cursor: preporuceni.length >= 12 ? 'not-allowed' : 'text',
                    }}
                  />
                  {availableProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                      <i className="fas fa-check-circle" style={{ fontSize: '32px', marginBottom: '12px', color: '#28a745' }}></i>
                      <p>Svi proizvodi su preporučeni! 🎉</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                      {availableProducts.map((item) => (
                        <div
                          key={item.code_base}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                              {item.ime}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                              {item.code_base} • {item.cena} KM
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddRecommended(item.code_base)}
                            disabled={preporuceni.length >= 12}
                            style={{
                              padding: '8px 16px',
                              background: preporuceni.length >= 12 ? '#ccc' : '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: preporuceni.length >= 12 ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold',
                            }}
                          >
                            <i className="fas fa-plus"></i> Dodaj
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={() => setShowRecommendedModal(false)}
                style={{
                  padding: '12px 32px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                Zatvori
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showImageModal && selectedProizvodForImages && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowImageModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: '1000px',
              zIndex: 2001,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0, 0, 0, 0.5)',
                border: 'none',
                color: 'white',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2002,
              }}
            >
              <i className="fas fa-times"></i>
            </button>

            {/* Main Image */}
            <div
              style={{
                position: 'relative',
                backgroundColor: '#f0f0f0',
                height: '550px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flex: 1,
              }}
            >
              {selectedProizvodForImages.slike && selectedProizvodForImages.slike.length > 0 ? (
                <>
                  <img
                    src={`${API_BASE}/api/proizvodi/slike/${selectedProizvodForImages.slike[selectedImageIndex]}`}
                    alt={`Slika ${selectedImageIndex + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="%23999"%3ENema slike%3C/text%3E%3C/svg%3E';
                    }}
                  />

                  {/* Navigation Arrows */}
                  {selectedProizvodForImages.slike.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === 0 ? selectedProizvodForImages.slike.length - 1 : prev - 1
                          )
                        }
                        style={{
                          position: 'absolute',
                          left: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: 'none',
                          color: 'white',
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2002,
                        }}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev === selectedProizvodForImages.slike.length - 1 ? 0 : prev + 1
                          )
                        }
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: 'none',
                          color: 'white',
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 2002,
                        }}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div style={{ color: '#999', fontSize: '16px' }}>
                  <i className="fas fa-image" style={{ fontSize: '48px', marginBottom: '12px' }}></i>
                  <p>Nema dostupnih slika</p>
                </div>
              )}
            </div>

            {/* Thumbnails Carousel */}
            {selectedProizvodForImages.slike && selectedProizvodForImages.slike.length > 1 && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#f9f9f9',
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflowX: 'auto',
                }}
              >
                <button
                  onClick={() => setImageThumbScrollPos(Math.max(0, imageThumbScrollPos - 100))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '16px',
                    padding: '8px',
                  }}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    flex: 1,
                    maxWidth: '400px',
                  }}
                >
                  {selectedProizvodForImages.slike.map((slika, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      style={{
                        border: selectedImageIndex === index ? '3px solid #007bff' : '2px solid #ddd',
                        borderRadius: '6px',
                        padding: '2px',
                        cursor: 'pointer',
                        minWidth: '60px',
                        maxWidth: '60px',
                        height: '60px',
                        background: 'none',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={`${API_BASE}/api/proizvodi/slike/${slika}`}
                        alt={`Thumbnail ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setImageThumbScrollPos(imageThumbScrollPos + 100)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '16px',
                    padding: '8px',
                  }}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}

            {/* Info Footer */}
            <div
              style={{
                padding: '16px',
                backgroundColor: '#f0f0f0',
                borderTop: '1px solid #eee',
                textAlign: 'center',
                fontSize: '14px',
                color: '#666',
              }}
            >
              <strong>{selectedProizvodForImages.ime}</strong> - {selectedProizvodForImages.boja}
              {selectedProizvodForImages.slike && selectedProizvodForImages.slike.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  Slika {selectedImageIndex + 1} od {selectedProizvodForImages.slike.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

