import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FaArrowLeft,
  FaUsers,
  FaFileAlt,
  FaSpinner,
  FaCalendarAlt,
  FaChartBar,
  FaHome,
  FaMoon,
  FaSun,
  FaCheckCircle,
  FaPercentage,
  FaCopy,
  FaUser
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import './AnketDetay.css';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

function AnketDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sonuclar, setSonuclar] = useState(null);
  const [aiAnaliz, setAiAnaliz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analizYukleniyor, setAnalizYukleniyor] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('statistics');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('panelDarkMode');
    return saved === 'true';
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('panelDarkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    loadSonuclar();
    loadAiAnaliz();
  }, [id]);

  const loadAiAnaliz = async () => {
    try {
      setAnalizYukleniyor(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${apiUrl}/api/surveys/${id}/ai-analysis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.analiz) {
          setAiAnaliz(result.data.analiz);
        }
      }
    } catch (err) {
      console.error('AI analiz hatası:', err);
    } finally {
      setAnalizYukleniyor(false);
    }
  };

  const loadSonuclar = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/giris');
        return;
      }

      const response = await fetch(`${apiUrl}/api/surveys/${id}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setSonuclar(result.data);
      } else {
        throw new Error(result.error || 'Sonuçlar yüklenemedi');
      }
    } catch (err) {
      console.error('Hata:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/anket-coz/${sonuclar?.anket?.paylasimLinki?.split('/').pop() || id}`;
    navigator.clipboard.writeText(link);
    alert("Link kopyalandı!");
  };

  // Loading State
  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <FaSpinner />
          <p>Anket sonuçları yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <div className="error-icon">⚠️</div>
          <h2>Hata Oluştu</h2>
          <p>{error}</p>
          <button className="nav-back-btn" onClick={() => navigate('/panel')}>
            <FaArrowLeft /> Dashboard'a Dön
          </button>
        </div>
      </div>
    );
  }

  if (!sonuclar) return null;

  const { anket, istatistikler } = sonuclar;

  return (
    <div className="dashboard-page">
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="nav-left">
          <button className="nav-back-btn" onClick={() => navigate('/anket-sonuclari')}>
            <FaArrowLeft /> Geri
          </button>
          <div className="dashboard-logo">
            📊 <span>SurvAI</span>
          </div>
        </div>
        <div className="nav-right">
          <Link to="/panel" className="nav-back-btn">
            <FaHome /> Ana Sayfa
          </Link>
          <Link to="/profil" className="nav-back-btn">
            <FaUser /> Profil
          </Link>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        {/* Survey Header */}
        <div className="survey-header">
          <div className="survey-header-top">
            <div className="survey-title-area">
              <h1>{anket.anketBaslik}</h1>
              {anket.anketAciklama && (
                <p className="survey-description">{anket.anketAciklama}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="nav-back-btn" onClick={copyLink}>
                <FaCopy /> Linki Kopyala
              </button>
              <div className="survey-status-badge">
                <span className="dot"></span>
                Aktif
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-icon questions">
                <FaFileAlt />
              </div>
              <div className="kpi-content">
                <div className="kpi-value">{anket.sorular?.length || 0}</div>
                <div className="kpi-label">Toplam Soru</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon responses">
                <FaUsers />
              </div>
              <div className="kpi-content">
                <div className="kpi-value">{istatistikler.toplamKatilimci}</div>
                <div className="kpi-label">Toplam Cevap</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon date">
                <FaCalendarAlt />
              </div>
              <div className="kpi-content">
                <div className="kpi-value">{new Date(anket.olusturulmaTarihi).toLocaleDateString('tr-TR')}</div>
                <div className="kpi-label">Oluşturma Tarihi</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon rate">
                <FaPercentage />
              </div>
              <div className="kpi-content">
                <div className="kpi-value">%100</div>
                <div className="kpi-label">Tamamlanma Oranı</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Card */}
        {analizYukleniyor ? (
          <div className="ai-card">
            <div className="ai-loading">
              <FaSpinner /> AI Analizi Yapılıyor...
            </div>
          </div>
        ) : aiAnaliz ? (
          <div className="ai-card">
            <div className="ai-card-header">
              <h2>🤖 AI Değerlendirmesi</h2>
              <span className="ai-badge">GPT Powered</span>
            </div>

            <div className="ai-metrics">
              <div className="ai-metric">
                <div className="ai-metric-label">Genel Duygu</div>
                <div className={`ai-sentiment ${aiAnaliz?.duygu || 'nötr'}`}>
                  {aiAnaliz?.duygu === 'pozitif' && '😊 Pozitif'}
                  {aiAnaliz?.duygu === 'negatif' && '😞 Negatif'}
                  {(!aiAnaliz?.duygu || aiAnaliz?.duygu === 'nötr') && '😐 Nötr'}
                </div>
              </div>

              <div className="ai-metric">
                <div className="ai-metric-label">Genel Puan</div>
                <div className="ai-score-display">
                  <div className="ai-score-number">{aiAnaliz?.puan || 5}/10</div>
                  <div className="ai-score-bar">
                    <div
                      className="ai-score-fill"
                      style={{
                        width: `${(aiAnaliz?.puan || 5) * 10}%`,
                        backgroundColor: (aiAnaliz?.puan || 5) >= 7 ? '#10b981' : (aiAnaliz?.puan || 5) >= 4 ? '#f59e0b' : '#ef4444'
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="ai-metric">
                <div className="ai-metric-label">Güvenilirlik</div>
                <div className="ai-sentiment pozitif">
                  <FaCheckCircle /> Yüksek
                </div>
              </div>
            </div>

            <div className="ai-summary-box">
              <p>{aiAnaliz?.ozet || 'Analiz yapılamadı'}</p>
            </div>

            {aiAnaliz?.temel_tematiclar && aiAnaliz.temel_tematiclar.length > 0 && (
              <div className="ai-themes-section">
                <div className="ai-themes-label">Temel Temalar</div>
                <div className="ai-themes-list">
                  {aiAnaliz.temel_tematiclar.map((tema, idx) => (
                    <span key={idx} className="ai-theme-chip">{tema}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`dash-tab ${viewMode === 'statistics' ? 'active' : ''}`}
            onClick={() => setViewMode('statistics')}
          >
            <FaChartBar /> İstatistikler
          </button>
          <button
            className={`dash-tab ${viewMode === 'responses' ? 'active' : ''}`}
            onClick={() => setViewMode('responses')}
          >
            <FaUsers /> Katılımcılar ({sonuclar.katilimcilar?.length || 0})
          </button>
        </div>

        {/* Statistics View */}
        {viewMode === 'statistics' && (
          <div className="stats-grid">
            {istatistikler.sorular && istatistikler.sorular.map((soru, idx) => (
              <div key={idx} className="question-card">
                <div className="question-header">
                  <div className="question-number">{idx + 1}</div>
                  <div className="question-text">{soru.soruMetni}</div>
                  <div className="question-badges">
                    <span className="type-badge">{soru.soruTipi}</span>
                    <span className="count-badge">{soru.toplamCevap} cevap</span>
                  </div>
                </div>

                <div className="question-body">
                  {/* Charts for Multiple Choice */}
                  {['coktan-tek', 'coktan-coklu'].includes(soru.soruTipi) && soru.dagilimArray && (
                    <>
                      <div className="charts-wrapper">
                        <div className="chart-box">
                          <div className="chart-title">Cevap Dağılımı</div>
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={soru.dagilimArray.map(d => ({
                              isim: d.metin.length > 20 ? d.metin.substring(0, 20) + '...' : d.metin,
                              sayi: d.sayi,
                              yuzde: d.yuzde
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="isim" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip
                                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                formatter={(value) => [`${value} cevap`, 'Sayı']}
                              />
                              <Bar dataKey="sayi" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="chart-box">
                          <div className="chart-title">Yüzdelik Dağılım</div>
                          <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                              <Pie
                                data={soru.dagilimArray}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                fill="#8884d8"
                                dataKey="sayi"
                                label={({ yuzde }) => `%${yuzde}`}
                                labelLine={false}
                              >
                                {soru.dagilimArray.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value} cevap`} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <table className="distribution-table">
                        <thead>
                          <tr>
                            <th>Seçenek</th>
                            <th style={{ textAlign: 'center' }}>Sayı</th>
                            <th className="progress-cell">Oran</th>
                          </tr>
                        </thead>
                        <tbody>
                          {soru.dagilimArray.map((secenek, sidx) => (
                            <tr key={sidx}>
                              <td>{secenek.metin}</td>
                              <td className="value-col">{secenek.sayi}</td>
                              <td className="progress-cell">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${secenek.yuzde}%` }}></div>
                                  <span className="progress-text">{secenek.yuzde}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}

                  {/* Open-ended Questions */}
                  {soru.soruTipi === 'acik-uclu' && soru.cevaplar && (
                    <div className="open-answers">
                      <div className="open-answers-header">Verilen Cevaplar ({soru.cevaplar.length})</div>
                      <div className="answers-grid">
                        {soru.cevaplar.map((cevap, cidx) => (
                          <div key={cidx} className="answer-card">
                            {cevap}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slider Questions */}
                  {soru.soruTipi === 'slider' && soru.dagilimArray && (
                    <>
                      <div className="charts-wrapper">
                        <div className="chart-box">
                          <div className="chart-title">Puan Dağılımı</div>
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={soru.dagilimArray.map(d => ({
                              puan: d.sayi,
                              sayi: d.sayi_cevap
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="puan" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Bar dataKey="sayi" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="chart-box">
                          <div className="chart-title">Pasta Grafik</div>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={soru.dagilimArray}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="sayi_cevap"
                                label={({ sayi }) => sayi}
                              >
                                {soru.dagilimArray.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value} cevap`} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <table className="distribution-table">
                        <thead>
                          <tr>
                            <th>Puan</th>
                            <th style={{ textAlign: 'center' }}>Sayı</th>
                            <th className="progress-cell">Oran</th>
                          </tr>
                        </thead>
                        <tbody>
                          {soru.dagilimArray.map((item, sidx) => (
                            <tr key={sidx}>
                              <td className="value-col">{item.sayi}</td>
                              <td className="value-col">{item.sayi_cevap}</td>
                              <td className="progress-cell">
                                <div className="progress-bar">
                                  <div className="progress-fill" style={{ width: `${item.yuzde}%` }}></div>
                                  <span className="progress-text">{item.yuzde}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Responses View */}
        {viewMode === 'responses' && (
          <div className="responses-container">
            {sonuclar.katilimcilar && sonuclar.katilimcilar.length > 0 ? (
              sonuclar.katilimcilar.map((katilimci, idx) => (
                <div key={idx} className="response-card">
                  <div className="response-header">
                    <div className="respondent-info">
                      <div className="respondent-avatar">
                        {idx + 1}
                      </div>
                      <span className="respondent-name">Katılımcı #{idx + 1}</span>
                    </div>
                    <span className="response-time">
                      {new Date(katilimci.olusturulmaTarihi).toLocaleDateString('tr-TR')} {' '}
                      {new Date(katilimci.olusturulmaTarihi).toLocaleTimeString('tr-TR')}
                    </span>
                  </div>

                  <div className="response-body">
                    {anket.sorular?.map((soru, sidx) => {
                      const cevap = katilimci.cevaplar[soru._id.toString()];
                      let cevapMetni = '';

                      if (Array.isArray(cevap)) {
                        cevapMetni = cevap.join(', ');
                      } else if (typeof cevap === 'object' && cevap !== null) {
                        cevapMetni = cevap.toString();
                      } else {
                        cevapMetni = String(cevap || '-');
                      }

                      return (
                        <div key={sidx} className="response-row">
                          <div className="response-question">{soru.soruMetni}</div>
                          <div className="response-answer">{cevapMetni}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <FaUsers />
                </div>
                <h3>Henüz Cevap Yok</h3>
                <p>Bu anket henüz cevaplandırılmamış. Paylaşım linkini göndererek cevap almaya başlayın.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AnketDetay;
