'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './nalog.module.css';

const API_BASE = 'https://butikirna.com';

export default function NalogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Osnovni podaci
  const [userData, setUserData] = useState({
    ime: '',
    prezime: '',
    email: '',
    id: null,
  });

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ ...userData });

  // Promena šifre
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      fetchUserData();
    }
  }, [isMounted]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
      setUserData({
        id: data.user.id,
        ime: data.user.ime || '',
        prezime: data.user.prezime || '',
        email: data.user.email || '',
      });
      setEditData({
        id: data.user.id,
        ime: data.user.ime || '',
        prezime: data.user.prezime || '',
        email: data.user.email || '',
      });
    } catch (err) {
      console.error('Greška pri učitavanju korisnika:', err);
      toast.error('⚠️ Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleSaveChanges = async () => {
    // Validacija
    if (!editData.ime.trim()) {
      toast.error('⚠️ Ime je obavezno');
      return;
    }
    if (!editData.prezime.trim()) {
      toast.error('⚠️ Prezime je obavezno');
      return;
    }
    if (!editData.email.trim()) {
      toast.error('⚠️ Email je obavezan');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      toast.error('⚠️ Email nije validan');
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem('access_token');
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
        }),
      });

      if (!response.ok) {
        throw new Error('Greška pri ažuriranju podataka');
      }

      setUserData(editData);
      setEditMode(false);
      toast.success('✅ Podaci su uspešno ažurirani');
    } catch (err) {
      console.error('Greška pri ažuriranju korisnika:', err);
      toast.error('⚠️ Greška pri ažuriranju podataka');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validacija
    if (!passwordData.oldPassword) {
      toast.error('⚠️ Unesite trenutnu šifru');
      return;
    }
    if (!passwordData.newPassword) {
      toast.error('⚠️ Unesite novu šifru');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('⚠️ Nova šifra mora imati najmanje 6 karaktera');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('⚠️ Šifre se ne poklapaju');
      return;
    }

    try {
      setIsChangingPassword(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE}/api/auth/lozinka`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_pwd: passwordData.oldPassword,
          new_pwd: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Greška pri promeni šifre');
      }

      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassword({ oldPassword: false, newPassword: false, confirmPassword: false });
      setChangePasswordOpen(false);
      toast.success('✅ Šifra je uspešno promenjena');
    } catch (err) {
      console.error('Greška pri promeni šifre:', err);
      toast.error(`⚠️ ${err.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ToastContainer />

      <div className={styles.header}>
        <div className={styles.userAvatar}>
          {userData.ime.charAt(0)}{userData.prezime.charAt(0)}
        </div>
        <h1>
          <i className="fas fa-user"></i>
          Moj Nalog
        </h1>
        <p className={styles.fullName}>{userData.ime} {userData.prezime}</p>
        <p>{userData.email}</p>
      </div>

      <div className={styles.content}>
        {/* Osnovni podaci */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>
              <i className="fas fa-id-card"></i>
              Osnovni Podaci
            </h2>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className={styles.editBtn}
              >
                <i className="fas fa-edit"></i>
                Uredi
              </button>
            )}
          </div>

          {editMode ? (
            <div className={styles.formGroup}>
              <div className={styles.inputRow}>
                <div className={styles.inputField}>
                  <label>Ime</label>
                  <input
                    type="text"
                    value={editData.ime}
                    onChange={(e) => handleEditChange('ime', e.target.value)}
                    placeholder="Unesite ime"
                  />
                </div>
                <div className={styles.inputField}>
                  <label>Prezime</label>
                  <input
                    type="text"
                    value={editData.prezime}
                    onChange={(e) => handleEditChange('prezime', e.target.value)}
                    placeholder="Unesite prezime"
                  />
                </div>
              </div>

              <div className={styles.inputField}>
                <label>Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                  placeholder="Unesite email"
                />
              </div>

              <div className={styles.buttonGroup}>
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className={styles.saveBtn}
                >
                  <i className="fas fa-check"></i>
                  {isSaving ? 'Čuvanje...' : 'Sačuvaj Promene'}
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditData(userData);
                  }}
                  className={styles.cancelBtn}
                >
                  <i className="fas fa-times"></i>
                  Otkaži
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.dataDisplay}>
              <div className={styles.dataRow}>
                <span className={styles.label}>Ime:</span>
                <span className={styles.value}>{userData.ime}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.label}>Prezime:</span>
                <span className={styles.value}>{userData.prezime}</span>
              </div>
              <div className={styles.dataRow}>
                <span className={styles.label}>Email:</span>
                <span className={styles.value}>{userData.email}</span>
              </div>
            </div>
          )}
        </div>

        {/* Promena šifre */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>
              <i className="fas fa-lock"></i>
              Sigurnost
            </h2>
            {!changePasswordOpen && (
              <button
                onClick={() => setChangePasswordOpen(true)}
                className={styles.editBtn}
              >
                <i className="fas fa-key"></i>
                Promeni Šifru
              </button>
            )}
          </div>

          {changePasswordOpen ? (
            <div className={styles.formGroup}>
              <div className={styles.inputField}>
                <label>Trenutna Šifra</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPassword.oldPassword ? 'text' : 'password'}
                    value={passwordData.oldPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, oldPassword: e.target.value })
                    }
                    placeholder="Unesite trenutnu šifru"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() =>
                      setShowPassword({ ...showPassword, oldPassword: !showPassword.oldPassword })
                    }
                  >
                    <i className={`fas fa-eye${showPassword.oldPassword ? '' : '-slash'}`}></i>
                  </button>
                </div>
              </div>

              <div className={styles.inputField}>
                <label>Nova Šifra</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPassword.newPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    placeholder="Unesite novu šifru (min. 6 karaktera)"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() =>
                      setShowPassword({ ...showPassword, newPassword: !showPassword.newPassword })
                    }
                  >
                    <i className={`fas fa-eye${showPassword.newPassword ? '' : '-slash'}`}></i>
                  </button>
                </div>
              </div>

              <div className={styles.inputField}>
                <label>Potvrdi Novu Šifru</label>
                <div className={styles.passwordInputWrapper}>
                  <input
                    type={showPassword.confirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    placeholder="Potvrdite novu šifru"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() =>
                      setShowPassword({ ...showPassword, confirmPassword: !showPassword.confirmPassword })
                    }
                  >
                    <i className={`fas fa-eye${showPassword.confirmPassword ? '' : '-slash'}`}></i>
                  </button>
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  className={styles.saveBtn}
                >
                  <i className="fas fa-check"></i>
                  {isChangingPassword ? 'Čuvanje...' : 'Promeni Šifru'}
                </button>
                <button
                  onClick={() => {
                    setChangePasswordOpen(false);
                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                    setShowPassword({ oldPassword: false, newPassword: false, confirmPassword: false });
                  }}
                  className={styles.cancelBtn}
                >
                  <i className="fas fa-times"></i>
                  Otkaži
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.dataDisplay}>
              <p style={{ color: '#666', fontSize: '14px', margin: '0' }}>
                <i className="fas fa-shield-alt"></i>
                Klikni na "Promeni Šifru" da promenite vašu lozinku
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
