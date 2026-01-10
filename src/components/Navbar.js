import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBars,
  FaHome,
  FaUser,
  FaChartBar,
  FaClipboardList,
  FaSignOutAlt,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import SurvAILogo from '../assets/SurvAI_Logo.png';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

/**
 * Global Navbar Component
 * 
 * Props:
 * - activePage: string - Hangi sayfa aktif ('panel', 'profil', 'sonuclar', 'olustur')
 * - showCreateButton: boolean - "Anket Oluştur" butonu gösterilsin mi (default: true)
 */
function Navbar({ activePage = '', showCreateButton = true }) {
  const navigate = useNavigate();
  const { logout } = useAuth(); // AuthContext'ten logout al
  const [menuOpen, setMenuOpen] = useState(false);
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

  const handleLogout = () => {
    logout();
    navigate('/anasayfa', { replace: true });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* Üst Navbar */}
      <nav className="global-navbar">
        <div className="nav-left">
          <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
          <img 
            src={SurvAILogo} 
            alt="SurvAI" 
            className="navbar-logo-img" 
            onClick={() => navigate('/panel')} 
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className="nav-right">
          <Link to="/panel" className={`nav-link ${activePage === 'panel' ? 'active' : ''}`}>
            <FaHome /> Ana Sayfa
          </Link>
          <Link to="/profil" className={`nav-link ${activePage === 'profil' ? 'active' : ''}`}>
            <FaUser /> Profil
          </Link>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Açık Tema' : 'Koyu Tema'}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          {showCreateButton && (
            <button className="nav-btn-primary" onClick={() => navigate('/anket-olustur')}>
              Anket Oluştur
            </button>
          )}
        </div>
      </nav>

      {/* Sol Menü (Sidebar) */}
      <div className={`global-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo" onClick={() => { navigate('/panel'); closeMenu(); }} style={{ cursor: 'pointer' }}>
            <img src={SurvAILogo} alt="SurvAI" className="sidebar-logo-img" />
          </div>
          <div className="sidebar-subtitle">Anket Yönetim Sistemi</div>
        </div>
        <ul>
          <li 
            className={activePage === 'panel' ? 'active' : ''} 
            onClick={() => { navigate('/panel'); closeMenu(); }}
          >
            <FaHome className="icon" /> Ana Sayfa
          </li>
          <li 
            className={activePage === 'profil' ? 'active' : ''} 
            onClick={() => { navigate('/profil'); closeMenu(); }}
          >
            <FaUser className="icon" /> Profil
          </li>
          <li 
            className={activePage === 'olustur' ? 'active' : ''} 
            onClick={() => { navigate('/anket-olustur'); closeMenu(); }}
          >
            <FaClipboardList className="icon" /> Anket Oluştur
          </li>
          <li 
            className={activePage === 'sonuclar' ? 'active' : ''} 
            onClick={() => { navigate('/anket-sonuclari'); closeMenu(); }}
          >
            <FaChartBar className="icon" /> Sonuçları Gör
          </li>
          <li onClick={handleLogout}>
            <FaSignOutAlt className="icon" /> Çıkış Yap
          </li>
        </ul>
      </div>

      {/* Overlay - menü açıkken tıklanınca kapatmak için */}
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu}></div>}
    </>
  );
}

export default Navbar;
