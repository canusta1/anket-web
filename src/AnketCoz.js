import React, { useState, useEffect } from 'react';
import './AnketCoz.css';

const AnketCoz = () => {
  // URL'den linkKodu'nu al
  const linkKodu = window.location.pathname.split('/').pop();

  const [anket, setAnket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Katılımcı Bilgileri, 2: Sorular, 3: Başarı

  // Katılımcı bilgileri
  const [katilimciBilgileri, setKatilimciBilgileri] = useState({
    ad: '',
    soyad: ''
  });

  // Doğrulama bilgileri (hedefKitleKriterleri için)
  const [dogrulamaBilgileri, setDogrulamaBilgileri] = useState({});
  const [dogrulamaHatalari, setDogrulamaHatalari] = useState({});

  // Sorulara verilen cevaplar
  const [cevaplar, setCevaplar] = useState({});
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // Anketi linke göre getir
  useEffect(() => {
    // Eğer linkKodu yoksa hata sayfasına git
    if (!linkKodu) {
      setError('Geçersiz anket linki');
      setLoading(false);
      return;
    }

    const anketiGetir = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:4000/api/surveys/by-link/${linkKodu}`
        );

        if (!response.ok) {
          throw new Error('Anket bulunamadı veya süresi dolmuş');
        }

        const result = await response.json();
        setAnket(result.data);

        // Cevapları başlat
        const initialCevaplar = {};
        result.data.sorular.forEach((soru) => {
          initialCevaplar[soru._id] = '';
        });
        setCevaplar(initialCevaplar);

        // Doğrulama bilgilerini başlat
        if (result.data.hedefKitleKriterleri) {
          const dogrulama = {};
          Object.keys(result.data.hedefKitleKriterleri).forEach((kriter) => {
            if (result.data.hedefKitleKriterleri[kriter]) {
              dogrulama[kriter] = '';
            }
          });
          setDogrulamaBilgileri(dogrulama);
        }
      } catch (err) {
        setError(err.message || 'Anket yüklenirken hata oluştu');
        console.error('Hata:', err);
      } finally {
        setLoading(false);
      }
    };

    anketiGetir();
  }, [linkKodu]); // SADECE linkKodu dependency olarak kal

  // Katılımcı bilgileri değişim
  const handleKatilimciChange = (e) => {
    const { name, value } = e.target;
    setKatilimciBilgileri((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Doğrulama bilgileri değişim
  const handleDogrulamaChange = (e) => {
    const { name, value } = e.target;
    setDogrulamaBilgileri((prev) => ({
      ...prev,
      [name]: value
    }));
    // Hata temizle
    if (dogrulamaHatalari[name]) {
      setDogrulamaHatalari((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Cevap değişim
  const handleCevapChange = (soruId, cevap) => {
    setCevaplar((prev) => ({
      ...prev,
      [soruId]: cevap
    }));
  };

  // Katılımcı bilgileri doğrulaması
  const handleDogrulamaSubmit = (e) => {
    e.preventDefault();

    const yeniHatalar = {};

    // Ad ve soyad kontrolü
    if (!katilimciBilgileri.ad.trim()) {
      yeniHatalar.ad = 'Ad boş geçilemez';
    }
    if (!katilimciBilgileri.soyad.trim()) {
      yeniHatalar.soyad = 'Soyadı boş geçilemez';
    }

    // Doğrulama bilgileri kontrolü
    Object.keys(dogrulamaBilgileri).forEach((kriter) => {
      if (!dogrulamaBilgileri[kriter].trim()) {
        yeniHatalar[kriter] = `${kriter} boş geçilemez`;
      }
    });

    if (Object.keys(yeniHatalar).length > 0) {
      setDogrulamaHatalari(yeniHatalar);
      return;
    }

    // Doğrulama başarılı, sorulara geç
    setStep(2);
  };

  // Anket gönderme
  const handleAnketSubmit = async (e) => {
    e.preventDefault();

    // Tüm soruların cevaplandığını kontrol et
    const tümCevaplandiMi = anket.sorular.every(
      (soru) => cevaplar[soru._id] && cevaplar[soru._id].toString().trim() !== ''
    );

    if (!tümCevaplandiMi) {
      alert('Lütfen tüm soruları cevaplayınız');
      return;
    }

    try {
      setGonderiliyor(true);

      const response = await fetch('http://localhost:3001/api/surveys/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          anketId: anket._id,
          cevaplar,
          katilimciBilgileri: {
            ...katilimciBilgileri,
            ...dogrulamaBilgileri
          }
        })
      });

      if (!response.ok) {
        throw new Error('Cevaplar gönderilirken hata oluştu');
      }

      setStep(3);
    } catch (err) {
      alert('Hata: ' + err.message);
      console.error('Hata:', err);
    } finally {
      setGonderiliyor(false);
    }
  };

  // Yükleniyor durumu
  if (loading) {
    return (
      <div className="anket-container">
        <div className="loading-wrapper">
          <div className="spinner"></div>
          <p>Anket yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="anket-container">
        <div className="error-card">
          <div className="error-icon">❌</div>
          <h2>Hata</h2>
          <p>{error}</p>
          <button onClick={() => (window.location.href = '/')} className="btn-primary">
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Katılımcı Doğrulaması
  if (step === 1) {
    return (
      <div className="anket-container">
        <div className="anket-card">
          <div className="step-indicator">
            <div className="step-badge active">1</div>
            <div className="step-line"></div>
            <div className="step-badge">2</div>
          </div>

          <div className="card-header">
            <h1>Katılımcı Bilgileri</h1>
            <p>Lütfen bilgilerinizi doğru ve eksiksiz şekilde doldurunuz</p>
          </div>

          <form onSubmit={handleDogrulamaSubmit} className="form">
            {/* Ad Soyad */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Ad *</label>
                <input
                  type="text"
                  name="ad"
                  value={katilimciBilgileri.ad}
                  onChange={handleKatilimciChange}
                  placeholder="Adınızı giriniz"
                  className={`form-input ${dogrulamaHatalari.ad ? 'error' : ''}`}
                />
                {dogrulamaHatalari.ad && (
                  <span className="error-text">{dogrulamaHatalari.ad}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Soyadı *</label>
                <input
                  type="text"
                  name="soyad"
                  value={katilimciBilgileri.soyad}
                  onChange={handleKatilimciChange}
                  placeholder="Soyadınızı giriniz"
                  className={`form-input ${dogrulamaHatalari.soyad ? 'error' : ''}`}
                />
                {dogrulamaHatalari.soyad && (
                  <span className="error-text">{dogrulamaHatalari.soyad}</span>
                )}
              </div>
            </div>

            {/* Doğrulama Kriterleri */}
            {Object.keys(dogrulamaBilgileri).length > 0 && (
              <div className="criteria-section">
                <h3 className="criteria-title">Ek Bilgiler</h3>
                {Object.keys(dogrulamaBilgileri).map((kriter) => (
                  <div key={kriter} className="form-group">
                    <label className="form-label">{kriter} *</label>
                    <input
                      type="text"
                      name={kriter}
                      value={dogrulamaBilgileri[kriter]}
                      onChange={handleDogrulamaChange}
                      placeholder={`${kriter} giriniz`}
                      className={`form-input ${dogrulamaHatalari[kriter] ? 'error' : ''
                        }`}
                    />
                    {dogrulamaHatalari[kriter] && (
                      <span className="error-text">
                        {dogrulamaHatalari[kriter]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="btn-primary full-width">
              Devam Et →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Sorular
  if (step === 2) {
    return (
      <div className="anket-container">
        <div className="anket-card">
          <div className="step-indicator">
            <div className="step-badge completed">✓</div>
            <div className="step-line"></div>
            <div className="step-badge active">2</div>
          </div>

          <div className="card-header">
            <h1>{anket.anketBaslik}</h1>
            <p>{anket.anketAciklama}</p>
          </div>

          <form onSubmit={handleAnketSubmit} className="form">
            <div className="sorular-container">
              {anket.sorular.map((soru, index) => (
                <div key={soru._id} className="soru-card">
                  <div className="soru-header">
                    <span className="soru-numarasi">{index + 1}</span>
                    <h3 className="soru-text">{soru.soruMetni}</h3>
                  </div>

                  <div className="soru-content">
                    {soru.soruTipi === 'çoktan-seçmeli' ? (
                      <div className="secenekler">
                        {soru.secenekler.map((secenek) => (
                          <label key={secenek._id} className="radio-wrapper">
                            <input
                              type="radio"
                              name={soru._id}
                              value={secenek.metni}
                              checked={cevaplar[soru._id] === secenek.metni}
                              onChange={(e) =>
                                handleCevapChange(soru._id, e.target.value)
                              }
                              className="radio-input"
                            />
                            <span className="radio-label">{secenek.metni}</span>
                          </label>
                        ))}
                      </div>
                    ) : soru.soruTipi === 'çok-seçmeli' ? (
                      <div className="secenekler">
                        {soru.secenekler.map((secenek) => (
                          <label key={secenek._id} className="checkbox-wrapper">
                            <input
                              type="checkbox"
                              value={secenek.metni}
                              checked={
                                Array.isArray(cevaplar[soru._id])
                                  ? cevaplar[soru._id].includes(secenek.metni)
                                  : false
                              }
                              onChange={(e) => {
                                const mevcut = Array.isArray(cevaplar[soru._id])
                                  ? cevaplar[soru._id]
                                  : [];
                                if (e.target.checked) {
                                  handleCevapChange(soru._id, [
                                    ...mevcut,
                                    secenek.metni
                                  ]);
                                } else {
                                  handleCevapChange(
                                    soru._id,
                                    mevcut.filter((c) => c !== secenek.metni)
                                  );
                                }
                              }}
                              className="checkbox-input"
                            />
                            <span className="checkbox-label">
                              {secenek.metni}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        value={cevaplar[soru._id] || ''}
                        onChange={(e) =>
                          handleCevapChange(soru._id, e.target.value)
                        }
                        placeholder="Cevabınızı buraya yazınız..."
                        className="textarea-input"
                        rows="4"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(1)}
              >
                ← Geri
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={gonderiliyor}
              >
                {gonderiliyor ? 'Gönderiliyor...' : 'Anketi Tamamla'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Başarı
  if (step === 3) {
    return (
      <div className="anket-container">
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h1>Teşekkürler!</h1>
          <p>Anketimize katıldığınız için çok teşekkür ederiz.</p>
          <p className="success-subtitle">
            Cevaplarınız başarıyla kaydedilmiştir.
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className="btn-primary"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }
};

export default AnketCoz;