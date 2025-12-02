import React, { useState, useEffect } from "react";
import "./Panel.css";
import { FaBars, FaUser, FaHome, FaChartBar, FaClipboardList, FaSignOutAlt, FaSpinner, FaCalendarAlt, FaPoll, FaRobot, FaPencilAlt, FaLink } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

function Panel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anketler, setAnketler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 15;
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/giris");
  };

  const handleAnketOlustur = () => {
    navigate("/anket-olustur");
  };

  const handleProfil = () => {
    navigate("/profil");
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

  // Arama ve sayfalama
  const filteredAnketler = anketler.filter(anket =>
    anket.anketBaslik?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anket.anketAciklama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAnketler.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAnketler = filteredAnketler.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="panel-container">
      {/* Üst Navbar */}
      <nav className="panel-navbar">
        <div className="nav-left">
          <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
          <span className="panel-logo">AnketApp</span>
        </div>

        <div className="nav-right">
          <Link to="/panel" className="nav-link"><FaHome /> Ana Sayfa</Link>
          <button className="btn-white" onClick={handleAnketOlustur}>
            Anket Oluştur
          </button>
        </div>
      </nav>

      {/* Sol Menü (Sidebar) */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">📊 AnketApp</div>
          <div className="sidebar-subtitle">Anket Yönetim Sistemi</div>
        </div>
        <ul>
          <li onClick={handleProfil}>
            <FaUser className="icon" /> Profil
          </li>
          <li onClick={handleAnketOlustur}>
            <FaClipboardList className="icon" /> Anket Oluştur
          </li>
          <li><FaChartBar className="icon" /> Sonuçları Gör</li>
          <li onClick={handleLogout}>
            <FaSignOutAlt className="icon" /> Çıkış Yap
          </li>
        </ul>
      </div>

      {/* Overlay - menü açıkken tıklanınca kapatmak için */}
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu}></div>}

      {/* Ana İçerik */}
      <main className="panel-main" onClick={handleMainClick}>
        <div className="panel-header">
          <div className="header-left">
            <h1>📋 Anketlerim</h1>
            <p>Toplam {anketler.length} anket</p>
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
                    <div className="col col-questions">Sorular</div>
                    <div className="col col-responses">Cevaplar</div>
                    <div className="col col-status">Durum</div>
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
                              {anket.aiIleOlusturuldu && (
                                <span className="ai-badge-small">
                                  <FaRobot /> AI
                                </span>
                              )}
                            </div>
                            {anket.anketAciklama && (
                              <div className="title-desc">{anket.anketAciklama}</div>
                            )}
                          </div>
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
                          <span className={`status-badge ${getDurumBadge(anket.durum).class}`}>
                            {getDurumBadge(anket.durum).text}
                          </span>
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

      <style>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 20px;
        }

        .loading-container p {
          color: var(--text-muted);
          font-size: 1.1em;
          font-weight: 600;
        }

        .fa-spin {
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          max-width: 500px;
          margin: 0 auto;
        }

        .empty-icon {
          font-size: 5em;
          margin-bottom: 20px;
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .empty-state h2 {
          color: var(--text-main);
          font-size: 1.8em;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: var(--text-muted);
          font-size: 1.1em;
          margin-bottom: 30px;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-left h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .header-left p {
          margin: 5px 0 0 0;
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .search-box {
          position: relative;
        }

        .search-box input {
          padding: 12px 20px;
          border: 2px solid rgba(0, 220, 130, 0.2);
          border-radius: 25px;
          font-size: 0.95rem;
          width: 300px;
          outline: none;
          transition: all 0.3s;
          background: white;
        }

        .search-box input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(0, 220, 130, 0.1);
        }

        .data-grid {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.05);
        }

        .grid-header {
          display: grid;
          grid-template-columns: 2.5fr 0.8fr 0.8fr 0.8fr 1fr 1fr;
          gap: 15px;
          padding: 20px 25px;
          background: linear-gradient(135deg, #00dc82 0%, #00b86c 100%);
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .grid-body {
         /* max-height: calc(100vh - 350px); KAPAT */
    /* overflow-y: auto; KAPAT */
    overflow-y: visible;
        }

        .grid-row {
          display: grid;
          grid-template-columns: 2.5fr 0.8fr 0.8fr 0.8fr 1fr 1fr;
          gap: 15px;
          padding: 20px 25px;
          border-bottom: 1px solid rgba(0, 220, 130, 0.1);
          transition: all 0.3s;
          animation: slideIn 0.4s ease-out backwards;
          animation-delay: calc(var(--row-index) * 0.05s);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .grid-row:hover {
          background: linear-gradient(90deg, rgba(0, 220, 130, 0.05) 0%, transparent 100%);
          transform: translateX(5px);
        }

        .col {
          display: flex;
          align-items: center;
        }

        .col-title {
          flex-direction: column;
          align-items: flex-start;
          gap: 5px;
        }

        .title-content {
          width: 100%;
        }

        .title-main {
          font-weight: 700;
          font-size: 1rem;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .title-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-top: 5px;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .ai-badge-small {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
        }

        .stat-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--primary-light);
          border-radius: 20px;
          font-weight: 700;
          color: var(--text-main);
          font-size: 1rem;
        }

        .badge-icon {
          color: var(--primary);
          font-size: 1.1rem;
        }

        .status-badge {
          padding: 8px 18px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          display: inline-block;
        }

        .status-badge.active {
          background: linear-gradient(135deg, #d4f4e4, #b8f0d7);
          color: #047857;
          border: 2px solid #34d399;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
        }

        .status-badge.completed {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #991b1b;
          border: 2px solid #f87171;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
        }

        .status-badge.draft {
          background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
          color: #3730a3;
          border: 2px solid #a5b4fc;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2);
        }

        .date-content {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .date-icon-small {
          color: var(--primary);
          font-size: 0.95rem;
        }

        .btn-view {
          padding: 10px 20px;
          background: linear-gradient(135deg, #00dc82 0%, #00b86c 100%);
          color: white;
          border: none;
          border-radius: 25px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 15px rgba(0, 220, 130, 0.3);
        }

        .btn-view:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 220, 130, 0.4);
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin: 30px 0 20px 0;
        }

        .page-btn {
          padding: 10px 20px;
          background: white;
          border: 2px solid var(--primary);
          color: var(--primary);
          border-radius: 25px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .page-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
          transform: translateY(-2px);
        }

        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: 8px;
        }

        .page-num {
          width: 40px;
          height: 40px;
          border: 2px solid rgba(0, 220, 130, 0.3);
          background: white;
          color: var(--text-main);
          border-radius: 50%;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .page-num:hover {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .page-num.active {
          background: linear-gradient(135deg, #00dc82 0%, #00b86c 100%);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 15px rgba(0, 220, 130, 0.3);
        }

        .page-dots {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          font-weight: 700;
        }

        .showing-info {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 10px;
        }

        .no-results {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        @media (max-width: 1200px) {
          .grid-header,
          .grid-row {
            grid-template-columns: 2fr 0.7fr 0.7fr 0.8fr 0.9fr 0.9fr;
            gap: 10px;
            padding: 15px 20px;
          }

          .search-box input {
            width: 250px;
          }
        }

        @media (max-width: 768px) {
          .grid-header {
            display: none;
          }

          .grid-row {
            grid-template-columns: 1fr;
            gap: 15px;
            padding: 20px;
            border: 1px solid rgba(0, 220, 130, 0.2);
            border-radius: 12px;
            margin-bottom: 15px;
          }

          .grid-body {
            max-height: none;
            padding: 0 10px;
          }

          .col {
            justify-content: space-between;
          }

          .col::before {
            content: attr(data-label);
            font-weight: 700;
            color: var(--primary);
            font-size: 0.85rem;
          }

          .col-title {
            flex-direction: column;
            align-items: flex-start;
          }

          .col-title::before {
            content: none;
          }

          .search-box input {
            width: 100%;
          }

          .page-numbers {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}

export default Panel;