import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUsers, FaFileAlt, FaSpinner, FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './AnketDetay.css';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function AnketDetay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sonuclar, setSonuclar] = useState(null);
  const [aiAnaliz, setAiAnaliz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analizYukleniyor, setAnalizYukleniyor] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('statistics'); // 'statistics' veya 'responses'

  useEffect(() => {
    loadSonuclar();
    loadAiAnaliz();
  }, [id]);

  const loadAiAnaliz = async () => {
    try {
      setAnalizYukleniyor(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
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
          console.log('🤖 AI Analiz:', result.data.analiz);
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

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const url = `${apiUrl}/api/surveys/${id}/results`;
      
      const response = await fetch(url, {
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
        console.log('📊 Yüklenen Sonuçlar:', result.data);
        console.log('📈 İstatistikler:', result.data.istatistikler);
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

  if (loading) {
    return (
      <div className="results-loading">
        <FaSpinner className="fa-spin" />
        <p>Sonuçlar yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-error">
        <div className="error-icon">⚠️</div>
        <h2>Hata Oluştu</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/anket-sonuclari')} className="btn-back">
          <FaArrowLeft /> Sonuçlara Dön
        </button>
      </div>
    );
  }

  if (!sonuclar) return null;

  const { anket, istatistikler } = sonuclar;

  return (
    <div className="detay-container">
      {/* Header */}
      <div className="detay-header">
        <button onClick={() => navigate('/anket-sonuclari')} className="btn-back">
          <FaArrowLeft /> Geri Dön
        </button>
        
        <div className="detay-header-content">
          <h1>{anket.anketBaslik}</h1>
          {anket.anketAciklama && <p className="detay-description">{anket.anketAciklama}</p>}
          
          <div className="detay-header-stats">
            <div className="stat-item">
              <FaFileAlt className="stat-icon" />
              <div>
                <div className="stat-number">{anket.sorular?.length || 0}</div>
                <div className="stat-label">Soru</div>
              </div>
            </div>
            <div className="stat-item">
              <FaUsers className="stat-icon" />
              <div>
                <div className="stat-number">{istatistikler.toplamKatilimci}</div>
                <div className="stat-label">Cevap</div>
              </div>
            </div>
            <div className="stat-item">
              <FaCalendarAlt className="stat-icon" />
              <div>
                <div className="stat-number">{new Date(anket.olusturulmaTarihi).toLocaleDateString('tr-TR')}</div>
                <div className="stat-label">Oluşturma</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Analiz Kartı */}
      {analizYukleniyor ? (
        <div className="ai-analiz-loading">
          <FaSpinner className="spinner" /> AI Analizi Yapılıyor...
        </div>
      ) : aiAnaliz ? (
        <div className="ai-analiz-kart">
          <h2>🤖 AI Değerlendirmesi</h2>
          
          <div className="ai-analiz-grid">
            <div className="ai-section">
              <div className="ai-label">Genel Duygu</div>
              <div className={`ai-sentiment-badge ${aiAnaliz?.duygu || 'nötr'}`}>
                {aiAnaliz?.duygu === 'pozitif' && '😊 Pozitif'}
                {aiAnaliz?.duygu === 'negatif' && '😞 Negatif'}
                {(!aiAnaliz?.duygu || aiAnaliz?.duygu === 'nötr') && '😐 Nötr'}
              </div>
            </div>

            <div className="ai-section">
              <div className="ai-label">Genel Puan</div>
              <div className="ai-score">
                <div className="score-number">{aiAnaliz?.puan || 5}/10</div>
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{
                      width: `${(aiAnaliz?.puan || 5) * 10}%`,
                      backgroundColor: (aiAnaliz?.puan || 5) >= 7 ? '#10b981' : (aiAnaliz?.puan || 5) >= 4 ? '#f59e0b' : '#ef4444'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-section ai-summary">
            <div className="ai-label">Özet</div>
            <p>{aiAnaliz?.ozet || 'Analiz yapılamadı'}</p>
          </div>

          {aiAnaliz?.temel_tematiclar && aiAnaliz.temel_tematiclar.length > 0 && (
            <div className="ai-section">
              <div className="ai-label">Temel Temalar</div>
              <div className="ai-themes">
                {aiAnaliz.temel_tematiclar.map((tema, idx) => (
                  <span key={idx} className="ai-theme-tag">{tema}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* View Mode Tabs */}
      <div className="detay-tabs">
        <button 
          className={`tab-btn ${viewMode === 'statistics' ? 'active' : ''}`}
          onClick={() => setViewMode('statistics')}
        >
          <FaChartBar /> İstatistikler
        </button>
        <button 
          className={`tab-btn ${viewMode === 'responses' ? 'active' : ''}`}
          onClick={() => setViewMode('responses')}
        >
          <FaUsers /> Katılımcılar ({sonuclar.katilimcilar?.length || 0})
        </button>
      </div>

      {/* İstatistikler Görünümü */}
      {viewMode === 'statistics' && (
        <div className="detay-statistics">
          {istatistikler.sorular && istatistikler.sorular.map((soru, idx) => (
            <div key={idx} className="soru-istatistik">
              <div className="soru-baslik">
                <h3>Soru {idx + 1}: {soru.soruMetni}</h3>
                <span className="soru-tipi-badge">{soru.soruTipi}</span>
                <span className="cevap-sayisi">{soru.toplamCevap} cevap</span>
              </div>

              {/* Çoktan Seçmeli Sorular için Grafik */}
              {['coktan-tek', 'coktan-coklu'].includes(soru.soruTipi) && soru.dagilimArray && (
                <div className="grafik-kontainer">
                  <div className="grafik-sol">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={soru.dagilimArray.map(d => ({
                        isim: d.metin.substring(0, 30),
                        sayi: d.sayi,
                        yuzde: d.yuzde
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="isim" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => value}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar dataKey="sayi" fill="#10b981" name="Cevap Sayısı" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grafik-sag">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={soru.dagilimArray}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ metin, yuzde }) => `${metin.substring(0, 15)}: %${yuzde}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="sayi"
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
              )}

              {/* Çoktan Seçmeli Sorular için Tablo */}
              {['coktan-tek', 'coktan-coklu'].includes(soru.soruTipi) && soru.dagilimArray && (
                <div className="secenekler-tablo">
                  <table>
                    <thead>
                      <tr>
                        <th>Seçenek</th>
                        <th>Cevap Sayısı</th>
                        <th>Yüzde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soru.dagilimArray.map((secenek, sidx) => (
                        <tr key={sidx}>
                          <td>{secenek.metin}</td>
                          <td className="sayi">{secenek.sayi}</td>
                          <td>
                            <div className="yuzde-bar">
                              <div className="yuzde-dolu" style={{ width: `${secenek.yuzde}%` }}></div>
                              <span className="yuzde-text">{secenek.yuzde}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Açık Uçlu Sorular */}
              {soru.soruTipi === 'acik-uclu' && soru.cevaplar && (
                <div className="acik-uclu-cevaplar">
                  <h4>Verilen Cevaplar ({soru.cevaplar.length})</h4>
                  <div className="cevaplar-listesi">
                    {soru.cevaplar.map((cevap, cidx) => (
                      <div key={cidx} className="cevap-kutusu">
                        {cevap}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Slider Soruları */}
              {soru.soruTipi === 'slider' && soru.dagilimArray && (
                <div className="grafik-kontainer">
                  <div className="grafik-sol">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={soru.dagilimArray.map(d => ({
                        isim: `${d.sayi}`,
                        sayi_cevap: d.sayi_cevap,
                        yuzde: d.yuzde
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="isim" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="sayi_cevap" fill="#3b82f6" name="Cevap Sayısı" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grafik-sag">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={soru.dagilimArray}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ sayi, yuzde }) => `${sayi}: %${yuzde}`}
                          outerRadius={70}
                          fill="#8884d8"
                          dataKey="sayi_cevap"
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
              )}

              {/* Slider Tablosu */}
              {soru.soruTipi === 'slider' && soru.dagilimArray && (
                <div className="secenekler-tablo">
                  <table>
                    <thead>
                      <tr>
                        <th>Puan</th>
                        <th>Cevap Sayısı</th>
                        <th>Yüzde</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soru.dagilimArray.map((item, sidx) => (
                        <tr key={sidx}>
                          <td className="sayi">{item.sayi}</td>
                          <td className="sayi">{item.sayi_cevap}</td>
                          <td>
                            <div className="yuzde-bar">
                              <div className="yuzde-dolu" style={{ width: `${item.yuzde}%` }}></div>
                              <span className="yuzde-text">{item.yuzde}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Katılımcılar Görünümü */}
      {viewMode === 'responses' && (
        <div className="detay-responses">
          {sonuclar.katilimcilar && sonuclar.katilimcilar.length > 0 ? (
            <div className="katilimcilar-listesi">
              {sonuclar.katilimcilar.map((katilimci, idx) => (
                <div key={idx} className="katilimci-kart">
                  <div className="katilimci-header">
                    <h4>Katılımcı {idx + 1}</h4>
                    <span className="katilimci-tarih">
                      {new Date(katilimci.olusturulmaTarihi).toLocaleDateString('tr-TR')} 
                      {' '}
                      {new Date(katilimci.olusturulmaTarihi).toLocaleTimeString('tr-TR')}
                    </span>
                  </div>
                  
                  <div className="katilimci-cevaplar">
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
                        <div key={sidx} className="cevap-satiri">
                          <div className="cevap-soru">{soru.soruMetni}</div>
                          <div className="cevap-metin">{cevapMetni}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-responses">
              <FaUsers className="no-responses-icon" />
              <h2>Henüz Cevap Yok</h2>
              <p>Bu anket henüz cevaplandırılmamış</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AnketDetay;
