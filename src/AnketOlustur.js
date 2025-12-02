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

  // 3. KOPYALA - Şablon modu ve şablon listesi
  const [templateMode, setTemplateMode] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  const handleKopyala = async () => {
    setTemplateMode(true);
    setTemplatesLoading(true);

    try {
      const token = localStorage.getItem("token");
      console.log("🔑 Token:", token ? "Var" : "Yok");

      const res = await fetch("/api/surveys", {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });

      console.log("📡 Response status:", res.status);
      const payload = await res.json();
      const items = payload?.data ?? [];

      setTemplates(items);
      console.log("✅ Şablonlar yüklendi:", items);
    } catch (err) {
      console.error("❌ Şablon yükleme hatası:", err);
      alert("Anketler yüklenirken hata oluştu.");
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
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
  const handleAnaSayfa = () => navigate("/");

  // Menüyü kapatma
  const closeMenu = () => setMenuOpen(false);

  // --- Eğer templateMode aktifse liste ekranını göster ---
  if (templateMode) {
    return (
      <div className="panel-container">
        <nav className="panel-navbar">
          <div className="nav-left">
            <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
            <span className="panel-logo">AnketApp</span>
          </div>
          <div className="nav-right">
            <a href="/">Ana Sayfa</a>
            <button className="btn-white" onClick={() => setTemplateMode(false)}>Geri</button>
          </div>
        </nav>

        <div className={`sidebar ${menuOpen ? "open" : ""}`}>
          <ul>
            <li onClick={() => navigate('/profil')}><FaUser className="icon" /> Profil</li>
            <li><FaClipboardList className="icon" /> Anket Oluştur</li>
            <li><FaChartBar className="icon" /> Sonuçları Gör</li>
            <li onClick={handleLogout}><FaSignOutAlt className="icon" /> Çıkış Yap</li>
          </ul>
        </div>

        <main className="anket-main" style={{ padding: 40 }}>
          <h2>📋 Daha Önce Oluşturduğunuz Anketler</h2>

          {templatesLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <FaSpinner style={{ animation: "spin 1s linear infinite", fontSize: 36 }} />
              <p>Anketler yükleniyor...</p>
            </div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#666" }}>
              <p>Henüz oluşturduğunuz bir anket yok.</p>
              <button className="sifirdan-birincil-buton" onClick={() => setTemplateMode(false)}>Geri Dön</button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {templates.map((t) => (
                <div key={t._id} style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8, background: "#fafafa" }}>
                  <h3 style={{ margin: "0 0 8px" }}>{t.anketBaslik || t.name}</h3>
                  <p style={{ margin: 0, color: "#666" }}>{(t.sorular || []).length} soru</p>
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleTemplateSelect(t)}
                      style={{ padding: "8px 12px", background: "#667eea", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
                    >
                      Kopyala ve Düzenle
                    </button>
                    <button
                      onClick={() => window.open(t.paylasimLinki || "#", "_blank")}
                      style={{ padding: "8px 12px", background: "#fff", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" }}
                    >
                      Linki Aç
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
        </main>
      </div>
    );
  }  return (
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
          <li><FaChartBar className="icon" /> Sonuçları Gör</li>
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