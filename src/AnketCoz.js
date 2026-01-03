import React, { useState, useEffect } from 'react';
import KonumuDogrula from './KonumuDogrula';
import './AnketCoz.css';
import {
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard,
  FaCheck, FaExclamationTriangle, FaArrowRight, FaArrowLeft,
  FaCamera, FaPaperPlane, FaLock, FaShieldAlt, FaSpinner, FaPortrait, FaAddressCard
} from 'react-icons/fa';

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

  // Email doğrulama state'leri
  const [emailVerificationStep, setEmailVerificationStep] = useState(null);
  const [emailInput, setEmailInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);

  // SMS doğrulama state'leri
  const [phoneVerificationStep, setPhoneVerificationStep] = useState(null);
  const [phoneCodeInput, setPhoneCodeInput] = useState('');
  const [phoneVerificationError, setPhoneVerificationError] = useState('');
  const [phoneVerificationLoading, setPhoneVerificationLoading] = useState(false);
  const [phoneVerificationToken, setPhoneVerificationToken] = useState(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState('');

  // Kimlik doğrulama state'leri
  const [identityVerificationStep, setIdentityVerificationStep] = useState(null);
  const [idCardFile, setIdCardFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [identityVerificationError, setIdentityVerificationError] = useState('');
  const [identityVerificationLoading, setIdentityVerificationLoading] = useState(false);
  const [verifiedTcNo, setVerifiedTcNo] = useState('');
  const [identityVerificationToken, setIdentityVerificationToken] = useState(null);

  // TC OCR doğrulama state'leri
  const [tcVerificationStep, setTcVerificationStep] = useState(null);
  const [tcIdCardFile, setTcIdCardFile] = useState(null);
  const [tcVerificationError, setTcVerificationError] = useState('');
  const [tcVerificationLoading, setTcVerificationLoading] = useState(false);
  const [tcVerificationToken, setTcVerificationToken] = useState(null);
  const [verifiedTcNoOcr, setVerifiedTcNoOcr] = useState('');

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

        if (anketData.hedefKitleKriterleri?.konum) {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                  const geocodeResponse = await fetch(`${apiUrl}/api/geocode`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude, longitude })
                  });
                  const geocodeData = await geocodeResponse.json();

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
                  if (locationCheck.passed === false) {
                    setError(`🚫 ${locationCheck.error}`);
                    setLoading(false);
                    return;
                  }

                  const initialAnswers = {};
                  anketData.sorular.forEach(soru => {
                    initialAnswers[soru._id] = soru.soruTipi === 'coktan-coklu' ? [] : '';
                  });
                  setCevaplar(initialAnswers);
                  initializeDogrulama(anketData);
                  setLoading(false);
                } catch (err) {
                  setError(`Konum doğrulanırken hata oluştu: ${err.message}`);
                  setLoading(false);
                }
              },
              (err) => {
                setError("Konum izni gerekli.");
                setLoading(false);
              }
            );
          } else {
            setError("Tarayıcınız konum hizmetini desteklemiyor.");
            setLoading(false);
          }
        } else {
          const initialAnswers = {};
          anketData.sorular.forEach(soru => {
            initialAnswers[soru._id] = soru.soruTipi === 'coktan-coklu' ? [] : '';
          });
          setCevaplar(initialAnswers);
          initializeDogrulama(anketData);
          setLoading(false);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAnket();
  }, [linkKodu]);

  const initializeDogrulama = (anketData) => {
    if (anketData.hedefKitleKriterleri) {
      const kriterler = {};
      if (anketData.hedefKitleKriterleri.mail === true) kriterler.mail = '';
      if (anketData.hedefKitleKriterleri.tcNo === true) kriterler.tcNo = '';
      if (anketData.hedefKitleKriterleri.telefonNumarasi === true) kriterler.telefonNumarasi = '0';
      if (anketData.hedefKitleKriterleri.konum === true) kriterler.konum = '';
      if (anketData.hedefKitleKriterleri.kimlikDogrulama === true) kriterler.kimlikDogrulama = '';
      setDogrulamaBilgileri(kriterler);
    }
  };

  const handleInputChange = (field, value) => {
    setKatilimciBilgileri(prev => ({ ...prev, [field]: value }));
    if (hatalar[field]) setHatalar(prev => ({ ...prev, [field]: '' }));
  };

  const handleKriterChange = (field, value) => {
    setDogrulamaBilgileri(prev => ({ ...prev, [field]: value }));
    if (hatalar[field]) setHatalar(prev => ({ ...prev, [field]: '' }));
  };

  const handleKonumDogrulandi = (konumBilgisi) => {
    setDogrulamaBilgileri(prev => ({
      ...prev,
      konum: konumBilgisi.tamAdres || konumBilgisi.adres || ''
    }));
  };

  const handleAnswerChange = (soruId, value) => setCevaplar(prev => ({ ...prev, [soruId]: value }));

  const handleSendVerificationCode = async (e) => {
    e.preventDefault();
    setVerificationLoading(true);
    setVerificationError('');

    // Mail uzantısı kontrolü
    const gecerliUzanti = anket.hedefKitleKriterleri?.mailUzantisi;
    if (gecerliUzanti) {
      const emailDomain = emailInput.split('@')[1];
      if (!emailDomain || emailDomain.toLowerCase() !== gecerliUzanti.toLowerCase()) {
        setVerificationError(`❌ Geçersiz e-posta uzantısı! Bu ankete sadece "@${gecerliUzanti}" uzantılı e-postalar ile katılabilirsiniz. Girdiğiniz: ${emailDomain ? '@' + emailDomain : '(uzantı yok)'}`);
        setVerificationLoading(false);
        return;
      }
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/verification/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: anket._id, contactInfo: emailInput, type: 'email' })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Doğrulama kodu gönderilemedi. Lütfen e-posta adresinizi kontrol edin.');
      }
      setEmailVerificationStep('code');
      setVerificationError('');
    } catch (err) {
      setVerificationError(err.message);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerificationLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/verification/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: anket._id, contactInfo: emailInput, code: codeInput })
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Geçersiz kod');
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

  const handleSendPhoneVerificationCode = async (e) => {
    e.preventDefault();
    setPhoneVerificationLoading(true);
    try {
      const phoneNumber = dogrulamaBilgileri.telefonNumarasi;
      if (!phoneNumber || phoneNumber.length !== 11 || !phoneNumber.startsWith('0')) throw new Error('Geçersiz numara');

      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/verification/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: anket._id, contactInfo: phoneNumber, type: 'sms' })
      });
      if (!response.ok) throw new Error('SMS gönderilemedi');

      setVerifiedPhoneNumber(phoneNumber);
      setPhoneVerificationStep('code');
      setPhoneVerificationError('');
    } catch (err) {
      setPhoneVerificationError(err.message);
    } finally {
      setPhoneVerificationLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e) => {
    e.preventDefault();
    setPhoneVerificationLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/verification/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: anket._id, contactInfo: dogrulamaBilgileri.telefonNumarasi, code: phoneCodeInput })
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Geçersiz kod');

      setPhoneVerificationToken(data.verificationToken);
      setPhoneVerificationStep('verified');
      setPhoneVerificationError('');
    } catch (err) {
      setPhoneVerificationError(err.message);
    } finally {
      setPhoneVerificationLoading(false);
    }
  };

  const handleIdentityVerification = async (e) => {
    e.preventDefault();
    setIdentityVerificationLoading(true);
    setIdentityVerificationError('');

    console.log('🔍 Kimlik doğrulama başlatılıyor...');
    console.log('📁 Kimlik dosyası:', idCardFile?.name, idCardFile?.size, 'bytes');
    console.log('📁 Selfie dosyası:', selfieFile?.name, selfieFile?.size, 'bytes');

    try {
      const formData = new FormData();
      formData.append('idCard', idCardFile);
      formData.append('selfie', selfieFile);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const requestUrl = `${apiUrl}/api/verification/verify-identity`;

      console.log('🌐 API URL:', requestUrl);
      console.log('📤 Request gönderiliyor...');

      const response = await fetch(requestUrl, {
        method: 'POST',
        body: formData
      });

      console.log('📥 Response alındı:', response.status, response.statusText);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Doğrulama başarısız`);
      }

      setVerifiedTcNo(data.data.tcKimlikNo);
      setIdentityVerificationToken(data.data.verificationToken);
      setIdentityVerificationStep('verified');
      setDogrulamaBilgileri(prev => ({ ...prev, kimlikDogrulama: data.data.tcKimlikNo }));
      console.log('✅ Kimlik doğrulama başarılı!');
    } catch (err) {
      console.error('❌ Kimlik doğrulama hatası:', err);
      console.error('Hata detayı:', err.message);
      setIdentityVerificationError(err.message || 'Bağlantı hatası - Backend erişilemiyor');
    } finally {
      setIdentityVerificationLoading(false);
    }
  };

  const handleTcOcrVerification = async (e) => {
    e.preventDefault();
    setTcVerificationLoading(true);
    setTcVerificationError('');

    console.log('🔍 TC Kimlik doğrulama başlatılıyor...');
    console.log('📝 TC No:', dogrulamaBilgileri.tcNo);
    console.log('📁 Kimlik dosyası:', tcIdCardFile?.name, tcIdCardFile?.size, 'bytes');

    try {
      if (!dogrulamaBilgileri.tcNo || dogrulamaBilgileri.tcNo.length !== 11) {
        throw new Error('11 haneli geçerli TC Kimlik No giriniz');
      }

      if (!tcIdCardFile) {
        throw new Error('Kimlik kartı fotoğrafı yükleyiniz');
      }

      const formData = new FormData();
      formData.append('tcNo', dogrulamaBilgileri.tcNo);
      formData.append('idCard', tcIdCardFile);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const requestUrl = `${apiUrl}/api/verification/verify-tc-ocr`;

      console.log('🌐 API URL:', requestUrl);
      console.log('📤 Request gönderiliyor...');

      const response = await fetch(requestUrl, {
        method: 'POST',
        body: formData
      });

      console.log('📥 Response alındı:', response.status, response.statusText);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Doğrulama başarısız`);
      }

      setVerifiedTcNoOcr(data.data.tcKimlikNo);
      setTcVerificationToken(data.data.verificationToken);
      setTcVerificationStep('verified');
      console.log('✅ TC Kimlik doğrulama başarılı!');
    } catch (err) {
      console.error('❌ TC doğrulama hatası:', err);
      console.error('Hata detayı:', err.message);
      setTcVerificationError(err.message || 'Bağlantı hatası - Backend erişilemiyor');
    } finally {
      setTcVerificationLoading(false);
    }
  };

  const handleCheckboxChange = (soruId, value, checked) => {
    setCevaplar(prev => {
      const current = Array.isArray(prev[soruId]) ? prev[soruId] : [];
      return checked ? { ...prev, [soruId]: [...current, value] } : { ...prev, [soruId]: current.filter(v => v !== value) };
    });
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!katilimciBilgileri.ad.trim()) errors.ad = 'Gerekli';
    if (!katilimciBilgileri.soyad.trim()) errors.soyad = 'Gerekli';

    // Doğrulama kontrolü
    if (anket.hedefKitleKriterleri?.mail === true && emailVerificationStep !== 'verified') errors.mail = 'Doğrulama gerekli';
    if (anket.hedefKitleKriterleri?.telefonNumarasi === true && phoneVerificationStep !== 'verified') errors.telefon = 'Doğrulama gerekli';

    setHatalar(errors);
    if (Object.keys(errors).length === 0) setCurrentStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submitData = { anketId: anket._id, katilimciBilgileri, dogrulamaBilgileri, cevaplar };
      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/surveys/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      if (!response.ok) throw new Error('Gönderim başarısız');
      setSubmitted(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="anket-coz-page"><div className="anket-container"><p style={{ textAlign: 'center' }}>Anket Yükleniyor...</p></div></div>;
  if (error) return <div className="anket-coz-page"><div className="anket-container card error-card"><h3>Hata</h3><p>{error}</p></div></div>;
  if (submitted) return (
    <div className="anket-coz-page">
      <div className="anket-container">
        <div className="survey-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
          <h1>Teşekkürler!</h1>
          <p>Cevaplarınız başarıyla kaydedildi.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="anket-coz-page">
      <div className="anket-container">

        {/* STEPPER */}
        <div className="step-indicator">
          <div className={`step-badge ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            {currentStep > 1 ? <FaCheck /> : '1'}
          </div>
          <div className="step-line"></div>
          <div className={`step-badge ${currentStep >= 2 ? 'active' : ''}`}>2</div>
        </div>

        {currentStep === 1 ? (
          <div className="survey-card">
            <div className="survey-header">
              <h1>{anket?.anketBaslik || 'Anket'}</h1>
              <p>Katılım için lütfen bilgilerinizi doğrulayın.</p>
            </div>

            <form onSubmit={handleStep1Submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Adınız</label>
                  <input className={`form-input ${hatalar.ad ? 'error' : ''}`} value={katilimciBilgileri.ad} onChange={e => handleInputChange('ad', e.target.value)} placeholder="Adınız" />
                </div>
                <div className="form-group">
                  <label className="form-label">Soyadınız</label>
                  <input className={`form-input ${hatalar.soyad ? 'error' : ''}`} value={katilimciBilgileri.soyad} onChange={e => handleInputChange('soyad', e.target.value)} placeholder="Soyadınız" />
                </div>
              </div>

              {/* EMAIL API */}
              {anket.hedefKitleKriterleri?.mail && (
                <div className="verification-card">
                  <div className="verification-header">
                    <FaEnvelope className="verification-icon text-accent" />
                    <div className="verification-title">
                      <h3>📧 E-posta Doğrulama</h3>
                      <p>Size bir doğrulama kodu göndereceğiz</p>
                      {anket.hedefKitleKriterleri?.mailUzantisi && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '4px', fontWeight: '600' }}>
                          ⚠️ Sadece @{anket.hedefKitleKriterleri.mailUzantisi} uzantılı e-postalar kabul edilmektedir
                        </p>
                      )}
                    </div>
                  </div>
                  {emailVerificationStep === 'verified' ? (
                    <div className="verified-badge"><FaCheck /> ✅ {emailInput} adresiniz doğrulandı!</div>
                  ) : (
                    <div className="verify-input-group">
                      <input
                        className="form-input"
                        style={{ flex: 2 }}
                        placeholder={anket.hedefKitleKriterleri?.mailUzantisi ? `ornek@${anket.hedefKitleKriterleri.mailUzantisi}` : 'ornek@gmail.com'}
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        disabled={emailVerificationStep === 'code'}
                      />
                      {emailVerificationStep === 'code' ? (
                        <>
                          <input className="form-input" style={{ flex: 1, textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }} placeholder="000000" maxLength={6} value={codeInput} onChange={e => setCodeInput(e.target.value)} />
                          <button type="button" className={`btn-verify ${verificationLoading ? 'loading' : ''}`} onClick={handleVerifyCode} disabled={verificationLoading}>
                            {verificationLoading ? <><FaSpinner className="spin" /> Kontrol ediliyor...</> : '✓ Onayla'}
                          </button>
                        </>
                      ) : (
                        <button type="button" className={`btn-verify ${verificationLoading ? 'loading' : ''}`} onClick={handleSendVerificationCode} disabled={verificationLoading || !emailInput.includes('@')}>
                          {verificationLoading ? <><FaSpinner className="spin" /> Gönderiliyor...</> : '📤 Kod Gönder'}
                        </button>
                      )}
                    </div>
                  )}
                  {emailVerificationStep === 'code' && !verificationError && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px' }}>📬 E-posta adresinize 6 haneli doğrulama kodu gönderildi. Spam klasörünü de kontrol etmeyi unutmayın.</p>
                  )}
                  {verificationError && <div className="error-text" style={{ marginTop: '10px', padding: '10px', background: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{verificationError}</div>}
                </div>
              )}

              {/* SMS DOĞRULAMA */}
              {anket.hedefKitleKriterleri?.telefonNumarasi && (
                <div className="verification-card">
                  <div className="verification-header">
                    <FaPhone className="verification-icon text-accent" />
                    <div className="verification-title">
                      <h3>📱 Telefon Doğrulama</h3>
                      <p>Cep telefonunuza SMS ile kod göndereceğiz</p>
                    </div>
                  </div>
                  {phoneVerificationStep === 'verified' ? (
                    <div className="verified-badge"><FaCheck /> ✅ {verifiedPhoneNumber} numaranız doğrulandı!</div>
                  ) : (
                    <div className="verify-input-group">
                      <div style={{ flex: 2, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontWeight: '600' }}>+90</span>
                        <input
                          className="form-input"
                          style={{ paddingLeft: '50px', width: '100%' }}
                          placeholder="5XX XXX XX XX"
                          value={dogrulamaBilgileri.telefonNumarasi?.replace(/^0/, '') || ''}
                          onChange={e => handleKriterChange('telefonNumarasi', '0' + e.target.value.replace(/\D/g, '').slice(0, 10))}
                          disabled={phoneVerificationStep === 'code'}
                          maxLength={10}
                        />
                      </div>
                      <button type="button" className={`btn-verify ${phoneVerificationLoading ? 'loading' : ''}`} onClick={phoneVerificationStep === 'code' ? handleVerifyPhoneCode : handleSendPhoneVerificationCode} disabled={phoneVerificationLoading}>
                        {phoneVerificationLoading ? <><FaSpinner className="spin" /> Bekleyin...</> : (phoneVerificationStep === 'code' ? '✓ Onayla' : '📤 SMS Gönder')}
                      </button>
                    </div>
                  )}
                  {phoneVerificationStep === 'code' && (
                    <>
                      <input className="form-input" style={{ marginTop: '12px', textAlign: 'center', letterSpacing: '6px', fontSize: '1.3rem', fontWeight: 'bold' }} placeholder="• • • • • •" maxLength={6} value={phoneCodeInput} onChange={e => setPhoneCodeInput(e.target.value)} />
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>📲 Telefonunuza gönderilen 6 haneli kodu yukarıya girin</p>
                    </>
                  )}
                  {phoneVerificationError && <div className="error-text" style={{ marginTop: '10px', padding: '10px', background: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>{phoneVerificationError}</div>}
                </div>
              )}

              {/* KONUM */}
              {anket.hedefKitleKriterleri?.konum && (
                <div className="verification-card">
                  <div className="verification-header">
                    <FaMapMarkerAlt className="verification-icon" />
                    <div className="verification-title">
                      <h3>Konum Doğrulama</h3>
                    </div>
                  </div>
                  <KonumuDogrula onKonumDogrulandi={handleKonumDogrulandi} />
                  {hatalar.konum && <span className="error-text">{hatalar.konum}</span>}
                </div>
              )}

              {/* KİMLİK / BİYOMETRİK */}
              {anket.hedefKitleKriterleri?.kimlikDogrulama && (
                <div className="verification-card">
                  <div className="verification-header">
                    <FaShieldAlt className="verification-icon" />
                    <div className="verification-title">
                      <h3>🛡️ Biyometrik Kimlik Doğrulama</h3>
                      <p>Yüz tanıma ile kimliğinizi doğrulayacağız</p>
                    </div>
                  </div>
                  {identityVerificationStep === 'verified' ? (
                    <div className="verified-badge"><FaCheck /> ✅ Kimliğiniz başarıyla doğrulandı!</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      {/* Selfie Yükleme */}
                      <div className="upload-box">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                          <FaCamera style={{ color: 'var(--accent)' }} /> 📸 Selfie Fotoğrafınız
                        </label>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '10px' }}>Yüzünüz net görünecek şekilde bir selfie çekin veya yükleyin</p>
                        <label className="custom-file-upload">
                          <input type="file" style={{ display: 'none' }} onChange={e => setSelfieFile(e.target.files[0])} accept="image/*" />
                          <div className={`file-upload-btn ${selfieFile ? 'has-file' : ''}`}>
                            {selfieFile ? <><FaCheck /> {selfieFile.name}</> : <><FaCamera /> Selfie Yükle</>}
                          </div>
                        </label>
                      </div>

                      {/* Kimlik Kartı Yükleme */}
                      <div className="upload-box">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                          <FaIdCard style={{ color: 'var(--accent)' }} /> 🪪 Kimlik Kartı Fotoğrafı
                        </label>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '10px' }}>TC kimlik kartınızın ön yüzünün fotoğrafını yükleyin</p>
                        <label className="custom-file-upload">
                          <input type="file" style={{ display: 'none' }} onChange={e => setIdCardFile(e.target.files[0])} accept="image/*" />
                          <div className={`file-upload-btn ${idCardFile ? 'has-file' : ''}`}>
                            {idCardFile ? <><FaCheck /> {idCardFile.name}</> : <><FaIdCard /> Kimlik Kartı Yükle</>}
                          </div>
                        </label>
                      </div>

                      <button
                        type="button"
                        className={`btn-verify ${identityVerificationLoading ? 'loading' : ''}`}
                        style={{ width: '100%', padding: '14px' }}
                        onClick={handleIdentityVerification}
                        disabled={!idCardFile || !selfieFile || identityVerificationLoading}
                      >
                        {identityVerificationLoading ? <><FaSpinner className="spin" /> Yüz eşleştirme yapılıyor...</> : '🔐 Kimliği Doğrula'}
                      </button>

                      {(!idCardFile || !selfieFile) && (
                        <p style={{ fontSize: '0.8rem', color: '#f59e0b', textAlign: 'center' }}>⚠️ Doğrulama için hem selfie hem kimlik kartı yüklemeniz gerekiyor</p>
                      )}
                    </div>
                  )}
                  {identityVerificationError && <div className="error-text" style={{ marginTop: '10px', padding: '10px', background: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>❌ {identityVerificationError}</div>}
                </div>
              )}

              {/* TC OCR */}
              {anket.hedefKitleKriterleri?.tcNo && (
                <div className="verification-card">
                  <div className="verification-header">
                    <FaIdCard className="verification-icon" />
                    <div className="verification-title">
                      <h3>🆔 TC Kimlik No Doğrulama</h3>
                      <p>Kimlik kartınızdaki TC No ile eşleştirme yapacağız</p>
                    </div>
                  </div>
                  {tcVerificationStep === 'verified' ? (
                    <div className="verified-badge"><FaCheck /> ✅ TC Kimlik Numaranız doğrulandı!</div>
                  ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>TC Kimlik Numaranız</label>
                        <input
                          className="form-input"
                          placeholder="11 haneli TC Kimlik No"
                          maxLength={11}
                          value={dogrulamaBilgileri.tcNo || ''}
                          onChange={e => handleKriterChange('tcNo', e.target.value.replace(/\D/g, ''))}
                          style={{ letterSpacing: '2px', fontWeight: '600' }}
                        />
                        {dogrulamaBilgileri.tcNo && dogrulamaBilgileri.tcNo.length !== 11 && (
                          <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '4px' }}>⚠️ TC Kimlik No 11 haneli olmalıdır ({dogrulamaBilgileri.tcNo.length}/11)</p>
                        )}
                      </div>

                      <div className="upload-box">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                          <FaIdCard style={{ color: 'var(--accent)' }} /> 🪪 Kimlik Kartı Fotoğrafı
                        </label>
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '10px' }}>TC Kimlik No'nun görüneceği şekilde kimlik kartı fotoğrafı yükleyin</p>
                        <label className="custom-file-upload">
                          <input type="file" style={{ display: 'none' }} onChange={e => setTcIdCardFile(e.target.files[0])} accept="image/*" />
                          <div className={`file-upload-btn ${tcIdCardFile ? 'has-file' : ''}`}>
                            {tcIdCardFile ? <><FaCheck /> {tcIdCardFile.name}</> : <><FaIdCard /> Kimlik Kartı Yükle</>}
                          </div>
                        </label>
                      </div>

                      <button
                        type="button"
                        className={`btn-verify ${tcVerificationLoading ? 'loading' : ''}`}
                        style={{ width: '100%', padding: '14px' }}
                        onClick={handleTcOcrVerification}
                        disabled={tcVerificationLoading || !tcIdCardFile || !dogrulamaBilgileri.tcNo || dogrulamaBilgileri.tcNo.length !== 11}
                      >
                        {tcVerificationLoading ? <><FaSpinner className="spin" /> TC No kontrol ediliyor...</> : '🔍 TC Kimlik Doğrula'}
                      </button>
                    </div>
                  )}
                  {tcVerificationError && <div className="error-text" style={{ marginTop: '10px', padding: '10px', background: '#fef2f2', borderRadius: '8px', borderLeft: '3px solid #ef4444' }}>❌ {tcVerificationError}</div>}
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary">Sorulara Geç <FaArrowRight style={{ marginLeft: '8px' }} /></button>
              </div>
            </form>
          </div>
        ) : (
          <div className="survey-card">
            <div className="survey-header">
              <h1>{anket?.anketBaslik}</h1>
              <p>{anket?.anketAciklama}</p>
            </div>

            <form onSubmit={handleSubmit}>
              {anket.sorular.map((soru, index) => (
                <div key={soru._id} className="question-block">
                  <div className="question-header">
                    <div className="question-number">{index + 1}</div>
                    <div className="question-text">{soru.soruMetni}</div>
                  </div>

                  <div className="question-content">
                    {soru.soruTipi === 'acik-uclu' && (
                      <textarea className="form-input" rows={4} value={cevaplar[soru._id] || ''} onChange={e => handleAnswerChange(soru._id, e.target.value)} placeholder="Cevabınız..." />
                    )}

                    {(soru.soruTipi === 'coktan-tek' || soru.soruTipi === 'coktan-coklu') && (
                      <div className="options-list">
                        {(soru.secenekler || []).map((secenek, idx) => {
                          const text = typeof secenek === 'string' ? secenek : secenek.metni;
                          const isSelected = soru.soruTipi === 'coktan-tek'
                            ? cevaplar[soru._id] === text
                            : (cevaplar[soru._id] || []).includes(text);

                          return (
                            <div
                              key={idx}
                              className={`custom-option ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                if (soru.soruTipi === 'coktan-tek') handleAnswerChange(soru._id, text);
                                else handleCheckboxChange(soru._id, text, !isSelected);
                              }}
                            >
                              <div className="option-indicator"></div>
                              <span className="option-label">{text}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {soru.soruTipi === 'slider' && (
                      <div className="slider-container">
                        <div className="slider-value-display">{cevaplar[soru._id] || soru.minDegeri || 0}</div>
                        <input
                          type="range"
                          className="slider-input"
                          min={soru.minDegeri || 0}
                          max={soru.maxDegeri || 10}
                          value={cevaplar[soru._id] || soru.minDegeri || 0}
                          onChange={e => handleAnswerChange(soru._id, parseInt(e.target.value))}
                        />
                        <div className="slider-labels">
                          <span>{soru.minEtiket || soru.minDegeri}</span>
                          <span>{soru.maxEtiket || soru.maxDegeri}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="form-actions">
                <button type="button" className="btn-verify" style={{ background: 'transparent', color: 'var(--panel-text)', border: '1px solid var(--panel-border)' }} onClick={() => setCurrentStep(1)}> <FaArrowLeft /> Geri</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Gönderiliyor...' : 'Anketi Tamamla'}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnketCoz;