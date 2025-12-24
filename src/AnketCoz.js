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

  // Email doğrulama için yeni state'ler
  const [emailVerificationStep, setEmailVerificationStep] = useState(null); // 'email', 'code', 'verified'
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);

  // SMS doğrulama için state'ler
  const [phoneVerificationStep, setPhoneVerificationStep] = useState(null); // 'phone', 'code', 'verified'
  const [phoneCodeInput, setPhoneCodeInput] = useState('');
  const [phoneVerificationError, setPhoneVerificationError] = useState('');
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState(''); // Doğrulama için gönderilen telefon numarası

  // Kimlik doğrulama (yüz tanıma) için state'ler
  const [identityVerificationStep, setIdentityVerificationStep] = useState(null); // 'upload', 'verifying', 'verified'
  const [idCardFile, setIdCardFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [identityVerificationError, setIdentityVerificationError] = useState('');
  const [identityVerificationLoading, setIdentityVerificationLoading] = useState(false);
  const [verifiedTcNo, setVerifiedTcNo] = useState('');
  const [identityVerificationToken, setIdentityVerificationToken] = useState(null);

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
        const anketData = result.data;
        setAnket(anketData);

        // Eğer konum kriteri varsa, konum doğrulama yap
        if (anketData.hedefKitleKriterleri?.konum) {
          console.log("📍 Konum kriteri bulundu, doğrulama başlanıyor...");

          // Kullanıcının konumunu al
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords;
                console.log("📍 Kullanıcı Konumu:", { latitude, longitude });

                try {
                  // Backend'den adres bilgisini al
                  const geocodeResponse = await fetch(`${apiUrl}/api/geocode`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude, longitude })
                  });

                  const geocodeData = await geocodeResponse.json();
                  console.log("📍 Adres Bilgisi:", geocodeData);

                  // Konum doğrulama endpoint'ine gönder
                  const checkLocationResponse = await fetch(`${apiUrl}/api/surveys/check-location/${anketData._id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      latitude,
                      longitude,
                      mahalle: geocodeData.mahalle,
                      ilce: geocodeData.ilce,
                      sehir: geocodeData.sehir
                    })
                  });

                  const locationCheck = await checkLocationResponse.json();
                  console.log("📍 Konum Doğrulama Sonucu:", locationCheck);

                  if (locationCheck.passed === false) {
                    setError(`🚫 ${locationCheck.error}`);
                    setLoading(false);
                    return;
                  }

                  // Cevapları initialize et
                  const initialAnswers = {};
                  anketData.sorular.forEach(soru => {
                    initialAnswers[soru._id] = soru.soruTipi === 'coktan-coklu' ? [] : '';
                  });
                  setCevaplar(initialAnswers);

                  // Doğrulama bilgilerini initialize et
                  if (anketData.hedefKitleKriterleri) {
                    const kriterler = {};
                    if (anketData.hedefKitleKriterleri.mail === true) {
                      kriterler.mail = '';
                    }
                    if (anketData.hedefKitleKriterleri.tcNo === true) {
                      kriterler.tcNo = '';
                    }
                    if (anketData.hedefKitleKriterleri.telefonNumarasi === true) {
                      kriterler.telefonNumarasi = '0';
                    }
                    if (anketData.hedefKitleKriterleri.konum === true) {
                      kriterler.konum = '';
                    }
                    if (anketData.hedefKitleKriterleri.kimlikDogrulama === true) {
                      kriterler.kimlikDogrulama = '';
                    }
                    setDogrulamaBilgileri(kriterler);
                  }

                  setLoading(false);
                } catch (err) {
                  console.error("❌ Konum doğrulama hatası:", err);
                  setError(`Konum doğrulanırken hata oluştu: ${err.message}`);
                  setLoading(false);
                }
              },
              (err) => {
                console.error("❌ Geolocation hatası:", err);
                setError("Konumunuza erişilemiyor. Lütfen tarayıcı ayarlarından konum izni verdiğinizi kontrol ediniz.");
                setLoading(false);
              }
            );
          } else {
            setError("Tarayıcınız konum hizmetini desteklemiyor.");
            setLoading(false);
          }
        } else {
          // Konum kriteri yok, normal yükle
          const initialAnswers = {};
          anketData.sorular.forEach(soru => {
            initialAnswers[soru._id] = soru.soruTipi === 'coktan-coklu' ? [] : '';
          });
          setCevaplar(initialAnswers);

          if (anketData.hedefKitleKriterleri) {
            const kriterler = {};
            if (anketData.hedefKitleKriterleri.mail === true) {
              kriterler.mail = '';
            }
            if (anketData.hedefKitleKriterleri.tcNo === true) {
              kriterler.tcNo = '';
            }
            if (anketData.hedefKitleKriterleri.telefonNumarasi === true) {
              kriterler.telefonNumarasi = '0';
            }
            if (anketData.hedefKitleKriterleri.konum === true) {
              kriterler.konum = '';
            }
            if (anketData.hedefKitleKriterleri.kimlikDogrulama === true) {
              kriterler.kimlikDogrulama = '';
            }
            setDogrulamaBilgileri(kriterler);
          }

          setLoading(false);
        }
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
    // Sadece konum adresi ekle (tam adres string'i)
    setDogrulamaBilgileri(prev => ({
      ...prev,
      konum: konumBilgisi.tamAdres || konumBilgisi.adres || '',
      // Koordinatlar sadece backend'e gönderilmek üzere tutulacak

    }));
  };

  const handleAnswerChange = (soruId, value) => {
    setCevaplar(prev => ({ ...prev, [soruId]: value }));
  };

  // Email doğrulama kodu gönder
  const handleSendVerificationCode = async (e) => {
    e.preventDefault();
    setVerificationError('');
    setVerificationLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/verification/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: anket._id,
          contactInfo: emailInput,
          type: 'email'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Kod gönderilemedi');
      }

      setEmailVerificationStep('code');
      setVerificationError('');
    } catch (err) {
      setVerificationError(err.message);
    } finally {
      setVerificationLoading(false);
    }
  };

  // Email doğrulama kodunu kontrol et
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerificationError('');
    setVerificationLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/verification/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: anket._id,
          contactInfo: emailInput,
          code: codeInput
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Kod doğrulanamadı');
      }

      // Doğrulama başarılı
      setVerificationToken(data.verificationToken);
      setEmailVerificationStep('verified');
      setDogrulamaBilgileri(prev => ({ ...prev, mail: emailInput }));
      setVerificationError('');
    } catch (err) {
      setVerificationError(err.message);
    } finally {
      setVerificationLoading(false);
    }
  };

  // SMS doğrulama kodu gönder
  const handleSendPhoneVerificationCode = async (e) => {
    e.preventDefault();
    setPhoneVerificationError('');
    setPhoneVerificationLoading(true);

    try {
      const phoneNumber = dogrulamaBilgileri.telefonNumarasi;

      // Telefon numarası validasyonu
      if (!phoneNumber || phoneNumber.length !== 11 || !phoneNumber.startsWith('0')) {
        throw new Error('Geçerli bir telefon numarası girin (0 ile başlayan 11 haneli)');
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/verification/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: anket._id,
          contactInfo: phoneNumber,
          type: 'sms'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'SMS kodu gönderilemedi');
      }

      setVerifiedPhoneNumber(phoneNumber); // Telefon numarasını sakla
      setPhoneVerificationStep('code');
      setPhoneVerificationError('');
    } catch (err) {
      setPhoneVerificationError(err.message);
    } finally {
      setPhoneVerificationLoading(false);
    }
  };

  // SMS doğrulama kodunu kontrol et
  const handleVerifyPhoneCode = async (e) => {
    e.preventDefault();
    setPhoneVerificationError('');
    setPhoneVerificationLoading(true);

    try {
      const phoneNumber = dogrulamaBilgileri.telefonNumarasi;
      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/verification/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: anket._id,
          contactInfo: phoneNumber,
          code: phoneCodeInput
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'SMS kodu doğrulanamadı');
      }

      // Doğrulama başarılı
      setPhoneVerificationToken(data.verificationToken);
      setPhoneVerificationStep('verified');
      setPhoneVerificationError('');
    } catch (err) {
      setPhoneVerificationError(err.message);
    } finally {
      setPhoneVerificationLoading(false);
    }
  };

  // Kimlik doğrulama - yüz tanıma ile
  const handleIdentityVerification = async (e) => {
    e.preventDefault();
    setIdentityVerificationError('');
    setIdentityVerificationLoading(true);

    try {
      // Dosya kontrolü
      if (!idCardFile || !selfieFile) {
        throw new Error('Lütfen kimlik kartı fotoğrafı ve selfie seçiniz');
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';

      // FormData ile dosyaları gönder
      const formData = new FormData();
      formData.append('idCard', idCardFile);
      formData.append('selfie', selfieFile);

      const response = await fetch(`${apiUrl}/api/verification/verify-identity`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kimlik doğrulama başarısız');
      }

      // Doğrulama başarılı
      setVerifiedTcNo(data.data.tcKimlikNo);
      setIdentityVerificationToken(data.data.verificationToken);
      setIdentityVerificationStep('verified');
      setDogrulamaBilgileri(prev => ({
        ...prev,
        kimlikDogrulama: data.data.tcKimlikNo
      }));
      setIdentityVerificationError('');
    } catch (err) {
      setIdentityVerificationError(err.message);
    } finally {
      setIdentityVerificationLoading(false);
    }
  };

  // Dosya seçimi handler'ları
  const handleIdCardFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setIdCardFile(e.target.files[0]);
      setIdentityVerificationError('');
    }
  };

  const handleSelfieFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelfieFile(e.target.files[0]);
      setIdentityVerificationError('');
    }
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
      // Konum için özel kontrol (KonumuDogrula component'i handle ediyor)
      if (key === 'konum') {
        const konumValue = dogrulamaBilgileri[key];
        if (!konumValue || (typeof konumValue === 'string' && !konumValue.trim())) {
          errors[key] = 'Konumunuzu doğrulamak için butona tıklayınız';
        }
      }
      // Telefon numarası için özel kontrol
      else if (key === 'telefonNumarasi') {
        const telValue = dogrulamaBilgileri[key];
        if (!telValue || telValue.trim() === '') {
          errors[key] = 'Telefon numarası zorunludur';
        } else if (telValue.length !== 11) {
          errors[key] = 'Telefon numarası 11 hane olmalıdır (0 + 10 hane)';
        } else if (!telValue.startsWith('0')) {
          errors[key] = 'Telefon numarası 0 ile başlamalıdır';
        }
      }
      // Diğer alanlar için standart kontrol
      else {
        const fieldValue = dogrulamaBilgileri[key];
        if (!fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim())) {
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

      const submitData = {
        anketId: anket._id,
        katilimciBilgileri,
        dogrulamaBilgileri,
        cevaplar
      };

      console.log('📤 Submit etmeden önce dogrulamaBilgileri:', dogrulamaBilgileri);
      console.log('📤 Tam gönderilen veri:', submitData);

      const response = await fetch(`${apiUrl}/api/surveys/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Submit hatası:', errorData);
        throw new Error(errorData.error || 'Gönderim başarısız');
      }

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

  // STEP 1: Katılımcı Bilgileri (Email doğrulama entegre)
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
              {/* AD - SOYAD */}
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

              {/* TÜM DOĞRULAMA BİLGİLERİ - TEK BÜTÜNLEŞİK KART */}
              {(anket.hedefKitleKriterleri?.mail === true ||
                anket.hedefKitleKriterleri?.telefonNumarasi === true ||
                Object.keys(dogrulamaBilgileri).filter(k => k !== 'mail' && k !== 'telefonNumarasi').length > 0) && (
                  <div className="ek-dogrulama-wrapper-card">
                    {/* Kart Başlığı */}
                    <div className="ek-dogrulama-header">
                      <span className="ek-dogrulama-icon">🔐</span>
                      <div className="ek-dogrulama-title">
                        <h3>Doğrulama Bilgileri</h3>
                        <p>Ankete katılım için aşağıdaki doğrulamaları tamamlayınız</p>
                      </div>
                    </div>

                    {/* Doğrulama Bölümleri */}
                    <div className="ek-dogrulama-content">

                      {/* EMAIL DOĞRULAMA */}
                      {anket.hedefKitleKriterleri?.mail === true && (
                        <>
                          <div className="dogrulama-item email-item">
                            <div className="dogrulama-item-header">
                              <span className="dogrulama-item-icon">📧</span>
                              <div className="dogrulama-item-title">
                                <h4>E-posta Doğrulama</h4>
                                <p>E-posta adresinizi doğrulayın</p>
                              </div>
                            </div>
                            <div className="dogrulama-item-content">
                              {emailVerificationStep === null && (
                                <div className="verification-form-inline">
                                  <div className="email-input-group">
                                    <input
                                      type="email"
                                      value={emailInput}
                                      onChange={(e) => {
                                        setEmailInput(e.target.value);
                                        setVerificationError('');
                                      }}
                                      placeholder="Örn: ad@trakya.edu.tr"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleSendVerificationCode}
                                      disabled={verificationLoading}
                                      className="btn-send-code"
                                    >
                                      {verificationLoading ? '⏳ Gönderiliyor...' : '✓ Kod Gönder'}
                                    </button>
                                  </div>
                                  {verificationError && (
                                    <div className="error-message">⚠️ {verificationError}</div>
                                  )}
                                </div>
                              )}

                              {emailVerificationStep === 'code' && (
                                <div className="verification-form-inline">
                                  <div className="verification-info">
                                    <p>✓ Kod <strong>{emailInput}</strong> adresine gönderildi</p>
                                  </div>
                                  <div className="code-input-group">
                                    <input
                                      type="text"
                                      value={codeInput}
                                      onChange={(e) => {
                                        setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                                        setVerificationError('');
                                      }}
                                      placeholder="000000"
                                      maxLength="6"
                                      style={{ letterSpacing: '2px', fontSize: '1.1rem', textAlign: 'center' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={handleVerifyCode}
                                      disabled={verificationLoading || codeInput.length !== 6}
                                      className="btn-verify-code"
                                    >
                                      {verificationLoading ? '⏳' : '✓ Doğrula'}
                                    </button>
                                  </div>
                                  {verificationError && (
                                    <div className="error-message">⚠️ {verificationError}</div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEmailVerificationStep(null);
                                      setCodeInput('');
                                      setVerificationError('');
                                    }}
                                    className="btn-back-email"
                                  >
                                    ← Geri
                                  </button>
                                </div>
                              )}

                              {emailVerificationStep === 'verified' && (
                                <div className="verification-success">
                                  <span className="success-badge">✅ Doğrulandı</span>
                                  <span className="verified-info">{emailInput}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="dogrulama-separator"></div>
                        </>
                      )}

                      {/* TELEFON DOĞRULAMA */}
                      {anket.hedefKitleKriterleri?.telefonNumarasi === true && (
                        <>
                          <div className="dogrulama-item phone-item">
                            <div className="dogrulama-item-header">
                              <span className="dogrulama-item-icon">📱</span>
                              <div className="dogrulama-item-title">
                                <h4>Telefon Doğrulama</h4>
                                <p>Telefon numaranızı SMS ile doğrulayın</p>
                              </div>
                            </div>
                            <div className="dogrulama-item-content">
                              {phoneVerificationStep === null && (
                                <div className="verification-form-inline">
                                  <div className="phone-input-group">
                                    <span className="phone-prefix">0</span>
                                    <input
                                      type="tel"
                                      value={dogrulamaBilgileri.telefonNumarasi?.replace(/^0/, '') || ''}
                                      onChange={(e) => {
                                        let value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        handleKriterChange('telefonNumarasi', '0' + value);
                                        setPhoneVerificationError('');
                                      }}
                                      placeholder="5XX XXX XX XX"
                                      maxLength="10"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleSendPhoneVerificationCode}
                                      disabled={phoneVerificationLoading || !dogrulamaBilgileri.telefonNumarasi || dogrulamaBilgileri.telefonNumarasi.length !== 11}
                                      className="btn-send-code"
                                    >
                                      {phoneVerificationLoading ? '⏳ Gönderiliyor...' : '✓ Kod Gönder'}
                                    </button>
                                  </div>
                                  {phoneVerificationError && (
                                    <div className="error-message">⚠️ {phoneVerificationError}</div>
                                  )}
                                </div>
                              )}

                              {phoneVerificationStep === 'code' && (
                                <div className="verification-form-inline">
                                  <div className="verification-info">
                                    <p>✓ SMS kodu <strong>{verifiedPhoneNumber}</strong> numarasına gönderildi</p>
                                  </div>
                                  <div className="code-input-group">
                                    <input
                                      type="text"
                                      value={phoneCodeInput}
                                      onChange={(e) => {
                                        setPhoneCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6));
                                        setPhoneVerificationError('');
                                      }}
                                      placeholder="000000"
                                      maxLength="6"
                                      style={{ letterSpacing: '2px', fontSize: '1.1rem', textAlign: 'center' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={handleVerifyPhoneCode}
                                      disabled={phoneVerificationLoading || phoneCodeInput.length !== 6}
                                      className="btn-verify-code"
                                    >
                                      {phoneVerificationLoading ? '⏳' : '✓ Doğrula'}
                                    </button>
                                  </div>
                                  {phoneVerificationError && (
                                    <div className="error-message">⚠️ {phoneVerificationError}</div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPhoneVerificationStep(null);
                                      setPhoneCodeInput('');
                                      setPhoneVerificationError('');
                                    }}
                                    className="btn-back-email"
                                  >
                                    ← Geri
                                  </button>
                                </div>
                              )}

                              {phoneVerificationStep === 'verified' && (
                                <div className="verification-success">
                                  <span className="success-badge">✅ Doğrulandı</span>
                                  <span className="verified-info">{verifiedPhoneNumber}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {Object.keys(dogrulamaBilgileri).filter(k => k !== 'mail' && k !== 'telefonNumarasi').length > 0 && (
                            <div className="dogrulama-separator"></div>
                          )}
                        </>
                      )}

                      {/* DİĞER KRİTERLER: Konum, Kimlik, TC vb. */}
                      {Object.keys(dogrulamaBilgileri).map((key, index, arr) => {
                        if (key === 'mail' || key === 'telefonNumarasi') return null;

                        const validKeys = arr.filter(k => k !== 'mail' && k !== 'telefonNumarasi');
                        const isLast = validKeys.indexOf(key) === validKeys.length - 1;

                        return (
                          <div key={key} className="ek-dogrulama-section">
                            {/* KONUM DOĞRULAMA */}
                            {key === 'konum' && (
                              <div className="dogrulama-item konum-item">
                                <div className="dogrulama-item-header">
                                  <span className="dogrulama-item-icon">📍</span>
                                  <div className="dogrulama-item-title">
                                    <h4>Konum Doğrulama</h4>
                                    <p>Konumunuzu doğrulayarak devam edin</p>
                                  </div>
                                </div>
                                <div className="dogrulama-item-content">
                                  <KonumuDogrula onKonumDogrulandi={handleKonumDogrulandi} />
                                  {hatalar.konum && <span className="error-text">{hatalar.konum}</span>}
                                </div>
                              </div>
                            )}

                            {/* KİMLİK DOĞRULAMA */}
                            {key === 'kimlikDogrulama' && (
                              <div className="dogrulama-item kimlik-item">
                                <div className="dogrulama-item-header">
                                  <span className="dogrulama-item-icon">🆔</span>
                                  <div className="dogrulama-item-title">
                                    <h4>Kimlik Doğrulama</h4>
                                    <p>Kimlik kartınız ve selfie ile doğrulama yapın</p>
                                  </div>
                                </div>
                                <div className="dogrulama-item-content">
                                  {identityVerificationStep !== 'verified' ? (
                                    <div className="kimlik-upload-area">
                                      <div className="upload-row">
                                        <div className="upload-field">
                                          <label>📄 Kimlik Kartı Fotoğrafı *</label>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleIdCardFileChange}
                                            className="file-input"
                                          />
                                          {idCardFile && (
                                            <span className="file-selected">✓ {idCardFile.name}</span>
                                          )}
                                        </div>
                                        <div className="upload-field">
                                          <label>🤳 Selfie Fotoğrafı *</label>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleSelfieFileChange}
                                            className="file-input selfie"
                                          />
                                          {selfieFile && (
                                            <span className="file-selected">✓ {selfieFile.name}</span>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={handleIdentityVerification}
                                        disabled={identityVerificationLoading || !idCardFile || !selfieFile}
                                        className="btn-verify-identity"
                                      >
                                        {identityVerificationLoading ? '⏳ Doğrulanıyor...' : '🔍 Kimliği Doğrula'}
                                      </button>
                                      {identityVerificationError && (
                                        <div className="error-message">⚠️ {identityVerificationError}</div>
                                      )}
                                      <p className="security-note">🔒 Verileriniz güvenli şekilde işlenir</p>
                                    </div>
                                  ) : (
                                    <div className="verification-success">
                                      <span className="success-badge">✅ Kimlik Doğrulandı</span>
                                      <span className="verified-info">TC: {verifiedTcNo}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* TC KİMLİK NO */}
                            {key === 'tcNo' && (
                              <div className="dogrulama-item tc-item">
                                <div className="dogrulama-item-header">
                                  <span className="dogrulama-item-icon">🆔</span>
                                  <div className="dogrulama-item-title">
                                    <h4>T.C. Kimlik No</h4>
                                    <p>11 haneli kimlik numaranızı girin</p>
                                  </div>
                                </div>
                                <div className="dogrulama-item-content">
                                  <input
                                    type="text"
                                    className={`form-input tc-input ${hatalar.tcNo ? 'error' : ''}`}
                                    value={dogrulamaBilgileri.tcNo}
                                    onChange={(e) => handleKriterChange('tcNo', e.target.value)}
                                    placeholder="T.C. kimlik numaranızı giriniz"
                                    maxLength="11"
                                  />
                                  {hatalar.tcNo && <span className="error-text">{hatalar.tcNo}</span>}
                                </div>
                              </div>
                            )}

                            {/* Diğer Kriterler */}
                            {!['konum', 'kimlikDogrulama', 'tcNo'].includes(key) && (
                              <div className="dogrulama-item other-item">
                                <div className="dogrulama-item-header">
                                  <span className="dogrulama-item-icon">📋</span>
                                  <div className="dogrulama-item-title">
                                    <h4>{key}</h4>
                                  </div>
                                </div>
                                <div className="dogrulama-item-content">
                                  <input
                                    type="text"
                                    className={`form-input ${hatalar[key] ? 'error' : ''}`}
                                    value={dogrulamaBilgileri[key]}
                                    onChange={(e) => handleKriterChange(key, e.target.value)}
                                    placeholder={`${key} giriniz`}
                                  />
                                  {hatalar[key] && <span className="error-text">{hatalar[key]}</span>}
                                </div>
                              </div>
                            )}

                            {!isLast && <div className="dogrulama-separator"></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    (anket.hedefKitleKriterleri?.mail === true && emailVerificationStep !== 'verified') ||
                    (anket.hedefKitleKriterleri?.telefonNumarasi === true && phoneVerificationStep !== 'verified') ||
                    (anket.hedefKitleKriterleri?.kimlikDogrulama === true && identityVerificationStep !== 'verified')
                  }
                >
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