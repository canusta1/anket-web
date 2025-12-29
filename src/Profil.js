import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Profil.css";
import {
  FaBars,
  FaUser,
  FaChartBar,
  FaClipboardList,
  FaSignOutAlt,
  FaArrowLeft,
  FaEdit,
  FaSave,
  FaTimes,
  FaUsers,
  FaPoll,
  FaEnvelope,
  FaHome,
  FaMoon,
  FaSun,
  FaCheckCircle,
  FaChartPie
} from "react-icons/fa";

const BASE_API_URL = process.env.REACT_APP_API_URL + "/api" || 'http://localhost:4000/api';

function Profil() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('panelDarkMode');
    return saved === 'true';
  });

  // Kullanıcı bilgileri
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });

  const [originalData, setOriginalData] = useState({});

  // İstatistikler
  const [stats, setStats] = useState({
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0
  });

  const navigate = useNavigate();

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('panelDarkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Verileri çek
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/giris");
          return;
        }

        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };

        // Kullanıcı Bilgileri
        const userResponse = await fetch(`${BASE_API_URL}/auth/me`, {
          method: "GET",
          headers: headers
        });

        if (userResponse.ok) {
          const userDataRes = await userResponse.json();
          const userState = {
            firstName: userDataRes.firstName || "",
            lastName: userDataRes.lastName || "",
            email: userDataRes.email || ""
          };
          setUserData(userState);
          setOriginalData(userState);
        } else if (userResponse.status === 401) {
          handleLogout();
          return;
        }

        // Anket İstatistikleri
        const surveyResponse = await fetch(`${BASE_API_URL}/surveys`, {
          method: "GET",
          headers: headers
        });

        if (surveyResponse.ok) {
          const surveyResData = await surveyResponse.json();
          if (surveyResData.success && Array.isArray(surveyResData.data)) {
            const surveys = surveyResData.data;
            const total = surveys.length;
            const active = surveys.filter(s => s.durum === "aktif").length;
            const responses = surveys.reduce((acc, curr) => acc + (curr.toplamCevapSayisi || 0), 0);

            setStats({
              totalSurveys: total,
              activeSurveys: active,
              totalResponses: responses
            });
          }
        }
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_API_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName
        })
      });

      const result = await response.json();

      if (response.ok) {
        setOriginalData({ ...userData, ...result.user });
        setEditMode(false);
      } else {
        alert("Hata: " + (result.error || "Güncelleme başarısız."));
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      alert("Sunucuya bağlanılamadı.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setUserData(originalData);
    setEditMode(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/anasayfa");
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Navbar */}
      <nav className="profile-navbar">
        <div className="nav-left">
          <button className="nav-icon-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <FaBars />
          </button>
          <div className="profile-logo">
            📊 <span>SurvAI</span>
          </div>
        </div>
        <div className="nav-right">
          <Link to="/panel" className="nav-link">
            <FaHome /> Anasayfa
          </Link>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`profile-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">📊 SurvAI</div>
          <div className="sidebar-subtitle">Profil Yönetimi</div>
        </div>
        <ul>
          <li className="active" onClick={() => setMenuOpen(false)}>
            <FaUser className="icon" /> Profil
          </li>
          <li onClick={() => navigate('/panel')}>
            <FaChartBar className="icon" /> Dashboard
          </li>
          <li onClick={() => navigate('/anket-olustur')}>
            <FaClipboardList className="icon" /> Anket Oluştur
          </li>
          <li onClick={handleLogout}>
            <FaSignOutAlt className="icon" /> Çıkış Yap
          </li>
        </ul>
      </div>
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>}

      {/* Main Content */}
      <main className="profile-main">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <div className="avatar-circle">
              {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
            </div>
            <div className="profile-name">
              <h1>{userData.firstName} {userData.lastName}</h1>
              <p>{userData.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="stat-icon green">
              <FaPoll />
            </div>
            <div className="stat-info">
              <h3>{stats.totalSurveys}</h3>
              <p>Toplam Anket</p>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="stat-icon blue">
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>{stats.totalResponses}</h3>
              <p>Toplam Yanıt</p>
            </div>
          </div>
          <div className="profile-stat-card">
            <div className="stat-icon orange">
              <FaChartPie />
            </div>
            <div className="stat-info">
              <h3>{stats.activeSurveys}</h3>
              <p>Aktif Anket</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="profile-form-card">
          <div className="form-card-header">
            <h2><FaUser /> Kişisel Bilgiler</h2>
            <button
              className={`edit-btn ${editMode ? "cancel" : ""}`}
              onClick={editMode ? handleCancel : () => setEditMode(true)}
            >
              {editMode ? <><FaTimes /> İptal</> : <><FaEdit /> Düzenle</>}
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Ad</label>
              <input
                type="text"
                name="firstName"
                value={userData.firstName}
                onChange={handleInputChange}
                disabled={!editMode}
                className={editMode ? "editable" : ""}
                placeholder="Adınız"
              />
            </div>

            <div className="form-group">
              <label>Soyad</label>
              <input
                type="text"
                name="lastName"
                value={userData.lastName}
                onChange={handleInputChange}
                disabled={!editMode}
                className={editMode ? "editable" : ""}
                placeholder="Soyadınız"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label><FaEnvelope /> E-posta Adresi</label>
            <div className="readonly-field">
              <input
                type="email"
                value={userData.email}
                disabled={true}
                className="readonly"
              />
              <span className="readonly-badge">
                <FaCheckCircle /> Doğrulanmış
              </span>
            </div>
            <small className="helper-text">E-posta adresi değiştirilemez</small>
          </div>

          {editMode && (
            <div className="form-actions">
              <button className="save-btn" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>Kaydediliyor...</>
                ) : (
                  <><FaSave /> Değişiklikleri Kaydet</>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Profil;