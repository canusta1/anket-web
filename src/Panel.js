import React, { useState } from "react";
import "./Panel.css";
import { FaBars, FaUser, FaChartBar, FaClipboardList, FaSignOutAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";


function Panel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();


  const handleLogout = () => {
    navigate("/giris");
  };


  const handleAnketOlustur = () => {
    navigate("/anket-olustur");
  };


  const handleProfil = () => {
    navigate("/profil");
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
          <Link to="/" className="nav-link">Ana Sayfa</Link>

          <button className="btn-white" onClick={handleAnketOlustur}>
            Anket Oluştur
          </button>
        </div>
      </nav>

      {/* Sol Menü (Sidebar) */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
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

      {/* ana içerik */}
      <main className="panel-main">
        <h1>Geçmiş Anketler</h1>
        <p className="desc">
          Bu alanda geçmişte oluşturduğunuz anketleri görebileceksiniz.
          Veritabanı bağlantısı tamamlandığında burada anket listesi yer alacak.
        </p>

        {/* örnek anket kartları-db den çekildiğinde kaldırılacak*/}
        <div className="anket-grid">
          <div className="anket-kart">
            <h3>Müşteri Memnuniyeti Anketi</h3>
            <p>Oluşturulma: 15 Ocak 2024</p>
            <div className="anket-istatistik">
              <span>📊 45 Yanıt</span>
              <span>🟢 Aktif</span>
            </div>
          </div>

          <div className="anket-kart">
            <h3>Çalışan Memnuniyeti Anketi</h3>
            <p>Oluşturulma: 10 Ocak 2024</p>
            <div className="anket-istatistik">
              <span>📊 28 Yanıt</span>
              <span>🔴 Tamamlandı</span>
            </div>
          </div>

          <div className="anket-kart">
            <h3>Ürün Değerlendirme Anketi</h3>
            <p>Oluşturulma: 5 Ocak 2024</p>
            <div className="anket-istatistik">
              <span>📊 67 Yanıt</span>
              <span>🟢 Aktif</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Panel;