import React, { useState } from "react";
import "./Panel.css";
import { FaBars, FaUser, FaChartBar, FaClipboardList, FaSignOutAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

function Panel() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Çıkış yap
  const handleLogout = () => {
    navigate("/giris");
  };

  // Anket oluştur sayfasına git
  const handleAnketOlustur = () => {
    navigate("/anket-olustur");
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
          <Link to="/">Ana Sayfa</Link>
          <Link to="#">Paketler</Link>
          <Link to="#">Analiz</Link>
          <button className="btn-green">Yükselt</button>
          <button className="btn-white" onClick={handleAnketOlustur}>
            Anket Oluştur
          </button>
        </div>
      </nav>

      {/* Sol Menü (Sidebar) */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <ul>
          <li><FaUser className="icon" /> Profil</li>
          <li onClick={handleAnketOlustur}>
            <FaClipboardList className="icon" /> Anket Oluştur
          </li>
          <li><FaChartBar className="icon" /> Sonuçları Gör</li>
          <li onClick={handleLogout}>
            <FaSignOutAlt className="icon" /> Çıkış Yap
          </li>
        </ul>
      </div>

      {/* Ana İçerik */}
      <main className="panel-main">
        <h1>Geçmiş Anketler</h1>
        <p className="desc">
          Bu alanda geçmişte oluşturduğunuz anketleri görebileceksiniz.
          Veritabanı bağlantısı tamamlandığında burada anket listesi yer alacak.
        </p>
      </main>
    </div>
  );
}


export default Panel;
