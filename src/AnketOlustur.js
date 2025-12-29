import React, { useState, useEffect } from "react";
import "./AnketOlustur.css";
import { FaBars, FaUser, FaChartBar, FaClipboardList, FaSignOutAlt, FaHome, FaMoon, FaSun, FaPlus, FaRobot, FaCopy, FaPaste } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function AnketOlustur() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [titleText, setTitleText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('panelDarkMode');
    return saved === 'true';
  });

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('panelDarkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const fullTitle = "Nasıl bir anket oluşturmak istiyorsunuz?";

  // Yazı animasyonu
  useEffect(() => {
    if (charIndex < fullTitle.length) {
      const timer = setTimeout(() => {
        setTitleText(fullTitle.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 25);
      return () => clearTimeout(timer);
    }
  }, [charIndex, fullTitle]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/giris");
  };

  const handleProfil = () => navigate("/profil");
  const handleSonuclariGor = () => {
    setMenuOpen(false);
    navigate("/anket-sonuclari");
  };
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="ac-container">
      {/* Navbar */}
      <nav className="ac-navbar">
        <div className="nav-left">
          <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
          <span className="panel-logo">SurvAI</span>
        </div>

        <div className="nav-right">
          <button className="nav-link" onClick={() => navigate("/panel")} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <FaHome /> Ana Sayfa
          </button>
          <button className="nav-link" onClick={() => navigate("/profil")} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <FaUser /> Profil
          </button>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Açık Tema' : 'Koyu Tema'}
            style={{ background: 'none', border: '1px solid var(--panel-border)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </nav>

      {/* Sidebar - Harmonized */}
      <div className={`ac-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">📊 SurvAI</div>
          <div className="sidebar-subtitle">Anket Yönetim Sistemi</div>
        </div>
        <ul>
          <li onClick={handleProfil}><FaUser className="icon" /> Profil</li>
          <li className="active"><FaClipboardList className="icon" /> Anket Oluştur</li>
          <li onClick={handleSonuclariGor}><FaChartBar className="icon" /> Sonuçları Gör</li>
          <li onClick={handleLogout}><FaSignOutAlt className="icon" /> Çıkış Yap</li>
        </ul>
      </div>

      {/* Overlay */}
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu}></div>}

      {/* Main Content */}
      <main className="anket-main">
        <h1>
          {titleText}
          <span style={{ animation: 'blink 1s infinite' }}>|</span>
        </h1>

        <div className="option-cards">
          {/* SIFIRDAN ANKET */}
          <div className="option-card standard" onClick={() => navigate("/sifirdan-anket")}>
            <div className="card-icon">
              <FaPlus />
            </div>
            <div className="card-badge new">Popüler</div>
            <h3>Sıfırdan Oluştur</h3>
            <p>Boş bir sayfadan başlayarak kendi sorularınızı ve akışınızı oluşturun.</p>
          </div>

          {/* YAPAY ZEKA */}
          <div className="option-card ai" onClick={() => navigate("/ai-ile-anket")}>
            <div className="card-icon">
              <FaRobot />
            </div>
            <div className="card-badge beta">Yapay Zeka</div>
            <h3>AI ile Oluştur</h3>
            <p>Konuyu söyleyin, yapay zeka sizin için en uygun anket sorularını hazırlasın.</p>
          </div>

          {/* KOPYALA */}
          <div className="option-card copy" onClick={() => navigate("/anket-kopyala")}>
            <div className="card-icon">
              <FaCopy />
            </div>
            <h3>Anketi Kopyala</h3>
            <p>Mevcut bir anketinizi veya şablonu kopyalayarak üzerinde değişiklik yapın.</p>
          </div>

          {/* YAPIŞTIR */}
          <div className="option-card paste" onClick={() => navigate("/sorulari-yapistir")}>
            <div className="card-icon">
              <FaPaste />
            </div>
            <h3>Soruları Yapıştır</h3>
            <p>Elinizdeki soru listesini yapıştırın, otomatik forma dönüştürelim.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnketOlustur;