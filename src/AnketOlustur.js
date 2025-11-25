import React, { useState } from "react";
import "./AnketOlustur.css";
import { FaBars, FaUser, FaChartBar, FaClipboardList, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function AnketOlustur() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => navigate("/giris");
  const handleSifirdanAnket = () => {
    console.log("🚀 Sıfırdan Anket'e tıklandı, yönlendiriliyor...");
    navigate("/sifirdan-anket");
  };
  const handleYapayZeka = () => alert("Yapay Zeka ile Anket özelliği yakında gelecek!");
  const handleKopyala = () => alert("Anket kopyalama özelliği yakında gelecek!");
  const handleYapistir = () => alert("Soruları yapıştırma özelliği yakında gelecek!");

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
          <div className="anket-card" onClick={handleSifirdanAnket}>
            <img src="https://img.icons8.com/color/96/000000/survey.png" alt="Sıfırdan" />
            <h3>Sıfırdan Anket Oluştur</h3>
            <p>Boş bir sayfadan başlayarak kendi sorularınızı oluşturun.</p>
          </div>

          <div className="anket-card" onClick={handleYapayZeka}>
            <img src="https://img.icons8.com/color/96/000000/artificial-intelligence.png" alt="Yapay Zeka" />
            <h3>Yapay Zeka ile Anket Oluştur</h3>
            <p>Kısa bir açıklama girin, yapay zeka sizin için anket tasarlasın.</p>
          </div>

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