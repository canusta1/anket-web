import React, { useState } from "react";
import "./AnketOlustur.css";
import { FaBars, FaUser, FaChartBar, FaClipboardList, FaSignOutAlt, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function AnketOlustur() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => navigate("/giris");

  // 1. SIFIRDAN ANKET (Yönlendirme)
  const handleSifirdanAnket = () => {
    navigate("/sifirdan-anket");
  };

  // 2. YAPAY ZEKA (Yönlendirme - SORUN BURADAYDI, DÜZELDİ)
  const handleYapayZeka = () => {
    // Eski kod: setAiFormMode(true); -> YANLIŞ (Sayfa içinde açıyordu)
    // Yeni kod: navigate("/ai-ile-anket"); -> DOĞRU (Hazırladığımız sayfaya gider)
    navigate("/ai-ile-anket");
  };

  // --- Yeni state'ler: şablon modu ve şablon listesi ---
  const [templateMode, setTemplateMode] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Diğer butonlar (Henüz hazır olmayanlar)
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

  // <--- EKLE: Yapıştırma fonksiyonu tanımı (ESLint hatasını giderir)
  const handleYapistir = () => {
    // Geçici: özellik henüz hazır değilse kullanıcıyı bilgilendir
    // İstersen burayı paste modal'ı açacak veya başka bir route'a yönlendirecek şekilde değiştir.
    alert("Soruları yapıştırma özelliği yakında gelecek!");
  };
  
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
  }

  return (
    <div className="panel-container">
      {/* Navbar */}
      <nav className="panel-navbar">
        <div className="nav-left">
          <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
          <span className="panel-logo">AnketApp</span>
        </div>

        <div className="nav-right">
          <a href="/">Ana Sayfa</a>
          <button className="btn-white">Anket Oluştur</button>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => navigate('/profil')}><FaUser className="icon" /> Profil</li>
          <li><FaClipboardList className="icon" /> Anket Oluştur</li>
          <li><FaChartBar className="icon" /> Sonuçları Gör</li>
          <li onClick={handleLogout}><FaSignOutAlt className="icon" /> Çıkış Yap</li>
        </ul>
      </div>

      {/* İçerik */}
      <main className="anket-main">
        <h1>Nasıl bir anket oluşturmak istiyorsunuz?</h1>
        <div className="anket-grid">

          {/* SIFIRDAN ANKET KARTI */}
          <div className="anket-card" onClick={handleSifirdanAnket}>
            <img src="https://img.icons8.com/color/96/000000/survey.png" alt="Sıfırdan" />
            <h3>Sıfırdan Anket Oluştur</h3>
            <p>Boş bir sayfadan başlayarak kendi sorularınızı oluşturun.</p>
          </div>

          {/* YAPAY ZEKA KARTI - Artık direkt AI sayfasına atar */}
          <div className="anket-card" onClick={handleYapayZeka}>
            <img src="https://img.icons8.com/color/96/000000/artificial-intelligence.png" alt="Yapay Zeka" />
            <h3>Yapay Zeka ile Anket Oluştur</h3>
            <p>Kısa bir açıklama girin, yapay zeka sizin için anket tasarlasın.</p>
          </div>

          {/* DİĞER KARTLAR */}
          <div className="anket-card" onClick={handleKopyala}>
            <img src="https://img.icons8.com/color/96/000000/copy.png" alt="Kopyala" />
            <h3>Daha Önceki Anketi Kopyalayın</h3>
            <p>Mevcut anketlerinizi temel alarak yeni bir sürüm oluşturun.</p>
          </div>

          <div className="anket-card" onClick={handleYapistir}>
            <img src="https://img.icons8.com/color/96/000000/paste.png" alt="Soruları Yapıştır" />
            <h3>Soruları Yapıştırarak Oluştur</h3>
            <p>Elinizdeki soruları yapıştırın, sistem otomatik olarak anketi oluştursun.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnketOlustur;