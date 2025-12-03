import React, { useState, useEffect } from 'react';
import KonumuDogrula from './KonumuDogrula';
import './AnketCoz.css';

const AnketCoz = () => {
  const pathParts = window.location.pathname.split('/').filter(p => p);
  const linkKodu = pathParts[pathParts.length - 1];

  const [anket, setAnket] = useState(null);
  const [cevaplar, setCevaplar] = useState({});
  const [katilimciBilgileri, setKatilimciBilgileri] = useState({ ad: '', soyad: '' });
  const [dogrulamaBilgileri, setDogrulamaBilgileri] = useState({});
  const [hatalar, setHatalar] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Anket verilerini çek
  useEffect(() => {
    const fetchAnket = async () => {
      if (!linkKodu) {
        setError('Geçersiz anket linki');
        setLoading(false);
        return;
      }

      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
        const response = await fetch(`${apiUrl}/api/surveys/by-link/${linkKodu}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Anket bulunamadı');
        }

        const result = await response.json();
        setAnket(result.data);

        // Cevapları initialize et
        const initialAnswers = {};
        result.data.sorular.forEach(soru => {
          initialAnswers[soru._id] = soru.soruTipi === 'coktan-coklu' ? [] : '';
        });
        setCevaplar(initialAnswers);

        // Doğrulama bilgilerini initialize et
        if (result.data.hedefKitleKriterleri) {
          const kriterler = {};
          Object.keys(result.data.hedefKitleKriterleri).forEach(key => {
            if (result.data.hedefKitleKriterleri[key]) {
              kriterler[key] = '';
            }
          });
          setDogrulamaBilgileri(kriterler);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAnket();
  }, [linkKodu]);

  // Form değişikliklerini handle et
  const handleInputChange = (field, value) => {
    setKatilimciBilgileri(prev => ({ ...prev, [field]: value }));
    if (hatalar[field]) {
      setHatalar(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleKriterChange = (field, value) => {
    setDogrulamaBilgileri(prev => ({ ...prev, [field]: value }));
    if (hatalar[field]) {
      setHatalar(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Konum doğrulama callback'i
  const handleKonumDogrulandi = (konumBilgisi) => {
    // Konum bilgisini doğrulama bilgilerine ekle
    setDogrulamaBilgileri(prev => ({
      ...prev,
      konum: konumBilgisi.tamAdres || konumBilgisi.adres
    }));
  };

  const handleAnswerChange = (soruId, value) => {
    setCevaplar(prev => ({ ...prev, [soruId]: value }));
  };

  const handleCheckboxChange = (soruId, value, checked) => {
    setCevaplar(prev => {
      const current = Array.isArray(prev[soruId]) ? prev[soruId] : [];
      if (checked) {
        return { ...prev, [soruId]: [...current, value] };
      } else {
        return { ...prev, [soruId]: current.filter(v => v !== value) };
      }
    });
  };

  // Step 1 validasyonu ve ilerleme
  const handleStep1Submit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!katilimciBilgileri.ad.trim()) {
      errors.ad = 'Ad alanı zorunludur';
    }
    if (!katilimciBilgileri.soyad.trim()) {
      errors.soyad = 'Soyad alanı zorunludur';
    }

    Object.keys(dogrulamaBilgileri).forEach(key => {
      if (key !== 'konumLat' && key !== 'konumLng' && key !== 'konumZamani') {
        if (!dogrulamaBilgileri[key].trim()) {
          errors[key] = `${key} alanı zorunludur`;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setHatalar(errors);
      return;
    }

    setCurrentStep(2);
  };

  // Anket gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Tüm soruların cevaplanıp cevaplanmadığını kontrol et
    const unanswered = anket.sorular.find(soru => {
      const answer = cevaplar[soru._id];
      if (soru.soruTipi === 'coktan-coklu') {
        return !Array.isArray(answer) || answer.length === 0;
      }
      return !answer || answer.toString().trim() === '';
    });

    if (unanswered) {
      alert('Lütfen tüm soruları cevaplayınız');
      return;
    }

    setSubmitting(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/surveys/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anketId: anket._id,
          katilimciBilgileri,
          dogrulamaBilgileri,
          cevaplar
        })
      });

      if (!response.ok) throw new Error('Gönderim başarısız');

      setSubmitted(true);
    } catch (err) {
      alert('Hata: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading durumu
  if (loading) {
    return (
      <div className="anket-coz-page">
        <div className="anket-container">
          <div className="loading-wrapper">
            <div className="spinner"></div>
            <p>Anket yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="anket-coz-page">
        <div className="anket-container">
          <div className="error-card">
            <div className="error-icon">❌</div>
            <h2>Hata</h2>
            <p>{error}</p>
            <button onClick={() => window.location.href = '/'} className="btn-primary">
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Anket bulunamadı
  if (!anket) {
    return (
      <div className="anket-coz-page">
        <div className="anket-container">
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <h2>Anket Bulunamadı</h2>
            <p>Lütfen geçerli bir anket linki kullanınız.</p>
            <button onClick={() => window.location.href = '/'} className="btn-primary">
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Başarılı gönderim
  if (submitted) {
    return (
      <div className="anket-coz-page">
        <div className="anket-container">
          <div className="success-card">
            <div className="success-icon">✓</div>
            <h1>Teşekkürler!</h1>
            <p>Anketimize katıldığınız için çok teşekkür ederiz.</p>
            <p className="success-subtitle">Cevaplarınız başarıyla kaydedilmiştir.</p>
            <button onClick={() => window.location.href = '/'} className="btn-primary full-width">
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 1: Katılımcı Bilgileri
  if (currentStep === 1) {
    return (
      <div className="anket-coz-page">
        <div className="anket-container">
          <div className="anket-wrapper">
            <div className="step-indicator">
              <span className="step-badge active">1</span>
              <span className="step-line"></span>
              <span className="step-badge">2</span>
            </div>

            <div className="section-header">
              <h1>Katılımcı Bilgileri</h1>
              <p>Lütfen bilgilerinizi doğru ve eksiksiz şekilde doldurunuz</p>
            </div>

            <form onSubmit={handleStep1Submit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ad *</label>
                  <input
                    type="text"
                    className={`form-input ${hatalar.ad ? 'error' : ''}`}
                    value={katilimciBilgileri.ad}
                    onChange={(e) => handleInputChange('ad', e.target.value)}
                    placeholder="Adınızı giriniz"
                  />
                  {hatalar.ad && <span className="error-text">{hatalar.ad}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Soyadı *</label>
                  <input
                    type="text"
                    className={`form-input ${hatalar.soyad ? 'error' : ''}`}
                    value={katilimciBilgileri.soyad}
                    onChange={(e) => handleInputChange('soyad', e.target.value)}
                    placeholder="Soyadınızı giriniz"
                  />
                  {hatalar.soyad && <span className="error-text">{hatalar.soyad}</span>}
                </div>
              </div>

              {Object.keys(dogrulamaBilgileri).length > 0 && (
                <div className="criteria-section">
                  <h3 className="criteria-title">
                    <span style={{ fontSize: '22px' }}>🔐</span> Ek Doğrulama Bilgileri
                  </h3>
                  {Object.keys(dogrulamaBilgileri).map(key => (
                    <div key={key} className="form-group">
                      {key === 'konum' ? (
                        <KonumuDogrula
                          onKonumDogrulandi={handleKonumDogrulandi}
                          hatalar={hatalar}
                          setHatalar={setHatalar}
                        />
                      ) : (
                        <>
                          <label className="form-label">{key} *</label>
                          <input
                            type="text"
                            className={`form-input ${hatalar[key] ? 'error' : ''}`}
                            value={dogrulamaBilgileri[key]}
                            onChange={(e) => handleKriterChange(key, e.target.value)}
                            placeholder={`${key} giriniz`}
                          />
                          {hatalar[key] && <span className="error-text">{hatalar[key]}</span>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary full-width">
                  Devam Et →
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Anket Soruları
  return (
    <div className="anket-coz-page">
      <div className="anket-container">
        <div className="anket-wrapper">
          <div className="step-indicator">
            <span className="step-badge completed">✓</span>
            <span className="step-line"></span>
            <span className="step-badge active">2</span>
          </div>

          <div className="section-header">
            <h1>{anket.anketBaslik}</h1>
            <p>{anket.anketAciklama}</p>
          </div>

          <form onSubmit={handleSubmit} className="form">
            <div className="sorular-container">
              {anket.sorular.map((soru, index) => {
                const secenekler = Array.isArray(soru.secenekler) ? soru.secenekler : [];

                return (
                  <div key={soru._id} className="soru-card">
                    <div className="soru-header">
                      <span className="soru-numarasi">{index + 1}</span>
                      <h3 className="soru-text">{soru.soruMetni}</h3>
                    </div>

                    <div className="soru-content">
                      {/* Radio - Tek Seçim */}
                      {soru.soruTipi === 'coktan-tek' && (
                        <div className="secenekler">
                          {secenekler.map((secenek, idx) => {
                            const text = typeof secenek === 'string' ? secenek : (secenek.metni || '');
                            const id = `${soru._id}-${idx}`;

                            return (
                              <label key={id} className="radio-wrapper">
                                <input
                                  type="radio"
                                  className="radio-input"
                                  name={soru._id}
                                  value={text}
                                  checked={cevaplar[soru._id] === text}
                                  onChange={(e) => handleAnswerChange(soru._id, e.target.value)}
                                />
                                <span className="radio-label">{text}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Checkbox - Çoklu Seçim */}
                      {soru.soruTipi === 'coktan-coklu' && (
                        <div className="secenekler">
                          {secenekler.map((secenek, idx) => {
                            const text = typeof secenek === 'string' ? secenek : (secenek.metni || '');
                            const id = `${soru._id}-${idx}`;
                            const isChecked = Array.isArray(cevaplar[soru._id]) &&
                              cevaplar[soru._id].includes(text);

                            return (
                              <label key={id} className="checkbox-wrapper">
                                <input
                                  type="checkbox"
                                  className="checkbox-input"
                                  value={text}
                                  checked={isChecked}
                                  onChange={(e) => handleCheckboxChange(soru._id, text, e.target.checked)}
                                />
                                <span className="checkbox-label">{text}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Textarea - Açık Uçlu */}
                      {soru.soruTipi === 'acik-uclu' && (
                        <textarea
                          className="textarea-input"
                          value={cevaplar[soru._id] || ''}
                          onChange={(e) => handleAnswerChange(soru._id, e.target.value)}
                          placeholder="Cevabınızı buraya yazınız..."
                          rows="4"
                        />
                      )}

                      {/* Slider - Likert Ölçeği */}
                      {soru.soruTipi === 'slider' && (
                        <div className="slider-container">
                          <div className="slider-wrapper">
                            <input
                              type="range"
                              className="slider-input"
                              min={soru.minDegeri || 0}
                              max={soru.maxDegeri || 10}
                              value={cevaplar[soru._id] || soru.minDegeri || 0}
                              onChange={(e) => handleAnswerChange(soru._id, parseInt(e.target.value))}
                            />
                            <div className="slider-labels">
                              <span className="slider-label-min">{soru.minEtiket || soru.minDegeri || 0}</span>
                              <span className="slider-value">{cevaplar[soru._id] || soru.minDegeri || 0}</span>
                              <span className="slider-label-max">{soru.maxEtiket || soru.maxDegeri || 10}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)}>
                ← Geri
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Gönderiliyor...' : 'Anketi Tamamla'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AnketCoz;