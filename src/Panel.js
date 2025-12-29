import React, { useState, useEffect, useMemo } from "react";
import "./Panel.css";
import { FaBars, FaUser, FaHome, FaChartBar, FaClipboardList, FaSignOutAlt, FaSpinner, FaCalendarAlt, FaPoll, FaRobot, FaPencilAlt, FaLink, FaFilter, FaUserEdit, FaMoon, FaSun, FaTrashAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

function Panel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anketler, setAnketler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [durumFilter, setDurumFilter] = useState("tumu"); // tumu, aktif, pasif
  const [toastMessage, setToastMessage] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null); // Hangi anket güncelleniyor
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [anketToSil, setAnketToSil] = useState(null);
  const [silmeOnayInput, setSilmeOnayInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const itemsPerPage = 15;
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('hepsi'); // hepsi, aktif, pasif, ai, manuel
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('panelDarkMode');
    return saved === 'true';
  });

  // Dark mode toggle
  useEffect(() => {
    localStorage.setItem('panelDarkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Dinamik istatistikler hesaplama
  const stats = useMemo(() => {
    return {
      toplam: anketler.length,
      aktif: anketler.filter(a => a.durum === 'aktif').length,
      pasif: anketler.filter(a => a.durum === 'pasif').length,
      ai: anketler.filter(a => a.aiIleOlusturuldu === true).length,
      manuel: anketler.filter(a => !a.aiIleOlusturuldu).length
    };
  }, [anketler]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/anasayfa");
  };

  const handleAnketOlustur = () => {
    navigate("/anket-olustur");
  };

  const handleProfil = () => {
    navigate("/profil");
  };

  const handleSonuclariGor = () => {
    navigate("/anket-sonuclari");
  };

  // Menüyü kapatma fonksiyonu
  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Ana içeriğe tıklanınca menüyü kapat
  const handleMainClick = () => {
    if (menuOpen) {
      setMenuOpen(false);
    }
  };

  // MongoDB'den anketleri çek
  useEffect(() => {
    const anketleriGetir = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/giris");
        return;
      }

      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/api/surveys`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const result = await response.json();

        if (result.success) {
          console.log("📊 Anketler geldi:", result.data);
          // Her anketin soru sayısını kontrol et
          result.data.forEach((anket, i) => {
            console.log(`Anket ${i + 1}:`, {
              baslik: anket.anketBaslik,
              soruSayisi: anket.sorular?.length || 0,
              sorular: anket.sorular
            });
          });
          setAnketler(result.data);
        } else {
          console.error("Anketler getirilemedi:", result.error);
        }
      } catch (error) {
        console.error("API Hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    anketleriGetir();
  }, [navigate]);

  // Tarih formatlama
  const formatTarih = (tarih) => {
    const date = new Date(tarih);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Durum badge'i
  const getDurumBadge = (durum) => {
    const durumlar = {
      'aktif': { text: 'Aktif', class: 'active' },
      'pasif': { text: 'Pasif', class: 'completed' },
      'taslak': { text: 'Taslak', class: 'draft' }
    };

    return durumlar[durum] || { text: 'Bilinmiyor', class: 'draft' };
  };

  // Soru sayısını güvenli şekilde al
  const getSoruSayisi = (anket) => {
    // Farklı olası alan isimlerini kontrol et
    if (anket.sorular && Array.isArray(anket.sorular)) {
      return anket.sorular.length;
    }
    if (anket.questions && Array.isArray(anket.questions)) {
      return anket.questions.length;
    }
    return 0;
  };

  // Anket durumunu değiştir (Aktif/Pasif)
  const handleStatusChange = async (anketId, currentDurum) => {
    const yeniDurum = currentDurum === 'aktif' ? 'pasif' : 'aktif';
    const token = localStorage.getItem("token");

    // Optimistic UI update
    setUpdatingStatus(anketId);
    setAnketler(prev => prev.map(anket =>
      anket._id === anketId ? { ...anket, durum: yeniDurum } : anket
    ));

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/surveys/${anketId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ durum: yeniDurum })
      });

      const result = await response.json();

      if (result.success) {
        // Başarı mesajı göster
        setToastMessage({
          type: 'success',
          text: yeniDurum === 'aktif'
            ? '✅ Anket aktif edildi! Link erişime açıldı.'
            : '🔒 Anket pasif edildi! Link erişime kapatıldı.'
        });

        // 3 saniye sonra toast'u kapat
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        // Hata durumunda geri al
        setAnketler(prev => prev.map(anket =>
          anket._id === anketId ? { ...anket, durum: currentDurum } : anket
        ));
        setToastMessage({
          type: 'error',
          text: '❌ Durum güncellenemedi: ' + result.error
        });
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (error) {
      // Hata durumunda geri al
      setAnketler(prev => prev.map(anket =>
        anket._id === anketId ? { ...anket, durum: currentDurum } : anket
      ));
      setToastMessage({
        type: 'error',
        text: '❌ Bağlantı hatası: ' + error.message
      });
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Silme Butonuna Tıklandığında
  const handleDeleteClick = (anket) => {
    setAnketToSil(anket);
    setSilmeOnayInput("");
    setDeleteModalOpen(true);
  };

  // Silme İşlemini Onayla ve Gerçekleştir
  const confirmDelete = async () => {
    if (!anketToSil || silmeOnayInput !== anketToSil.anketBaslik) return;

    setDeleting(true);
    const token = localStorage.getItem("token");

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/surveys/${anketToSil._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json().catch(() => ({ success: false, error: "Sunucudan geçersiz yanıt geldi." }));

      if (response.ok && result.success) {
        // Listeden kaldır
        setAnketler(prev => prev.filter(a => a._id !== anketToSil._id));
        setDeleteModalOpen(false);
        setAnketToSil(null);

        setToastMessage({
          type: 'success',
          text: '🗑️ Anket ve tüm verileri başarıyla silindi.'
        });
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert("Silme hatası: " + (result.error || response.statusText));
      }
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Silme işlemi sırasında bir bağlantı hatası oluştu: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Arama, durum filtresi, tür filtresi ve sayfalama
  const filteredAnketler = anketler.filter(anket => {
    // Arama filtresi
    const aramaUygun = anket.anketBaslik?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      anket.anketAciklama?.toLowerCase().includes(searchTerm.toLowerCase());

    // Durum filtresi (tablodaki select dropdown)
    const durumUygun = durumFilter === 'tumu' || anket.durum === durumFilter;

    // Tür filtresi (stats bar butonları)
    let turUygun = true;
    if (filterType === 'aktif') turUygun = anket.durum === 'aktif';
    else if (filterType === 'pasif') turUygun = anket.durum === 'pasif';
    else if (filterType === 'ai') turUygun = anket.aiIleOlusturuldu === true;
    else if (filterType === 'manuel') turUygun = !anket.aiIleOlusturuldu;

    return aramaUygun && durumUygun && turUygun;
  });

  const totalPages = Math.ceil(filteredAnketler.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAnketler = filteredAnketler.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="panel-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '12px',
            background: toastMessage.type === 'success'
              ? 'linear-gradient(135deg, #00dc82 0%, #00b86c 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.95rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            zIndex: 9999,
            animation: 'slideInRight 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {toastMessage.text}
        </div>
      )}
      {/* Üst Navbar */}
      <nav className="panel-navbar">
        <div className="nav-left">
          <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
          <span className="panel-logo">SurvAI</span>
        </div>

        <div className="nav-right">
          <Link to="/panel" className="nav-link"><FaHome /> Ana Sayfa</Link>
          <Link to="/profil" className="nav-link"><FaUser /> Profil</Link>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Açık Tema' : 'Koyu Tema'}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button className="btn-white" onClick={handleAnketOlustur}>
            Anket Oluştur
          </button>
        </div>
      </nav>

      {/* Sol Menü (Sidebar) */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">📊 SurvAI</div>
          <div className="sidebar-subtitle">Anket Yönetim Sistemi</div>
        </div>
        <ul>
          <li onClick={handleProfil}>
            <FaUser className="icon" /> Profil
          </li>
          <li onClick={handleAnketOlustur}>
            <FaClipboardList className="icon" /> Anket Oluştur
          </li>
          <li onClick={handleSonuclariGor}>
            <FaChartBar className="icon" /> Sonuçları Gör
          </li>
          <li onClick={handleLogout}>
            <FaSignOutAlt className="icon" /> Çıkış Yap
          </li>
        </ul>
      </div>

      {/* Overlay - menü açıkken tıklanınca kapatmak için */}
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu}></div>}

      {/* Ana İçerik */}
      <main className="panel-main" onClick={handleMainClick}>
        {/* Hero Header - Compact */}
        <div className="panel-hero-header">
          <div className="hero-content">
            <div className="hero-title-row">
              <div className="hero-icon-wrapper">
                <FaPoll className="hero-icon" />
              </div>
              <h1 className="hero-title">
                <span className="title-gradient">Anketlerim</span>
              </h1>
            </div>
            <p className="hero-subtitle">
              Tüm anketlerinizi yönetin, düzenleyin ve sonuçlarını takip edin
            </p>
          </div>
          <div className="hero-stats-mini">
            <div className="mini-stat">
              <span className="mini-stat-value">{anketler.length}</span>
              <span className="mini-stat-label">Toplam Anket</span>
            </div>
          </div>
        </div>

        <div className="panel-filter-bar">

          {/* Kompakt İstatistik Badge'leri */}
          <div className="stats-badges">
            <span
              className={`stat-badge ${filterType === 'hepsi' ? 'active' : ''}`}
              onClick={() => { setFilterType('hepsi'); setCurrentPage(1); }}
            >
              <span className="badge-dot all"></span>
              Tümü: <strong>{stats.toplam}</strong>
            </span>
            <span
              className={`stat-badge ${filterType === 'aktif' ? 'active' : ''}`}
              onClick={() => { setFilterType('aktif'); setCurrentPage(1); }}
            >
              <span className="badge-dot success"></span>
              Aktif: <strong>{stats.aktif}</strong>
            </span>
            <span
              className={`stat-badge ${filterType === 'pasif' ? 'active' : ''}`}
              onClick={() => { setFilterType('pasif'); setCurrentPage(1); }}
            >
              <span className="badge-dot muted"></span>
              Pasif: <strong>{stats.pasif}</strong>
            </span>
            <span
              className={`stat-badge ${filterType === 'ai' ? 'active' : ''}`}
              onClick={() => { setFilterType('ai'); setCurrentPage(1); }}
            >
              <span className="badge-dot ai"></span>
              AI: <strong>{stats.ai}</strong>
            </span>
            <span
              className={`stat-badge ${filterType === 'manuel' ? 'active' : ''}`}
              onClick={() => { setFilterType('manuel'); setCurrentPage(1); }}
            >
              <span className="badge-dot human"></span>
              Manuel: <strong>{stats.manuel}</strong>
            </span>
          </div>

          <div className="header-right">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Anket ara..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="loading-container">
            <FaSpinner className="fa-spin" style={{ fontSize: "3em", color: "var(--primary)" }} />
            <p>Anketler yükleniyor...</p>
          </div>
        ) : anketler.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>Henüz Anket Oluşturmadınız</h2>
            <p>İlk anketinizi oluşturmak için yukarıdaki butona tıklayın</p>
            <button className="btn-green" onClick={handleAnketOlustur}>
              ✨ İlk Anketimi Oluştur
            </button>
          </div>
        ) : (
          <>
            {filteredAnketler.length === 0 ? (
              <div className="no-results">
                <p>🔍 Arama sonucu bulunamadı</p>
              </div>
            ) : (
              <>
                <div className="data-grid">
                  <div className="grid-header">
                    <div className="col col-title">Anket Başlığı</div>
                    <div className="col col-type">Tür</div>
                    <div className="col col-questions">Sorular</div>
                    <div className="col col-responses">Cevaplar</div>
                    <div className="col col-status" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Durum
                      <select
                        value={durumFilter}
                        onChange={(e) => {
                          setDurumFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="tumu" style={{ color: '#333' }}>Tümü</option>
                        <option value="aktif" style={{ color: '#333' }}>Aktif</option>
                        <option value="pasif" style={{ color: '#333' }}>Pasif</option>
                      </select>
                    </div>
                    <div className="col col-date">Tarih</div>
                    <div className="col col-actions">İşlemler</div>
                  </div>

                  <div className="grid-body">
                    {currentAnketler.map((anket, index) => (
                      <div
                        key={anket._id}
                        className="grid-row"
                        style={{ '--row-index': index }}
                      >
                        <div className="col col-title">
                          <div className="title-content">
                            <div className="title-main">
                              {anket.anketBaslik}
                            </div>
                            {anket.anketAciklama && (
                              <div className="title-desc">{anket.anketAciklama}</div>
                            )}
                          </div>
                        </div>

                        <div className="col col-type">
                          {anket.aiIleOlusturuldu ? (
                            <span className="type-badge ai">
                              <FaRobot /> AI
                            </span>
                          ) : (
                            <span className="type-badge human">
                              <FaUserEdit /> Manuel
                            </span>
                          )}
                        </div>

                        <div className="col col-questions">
                          <div className="stat-badge">
                            <FaPoll className="badge-icon" />
                            <span>{getSoruSayisi(anket)}</span>
                          </div>
                        </div>

                        <div className="col col-responses">
                          <div className="stat-badge">
                            <FaChartBar className="badge-icon" />
                            <span>{anket.toplamCevapSayisi || 0}</span>
                          </div>
                        </div>

                        <div className="col col-status">
                          <div
                            className="status-toggle"
                            onClick={() => handleStatusChange(anket._id, anket.durum)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              cursor: updatingStatus === anket._id ? 'wait' : 'pointer',
                              opacity: updatingStatus === anket._id ? 0.7 : 1,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {/* Toggle Switch */}
                            <div
                              style={{
                                width: '50px',
                                height: '26px',
                                borderRadius: '13px',
                                background: anket.durum === 'aktif'
                                  ? 'linear-gradient(135deg, #00dc82 0%, #00b86c 100%)'
                                  : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                boxShadow: anket.durum === 'aktif'
                                  ? '0 4px 15px rgba(0, 220, 130, 0.4)'
                                  : '0 4px 15px rgba(100, 116, 139, 0.3)'
                              }}
                            >
                              <div
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  background: 'white',
                                  position: 'absolute',
                                  top: '2px',
                                  left: anket.durum === 'aktif' ? '26px' : '2px',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}
                              />
                            </div>
                            {/* Status Text */}
                            <span
                              style={{
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                color: anket.durum === 'aktif' ? '#047857' : '#64748b',
                                minWidth: '45px'
                              }}
                            >
                              {anket.durum === 'aktif' ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                        </div>

                        <div className="col col-date">
                          <div className="date-content">
                            <FaCalendarAlt className="date-icon-small" />
                            {formatTarih(anket.createdAt)}
                          </div>
                        </div>

                        <div className="col col-actions">
                          <button
                            className="btn-view"
                            onClick={() => navigate(`/anket-detay/${anket._id}`)}
                          >
                            <FaPencilAlt /> Detay
                          </button>
                          {anket.paylasimLinki && (
                            <button
                              className="btn-view"
                              onClick={() => window.open(anket.paylasimLinki, '_blank')}
                              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            >
                              <FaLink /> Link
                            </button>
                          )}
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteClick(anket)}
                            title="Anketi Sil"
                          >
                            <FaTrashAlt /> Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sayfalama */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="page-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      ‹ Önceki
                    </button>

                    <div className="page-numbers">
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        // Sayfa numaralarını akıllıca göster
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              className={`page-num ${currentPage === page ? 'active' : ''}`}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="page-dots">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      className="page-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Sonraki ›
                    </button>
                  </div>
                )}

                <div className="showing-info">
                  {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAnketler.length)} arası gösteriliyor
                  (Toplam: {filteredAnketler.length})
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* RİSKLİ İŞLEM: Silme Onay Modalı */}
      {deleteModalOpen && anketToSil && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-header">
              <div className="warning-icon">⚠️</div>
              <h2>Anketi Sil</h2>
            </div>
            <div className="delete-modal-body">
              <p><strong>"{anketToSil.anketBaslik}"</strong> başlıklı anketi silmek üzeresiniz.</p>
              <p className="danger-text">Bu işlem geri alınamaz. Anketle birlikte tüm sorular, cevaplar ve linkler kalıcı olarak silinecektir.</p>

              <div className="confirmation-input-group">
                <label>Onaylamak için anketin adını aynen yazın:</label>
                <input
                  type="text"
                  placeholder="Anket adını buraya yazın..."
                  value={silmeOnayInput}
                  onChange={(e) => setSilmeOnayInput(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="delete-modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteModalOpen(false)}>Vazgeç</button>
              <button
                className="btn-confirm-delete"
                disabled={silmeOnayInput !== anketToSil.anketBaslik || deleting}
                onClick={confirmDelete}
              >
                {deleting ? 'Siliniyor...' : 'Evet, Tamamen Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Panel;