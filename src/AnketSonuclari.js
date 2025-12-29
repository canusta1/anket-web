import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaArrowLeft, FaUsers, FaCalendarAlt, FaChartBar,
  FaFileAlt, FaCheckCircle, FaDownload, FaFilter,
  FaSpinner, FaChartPie, FaHome, FaBars, FaSignOutAlt,
  FaUser, FaMoon, FaSun
} from 'react-icons/fa';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './AnketSonuclari.css';
import './Panel.css';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function AnketSonuclari() {
  const navigate = useNavigate();
  const [anketler, setAnketler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/giris');
  };

  useEffect(() => {
    loadAnketler();
  }, []);

  const loadAnketler = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/giris');
        return;
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/surveys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Anketler yüklenemedi');
      }

      const result = await response.json();

      if (result.success) {
        setAnketler(result.data || []);
        console.log('📊 Anketler yüklendi:', result.data);
      } else {
        throw new Error(result.error || 'Anketler yüklenemedi');
      }
    } catch (err) {
      console.error('Anketler yüklenirken hata:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnketDetay = (id) => {
    navigate(`/anket-detay/${id}`);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderQuestionStatistics = (soru, index) => {
    if (soru.soruTipi === 'acik-uclu') {
      return (
        <div className="question-card" key={index}>
          <div className="question-header">
            <div className="question-number">Soru {index + 1}</div>
            <div className="question-type-badge open-ended">Açık Uçlu</div>
          </div>
          <h3 className="question-text">{soru.soruMetni}</h3>

          <div className="response-count">
            <FaFileAlt /> {soru.cevaplar?.length || 0} yanıt
          </div>

          {soru.cevaplar && soru.cevaplar.length > 0 ? (
            <div className="open-ended-responses">
              {soru.cevaplar.map((cevap, idx) => (
                <div key={idx} className="response-item">
                  <div className="response-number">{idx + 1}</div>
                  <p className="response-text">"{cevap}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-responses">
              <FaFileAlt />
              <p>Henüz cevap verilmemiş</p>
            </div>
          )}
        </div>
      );
    }

    // Çoktan seçmeli sorular
    if (!soru.dagilimArray || soru.dagilimArray.length === 0) {
      return (
        <div className="question-card" key={index}>
          <div className="question-header">
            <div className="question-number">Soru {index + 1}</div>
            <div className="question-type-badge multiple-choice">Çoktan Seçmeli</div>
          </div>
          <h3 className="question-text">{soru.soruMetni}</h3>
          <div className="no-responses">
            <FaChartBar />
            <p>Henüz cevap verilmemiş</p>
          </div>
        </div>
      );
    }

    const chartData = soru.dagilimArray.map((item) => ({
      name: item.metin.length > 25 ? item.metin.substring(0, 25) + '...' : item.metin,
      fullName: item.metin,
      value: item.sayi,
      yuzde: item.yuzde
    }));

    return (
      <div className="question-card" key={index}>
        <div className="question-header">
          <div className="question-number">Soru {index + 1}</div>
          <div className="question-type-badge multiple-choice">Çoktan Seçmeli</div>
        </div>
        <h3 className="question-text">{soru.soruMetni}</h3>

        <div className="response-count">
          <FaUsers /> {soru.toplamCevap} yanıt
        </div>

        {/* Özet İstatistikler */}
        <div className="stats-summary">
          {soru.dagilimArray.map((item, idx) => (
            <div key={idx} className="stat-card">
              <div className="stat-color" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
              <div className="stat-content">
                <div className="stat-label">Seçenek {idx + 1}</div>
                <div className="stat-value">{item.sayi}</div>
                <div className="stat-percent">%{item.yuzde}</div>
                <div className="stat-option">{item.metin}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Grafikler */}
        <div className="charts-container">
          {/* Bar Chart */}
          <div className="chart-box">
            <h4 className="chart-title">
              <FaChartBar /> Yanıt Dağılımı
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} kişi (%${props.payload.yuzde})`,
                    props.payload.fullName
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="chart-box">
            <h4 className="chart-title">
              <FaChartPie /> Yüzdelik Dağılım
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ yuzde }) => `%${yuzde}`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} kişi (%${props.payload.yuzde})`,
                    props.payload.fullName
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry) => (
                    <span style={{ fontSize: '12px' }}>{entry.payload.name}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="results-loading">
        <FaSpinner className="fa-spin" />
        <p>Anketler yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-error">
        <div className="error-icon">⚠️</div>
        <h2>Hata Oluştu</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/panel')} className="btn-back">
          <FaArrowLeft /> Panele Dön
        </button>
      </div>
    );
  }

  return (
    <div className="results-container panel-container">
      {/* Navbar - Panel Style */}
      <nav className="panel-navbar">
        <div className="nav-left">
          <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
          <span className="panel-logo">SurvAI</span>
        </div>

        <div className="nav-right">
          <Link to="/panel" className="nav-link"><FaHome /> Panel</Link>
          <Link to="/profil" className="nav-link"><FaUser /> Profil</Link>
          <button
            className="btn-white"
            onClick={() => navigate('/anket-olustur')}
          >
            + Yeni Anket
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">📊 SurvAI</div>
          <div className="sidebar-subtitle">Anket Yönetim Sistemi</div>
        </div>
        <ul>
          <li onClick={() => navigate('/panel')}><FaChartBar className="icon" /> Dashboard</li>
          <li className="active"><FaChartPie className="icon" /> Sonuçları Gör</li>
          <li onClick={() => navigate('/profil')}><FaUser className="icon" /> Profil</li>
          <li onClick={handleLogout}><FaSignOutAlt className="icon" /> Çıkış Yap</li>
        </ul>
      </div>
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>}

      {/* Header */}
      <div className="panel-main">
        {/* Header - Compact */}
        <div className="results-hero-header">
          <div className="hero-content">
            <div className="hero-title-row">
              <div className="hero-icon-wrapper">
                <FaChartPie className="hero-icon" />
              </div>
              <h1 className="hero-title">
                <span className="title-gradient">Anket Sonuçları</span>
              </h1>
            </div>
            <p className="hero-subtitle">
              Tüm anketlerinizin detaylı sonuçlarını ve istatistiklerini keşfedin
            </p>
          </div>
          <div className="hero-stats-mini">
            <div className="mini-stat">
              <span className="mini-stat-value">{anketler.length}</span>
              <span className="mini-stat-label">Toplam Anket</span>
            </div>
          </div>
        </div>

        {/* Anketler Listesi */}
        {anketler.length === 0 ? (
          <div className="no-responses">
            <FaFileAlt className="no-responses-icon" />
            <h2>Henüz Anket Yok</h2>
            <p>Anket oluşturarak başlayın</p>
          </div>
        ) : (
          <div className="anketler-list-container">
            {/* List Header */}
            <div className="list-header">
              <div className="list-col col-title">Anket Başlığı</div>
              <div className="list-col col-questions">Sorular</div>
              <div className="list-col col-responses">Cevaplar</div>
              <div className="list-col col-status">Durum</div>
              <div className="list-col col-actions">İşlem</div>
            </div>

            {/* List Body */}
            <div className="list-body">
              {anketler.map((anket, index) => (
                <div
                  key={anket._id}
                  className="list-row"
                  style={{ '--row-index': index }}
                  onClick={() => handleAnketDetay(anket._id)}
                >
                  <div className="list-col col-title">
                    <div className="title-content">
                      <span className="title-text">{anket.anketBaslik}</span>
                      {anket.anketAciklama && (
                        <span className="title-desc">{anket.anketAciklama}</span>
                      )}
                    </div>
                  </div>
                  <div className="list-col col-questions">
                    <span className="stat-badge questions">
                      <FaFileAlt /> {anket.sorular?.length || 0}
                    </span>
                  </div>
                  <div className="list-col col-responses">
                    <span className="stat-badge responses">
                      <FaUsers /> {anket.toplamCevapSayisi || 0}
                    </span>
                  </div>
                  <div className="list-col col-status">
                    <span className={`status-badge ${anket.durum}`}>
                      {anket.durum === 'aktif' ? <FaCheckCircle /> : null}
                      {anket.durum}
                    </span>
                  </div>
                  <div className="list-col col-actions">
                    <button
                      className="btn-view-results"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnketDetay(anket._id);
                      }}
                    >
                      Sonuçları Gör
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnketSonuclari;