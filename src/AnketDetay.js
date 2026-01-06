import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaUsers,
  FaFileAlt,
  FaSpinner,
  FaCalendarAlt,
  FaChartBar,
  FaCheckCircle,
  FaCopy,
  FaCheck
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
  ResponsiveContainer
} from 'recharts';
import './AnketDetay.css';
import Navbar from './components/Navbar';

// 🎯 Panel uyumlu renk paleti - yeşil accent öncelikli
const COLORS = ['#00d4aa', '#10b981', '#3b82f6', '#f59e0b', '#14b8a6', '#6366f1', '#ef4444', '#ec4899'];

function AnketDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sonuclar, setSonuclar] = useState(null);
  const [aiAnaliz, setAiAnaliz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analizYukleniyor, setAnalizYukleniyor] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('statistics');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // 🎯 Split-view için seçili soru state'i (-1 = Genel Bakış)
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(-1);
  
  // 🎯 Split-view için seçili katılımcı state'i (-1 = Genel Bakış)
  const [selectedParticipantIndex, setSelectedParticipantIndex] = useState(-1);

  // 🎯 API URL memoize edildi
  const apiUrl = useMemo(() => process.env.REACT_APP_API_URL || 'http://localhost:4000', []);

  // 🎯 AI analiz yükleme - useCallback ile optimize
  const loadAiAnaliz = useCallback(async () => {
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
  }, [apiUrl, id]);

  // 🎯 Sonuçları yükleme - useCallback ile optimize
  const loadSonuclar = useCallback(async () => {
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
  }, [apiUrl, id, navigate]);

  useEffect(() => {
    loadSonuclar();
    loadAiAnaliz();
  }, [loadSonuclar, loadAiAnaliz]);

  // 🎯 Link kopyalama - feedback ile
  const copyLink = useCallback(() => {
    const link = `${window.location.origin}/anket-coz/${sonuclar?.anket?.paylasimLinki?.split('/').pop() || id}`;
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [sonuclar, id]);

  // 🎯 Tarih formatlama - memoize
  const formatTarih = useCallback((tarih) => {
    return new Date(tarih).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

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
    <div className="dashboard-page panel-container">
      {/* Global Navbar */}
      <Navbar activePage="sonuclar" showCreateButton={false} />

      <main className="dashboard-main">
        {/* Survey Header - Ultra Kompakt */}
        <div className="survey-header-compact">
          <div className="survey-info-row">
            <div className="survey-title-compact">
              <h1>{anket.anketBaslik}</h1>
              {anket.anketAciklama && (
                <p className="survey-desc-compact">{anket.anketAciklama}</p>
              )}
            </div>
            <div className="survey-actions-compact">
              <button 
                className="copy-btn-compact" 
                onClick={copyLink}
                style={copySuccess ? { background: '#10b981', color: 'white', borderColor: '#10b981' } : {}}
              >
                {copySuccess ? <><FaCheck /> Kopyalandı</> : <><FaCopy /> Link</>}
              </button>
              <span className={`status-pill ${anket.durum}`}>
                <span className="dot"></span>
                {anket.durum === 'aktif' ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs - Kompakt */}
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

        {/* Statistics View - Split Layout */}
        {viewMode === 'statistics' && (
          <div className="stats-split-layout">
            {/* Sol Sidebar - Soru Listesi */}
            <div className="stats-sidebar">
              <div className="sidebar-header">
                <h3>📊 Sorular ({istatistikler.sorular?.length || 0})</h3>
              </div>
              
              <div className="question-nav-list">
                {/* Genel Bakış */}
                <div 
                  className={`question-nav-item overview ${selectedQuestionIndex === -1 ? 'active' : ''}`}
                  onClick={() => setSelectedQuestionIndex(-1)}
                >
                  <div className="nav-item-icon overview-icon">
                    <FaChartBar />
                  </div>
                  <div className="nav-item-content">
                    <span className="nav-item-title">Genel Bakış</span>
                    <span className="nav-item-subtitle">Özet & AI Analizi</span>
                  </div>
                </div>

                {/* Soru Listesi */}
                {istatistikler.sorular && istatistikler.sorular.map((soru, idx) => (
                  <div 
                    key={idx}
                    className={`question-nav-item ${selectedQuestionIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedQuestionIndex(idx)}
                  >
                    <div className="nav-item-index">{idx + 1}</div>
                    <div className="nav-item-content">
                      <span className="nav-item-title">
                        {soru.soruMetni.length > 30 ? soru.soruMetni.substring(0, 30) + '...' : soru.soruMetni}
                      </span>
                      <span className="nav-item-meta">
                        <span className="meta-type">{soru.soruTipi}</span>
                        <span className="meta-count">{soru.toplamCevap} cevap</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sağ Content - Seçili Soru Detayı */}
            <div className="stats-content">
              {/* Genel Bakış Görünümü */}
              {selectedQuestionIndex === -1 && (
                <div className="overview-content">
                  <div className="content-header">
                    <h2>📈 Anket Genel Bakışı</h2>
                    <p>Anketinizin performans özeti ve AI değerlendirmesi</p>
                  </div>

                  {/* Özet Kartları */}
                  <div className="overview-stats-grid">
                    <div className="overview-stat-card">
                      <div className="stat-icon blue"><FaFileAlt /></div>
                      <div className="stat-info">
                        <span className="stat-value">{anket.sorular?.length || 0}</span>
                        <span className="stat-label">Toplam Soru</span>
                      </div>
                    </div>
                    <div className="overview-stat-card">
                      <div className="stat-icon green"><FaUsers /></div>
                      <div className="stat-info">
                        <span className="stat-value">{istatistikler.toplamKatilimci}</span>
                        <span className="stat-label">Katılımcı</span>
                      </div>
                    </div>
                    <div className="overview-stat-card">
                      <div className="stat-icon orange"><FaCheckCircle /></div>
                      <div className="stat-info">
                        <span className="stat-value">%100</span>
                        <span className="stat-label">Tamamlama</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Değerlendirmesi */}
                  {analizYukleniyor ? (
                    <div className="ai-overview-card loading">
                      <FaSpinner className="spin" /> AI Analizi Yapılıyor...
                    </div>
                  ) : aiAnaliz ? (
                    <div className="ai-overview-card">
                      <div className="ai-overview-header">
                        <span className="ai-label">🤖 AI Değerlendirmesi</span>
                        <span className="ai-badge-mini">GPT</span>
                      </div>
                      <div className="ai-overview-metrics">
                        <div className={`ai-metric-pill ${aiAnaliz?.duygu || 'nötr'}`}>
                          {aiAnaliz?.duygu === 'pozitif' && '😊 Pozitif'}
                          {aiAnaliz?.duygu === 'negatif' && '😞 Negatif'}
                          {(!aiAnaliz?.duygu || aiAnaliz?.duygu === 'nötr') && '😐 Nötr'}
                        </div>
                        <div className="ai-score-display-mini">
                          <span className="score-text">{aiAnaliz?.puan || 5}/10</span>
                          <div className="score-bar-bg">
                            <div 
                              className="score-bar-fill" 
                              style={{
                                width: `${(aiAnaliz?.puan || 5) * 10}%`,
                                backgroundColor: (aiAnaliz?.puan || 5) >= 7 ? '#10b981' : (aiAnaliz?.puan || 5) >= 4 ? '#f59e0b' : '#ef4444'
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="ai-metric-pill pozitif">
                          <FaCheckCircle /> Güvenilir
                        </div>
                      </div>
                      <p className="ai-overview-summary">{aiAnaliz?.ozet || 'Analiz yapılamadı'}</p>
                      {aiAnaliz?.temel_tematiclar && aiAnaliz.temel_tematiclar.length > 0 && (
                        <div className="ai-themes-wrap">
                          {aiAnaliz.temel_tematiclar.map((tema, idx) => (
                            <span key={idx} className="theme-chip">{tema}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="ai-overview-card empty">
                      <p>AI analizi için yeterli veri yok.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Seçili Soru Detayı */}
              {selectedQuestionIndex >= 0 && istatistikler.sorular && istatistikler.sorular[selectedQuestionIndex] && (
                <div className="question-detail-content">
                  {(() => {
                    const soru = istatistikler.sorular[selectedQuestionIndex];
                    return (
                      <>
                        <div className="content-header">
                          <div className="question-title-row">
                            <span className="question-num">Soru {selectedQuestionIndex + 1}</span>
                            <span className="question-type-badge">{soru.soruTipi}</span>
                          </div>
                          <h2>{soru.soruMetni}</h2>
                          <p className="response-count">{soru.toplamCevap} kişi cevapladı</p>
                        </div>

                        {/* Multiple Choice Charts */}
                        {['coktan-tek', 'coktan-coklu'].includes(soru.soruTipi) && soru.dagilimArray && (
                          <div className="charts-section">
                            <div className="charts-row">
                              <div className="chart-card">
                                <h4>📊 Dağılım</h4>
                                <ResponsiveContainer width="100%" height={280}>
                                  <BarChart data={soru.dagilimArray.map(d => ({
                                    isim: d.metin.length > 20 ? d.metin.substring(0, 20) + '...' : d.metin,
                                    sayi: d.sayi,
                                    yuzde: d.yuzde
                                  }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" />
                                    <XAxis dataKey="isim" tick={{ fontSize: 11, fill: 'var(--dash-text-muted)' }} angle={-20} textAnchor="end" height={60} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--dash-text-muted)' }} width={30} />
                                    <Tooltip
                                      contentStyle={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)', borderRadius: '8px', color: 'var(--dash-text)' }}
                                      formatter={(value) => [`${value} cevap`, 'Sayı']}
                                    />
                                    <Bar dataKey="sayi" fill="#00d4aa" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="chart-card">
                                <h4>🥧 Yüzdelik Dağılım</h4>
                                <ResponsiveContainer width="100%" height={280}>
                                  <PieChart>
                                    <Pie
                                      data={soru.dagilimArray}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={100}
                                      fill="#8884d8"
                                      dataKey="sayi"
                                      label={({ yuzde }) => `%${yuzde}`}
                                      labelLine={false}
                                    >
                                      {soru.dagilimArray.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} cevap`} contentStyle={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)', borderRadius: '8px' }} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            <div className="data-table-card">
                              <h4>📋 Seçenek Detayları</h4>
                              <table className="detail-table">
                                <thead>
                                  <tr>
                                    <th>Seçenek</th>
                                    <th style={{ textAlign: 'center' }}>Sayı</th>
                                    <th>Oran</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {soru.dagilimArray.map((secenek, sidx) => (
                                    <tr key={sidx}>
                                      <td>{secenek.metin}</td>
                                      <td className="count-cell">{secenek.sayi}</td>
                                      <td>
                                        <div className="progress-bar-inline">
                                          <div className="progress-fill-inline" style={{ width: `${secenek.yuzde}%` }}></div>
                                          <span className="progress-label">{secenek.yuzde}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Open-ended Questions */}
                        {soru.soruTipi === 'acik-uclu' && soru.cevaplar && (
                          <div className="open-ended-section">
                            <div className="answers-header">
                              <h4>💬 Verilen Cevaplar</h4>
                              <span className="answers-count">{soru.cevaplar.length} cevap</span>
                            </div>
                            <div className="answers-list">
                              {soru.cevaplar.map((cevap, cidx) => (
                                <div key={cidx} className="answer-item">
                                  <span className="answer-index">{cidx + 1}</span>
                                  <p>{cevap}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Slider Questions */}
                        {soru.soruTipi === 'slider' && soru.dagilimArray && (
                          <div className="charts-section">
                            <div className="charts-row">
                              <div className="chart-card">
                                <h4>📊 Puan Dağılımı</h4>
                                <ResponsiveContainer width="100%" height={280}>
                                  <BarChart data={soru.dagilimArray.map(d => ({
                                    puan: d.sayi,
                                    sayi: d.sayi_cevap
                                  }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-border)" />
                                    <XAxis dataKey="puan" tick={{ fontSize: 11, fill: 'var(--dash-text-muted)' }} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--dash-text-muted)' }} width={30} />
                                    <Tooltip contentStyle={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)', borderRadius: '8px' }} />
                                    <Bar dataKey="sayi" fill="#10b981" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="chart-card">
                                <h4>🥧 Oran</h4>
                                <ResponsiveContainer width="100%" height={280}>
                                  <PieChart>
                                    <Pie
                                      data={soru.dagilimArray}
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={100}
                                      fill="#8884d8"
                                      dataKey="sayi_cevap"
                                      label={({ sayi }) => sayi}
                                    >
                                      {soru.dagilimArray.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} cevap`} contentStyle={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)', borderRadius: '8px' }} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            <div className="data-table-card">
                              <h4>📋 Puan Detayları</h4>
                              <table className="detail-table">
                                <thead>
                                  <tr>
                                    <th>Puan</th>
                                    <th style={{ textAlign: 'center' }}>Sayı</th>
                                    <th>Oran</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {soru.dagilimArray.map((item, sidx) => (
                                    <tr key={sidx}>
                                      <td className="count-cell">{item.sayi}</td>
                                      <td className="count-cell">{item.sayi_cevap}</td>
                                      <td>
                                        <div className="progress-bar-inline">
                                          <div className="progress-fill-inline" style={{ width: `${item.yuzde}%` }}></div>
                                          <span className="progress-label">{item.yuzde}%</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Responses View - Split Layout */}
        {viewMode === 'responses' && (
          <div className="stats-split-layout">
            {/* Sol Sidebar - Katılımcı Listesi */}
            <div className="stats-sidebar">
              <div className="sidebar-header">
                <h3>👥 Katılımcılar ({sonuclar.katilimcilar?.length || 0})</h3>
              </div>
              <div className="question-nav-list">
                {/* Katılımcı Listesi */}
                {sonuclar.katilimcilar && sonuclar.katilimcilar.length > 0 ? (
                  sonuclar.katilimcilar.map((katilimci, idx) => (
                    <div
                      key={idx}
                      className={`question-nav-item ${(selectedParticipantIndex === -1 && idx === 0) || selectedParticipantIndex === idx ? 'active' : ''}`}
                      onClick={() => setSelectedParticipantIndex(idx)}
                    >
                      <div className="nav-item-number">{idx + 1}</div>
                      <div className="nav-item-content">
                        <span className="nav-item-title">Katılımcı #{idx + 1}</span>
                        <span className="nav-item-subtitle">
                          {new Date(katilimci.olusturulmaTarihi).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-sidebar-msg">
                    <span>Henüz katılımcı yok</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sağ İçerik Alanı */}
            <div className="stats-content">
              {/* Katılımcı yoksa */}
              {(!sonuclar.katilimcilar || sonuclar.katilimcilar.length === 0) && (
                <div className="empty-state-inline">
                  <div className="empty-icon">👥</div>
                  <h4>Henüz Katılımcı Yok</h4>
                  <p>Bu anket henüz cevaplandırılmamış.</p>
                </div>
              )}

              {/* Seçili Katılımcı Detayı - İlk katılımcı default seçili */}
              {sonuclar.katilimcilar && sonuclar.katilimcilar.length > 0 && (() => {
                const activeIdx = selectedParticipantIndex === -1 ? 0 : selectedParticipantIndex;
                const katilimci = sonuclar.katilimcilar[activeIdx];
                if (!katilimci) return null;
                
                return (
                  <div className="content-section participant-detail">
                    <div className="participant-header-slim">
                      <div className="participant-info-slim">
                        <span className="participant-badge">{activeIdx + 1}</span>
                        <span className="participant-name">Katılımcı #{activeIdx + 1}</span>
                        <span className="participant-date-slim">
                          {new Date(katilimci.olusturulmaTarihi).toLocaleDateString('tr-TR')} • {new Date(katilimci.olusturulmaTarihi).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                    </div>

                    {/* Cevap Listesi - Ultra Kompakt */}
                    <div className="answers-ultra-compact">
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
                          <div key={sidx} className="qa-item">
                            <div className="qa-question">
                              <span className="qa-num">{sidx + 1}</span>
                              <span className="qa-text">{soru.soruMetni}</span>
                            </div>
                            <div className="qa-answer">{cevapMetni}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AnketDetay;
