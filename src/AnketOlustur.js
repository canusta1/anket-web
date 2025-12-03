import React, { useState, useEffect } from "react";
import "./AnketOlustur.css";
import { FaBars, FaUser, FaChartBar, FaClipboardList, FaSignOutAlt, FaSpinner, FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function AnketOlustur() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [titleText, setTitleText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const navigate = useNavigate();

  const fullTitle = "Nasıl bir anket oluşturmak istiyorsunuz?";

  // Yazı animasyonu
  useEffect(() => {
    if (charIndex < fullTitle.length) {
      const timer = setTimeout(() => {
        setTitleText(fullTitle.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [charIndex, fullTitle]);

  const handleLogout = () => navigate("/giris");

  // 1. SIFIRDAN ANKET (Yönlendirme)
  const handleSifirdanAnket = () => {
    navigate("/sifirdan-anket");
  };

  // 2. YAPAY ZEKA (Yönlendirme)
  const handleYapayZeka = () => {
    navigate("/ai-ile-anket");
  };

  // Sifirdan anket yaratma
  const [mode, setMode] = useState("main"); // main, sifirdan, ai

  const handleKopyala = () => {
    navigate('/anket-kopyala');
  };

  // Şablon seçildiğinde düzenleme ekranına yönlendir (state ile)
  const handleTemplateSelect = (template) => {
    // Backend format'ını frontend format'ına çevir
    const convertedTemplate = {
      ...template,
      sorular: (template.sorular || []).map((soru) => ({
        id: Math.random(),
        metin: soru.soruMetni || soru.metin || soru.soru || '',
        tip: soru.soruTipi || soru.tip || 'acik-uclu',
        secenekler: (soru.secenekler || []).map(sec =>
          typeof sec === 'string' ? sec : sec.metin || ''
        ),
        zorunlu: soru.zorunlu !== undefined ? soru.zorunlu : false
      }))
    };

    console.log("✅ Dönüştürülen Template:", convertedTemplate);
    navigate("/sifirdan-anket", { state: { template: convertedTemplate } });
  };

  // 4. YAPISTIR - Geçici fonksiyon
  const handleYapistir = () => {
    alert("Soruları yapıştırma özelliği yakında gelecek!");
  };

  const handleProfil = () => navigate("/profil");
  const handleAnaSayfa = () => navigate("/panel");
  const handleSonuclariGor = () => {
    setMenuOpen(false);
    navigate("/anket-sonuclari");
  };

  // Menüyü kapatma
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="panel-container">
      {/* Navbar */}
      <nav className="panel-navbar">
        <div className="nav-left">
          <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
          <span className="panel-logo">AnketApp</span>
        </div>

        <div className="nav-right">
          <button className="nav-link" onClick={handleAnaSayfa}>
            <FaHome className="nav-icon" /> Ana Sayfa
          </button>
          <button className="btn-white">Anket Oluştur</button>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">📊 AnketApp</div>
          <div className="sidebar-subtitle">Anket Yönetim Sistemi</div>
        </div>
        <ul>
          <li onClick={handleProfil}><FaUser className="icon" /> Profil</li>
          <li><FaClipboardList className="icon" /> Anket Oluştur</li>
          <li onClick={handleSonuclariGor}><FaChartBar className="icon" /> Sonuçları Gör</li>
          <li onClick={handleLogout}><FaSignOutAlt className="icon" /> Çıkış Yap</li>
        </ul>
      </div>

      {/* Overlay */}
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu}></div>}

      {/* İçerik */}
      <main className="anket-main">
        <div className="title-container">
          <h1 className="animated-title">
            {titleText}
            <span className="cursor">|</span>
          </h1>
          <div className="title-decoration">
            <div className="decoration-line"></div>
            <div className="decoration-dots">•••</div>
            <div className="decoration-line"></div>
          </div>
        </div>

        <div className="anket-grid">
          {/* SIFIRDAN ANKET KARTI */}
          <div className="anket-olustur-card" onClick={handleSifirdanAnket}>
            <div className="card-icon">✏️</div>
            <h3>Sıfırdan Anket Oluştur</h3>
            <p>Boş bir sayfadan başlayarak kendi sorularınızı oluşturun.</p>
            <div className="card-hover-effect"></div>
          </div>

          {/* YAPAY ZEKA KARTI */}
          <div className="anket-olustur-card ai-olustur-card" onClick={handleYapayZeka}>
            <div className="card-icon">🤖</div>
            <h3>Yapay Zeka ile Oluştur</h3>
            <p>Kısa bir açıklama girin, yapay zeka sizin için anket tasarlasın.</p>
            <div className="card-hover-effect"></div>
            <div className="ai-glow"></div>
          </div>

          {/* DİĞER KARTLAR */}
          <div className="anket-olustur-card" onClick={handleKopyala}>
            <div className="card-icon">📋</div>
            <h3>Anketi Kopyala</h3>
            <p>Mevcut anketlerinizi temel alarak yeni bir sürüm oluşturun.</p>
            <div className="card-hover-effect"></div>
          </div>

          <div className="anket-olustur-card" onClick={handleYapistir}>
            <div className="card-icon">📝</div>
            <h3>Soruları Yapıştır</h3>
            <p>Elinizdeki soruları yapıştırın, sistem otomatik olarak anketi oluştursun.</p>
            <div className="card-hover-effect"></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnketOlustur;