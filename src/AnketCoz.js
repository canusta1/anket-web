import React, { useState, useEffect } from 'react';
import KonumuDogrula from './KonumuDogrula';
import './AnketCoz.css';
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaIdCard, 
  FaCheck, FaExclamationTriangle, FaArrowRight, FaArrowLeft, 
  FaCamera, FaPaperPlane, FaLock, FaShieldAlt
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
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
      const response = await fetch(`${apiUrl}/api/verification/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: anket._id, contactInfo: emailInput, type: 'email' })
      });
      if (!response.ok) throw new Error('Kod gönderilemedi');
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
    try {
        const formData = new FormData();
        formData.append('idCard', idCardFile);
        formData.append('selfie', selfieFile);
        
        const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
        const response = await fetch(`${apiUrl}/api/verification/verify-identity`, { method: 'POST', body: formData });
        const data = await response.json();
        
        if (!response.ok) throw new Error('Doğrulama başarısız');
        
        setVerifiedTcNo(data.data.tcKimlikNo);
        setIdentityVerificationToken(data.data.verificationToken);
        setIdentityVerificationStep('verified');
        setDogrulamaBilgileri(prev => ({ ...prev, kimlikDogrulama: data.data.tcKimlikNo }));
    } catch (err) {
        setIdentityVerificationError(err.message);
    } finally {
        setIdentityVerificationLoading(false);
    }
  };

  const handleTcOcrVerification = async (e) => {
      e.preventDefault();
      setTcVerificationLoading(true);
      try {
          if (!dogrulamaBilgileri.tcNo || dogrulamaBilgileri.tcNo.length !== 11) throw new Error('Geçersiz TC');
          
          const formData = new FormData();
          formData.append('tcNo', dogrulamaBilgileri.tcNo);
          formData.append('idCard', tcIdCardFile);
          
          const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
          const response = await fetch(`${apiUrl}/api/verification/verify-tc-ocr`, { method: 'POST', body: formData });
          const data = await response.json();
          
          if (!response.ok) throw new Error('Doğrulama başarısız');
          
          setVerifiedTcNoOcr(data.data.tcKimlikNo);
          setTcVerificationToken(data.data.verificationToken);
          setTcVerificationStep('verified');
      } catch (err) {
          setTcVerificationError(err.message);
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

  if (loading) return <div className="anket-coz-page"><div className="anket-container"><p style={{textAlign:'center'}}>Anket Yükleniyor...</p></div></div>;
  if (error) return <div className="anket-coz-page"><div className="anket-container card error-card"><h3>Hata</h3><p>{error}</p></div></div>;
  if (submitted) return (
      <div className="anket-coz-page">
          <div className="anket-container">
              <div className="survey-card" style={{textAlign:'center', padding:'60px 40px'}}>
                  <div style={{fontSize:'4rem', marginBottom:'20px'}}>🎉</div>
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
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
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
                                <h3>E-posta Doğrulama</h3>
                                <p>Kurumsal e-posta adresinizi doğrulayın</p>
                            </div>
                        </div>
                        {emailVerificationStep === 'verified' ? (
                             <div className="verified-badge"><FaCheck /> {emailInput} Doğrulandı</div>
                        ) : (
                            <div className="verify-input-group">
                                <input 
                                    className="form-input" 
                                    style={{flex:2}} 
                                    placeholder="E-posta adresi (örn: @trakya.edu.tr)" 
                                    value={emailInput} 
                                    onChange={e => setEmailInput(e.target.value)}
                                    disabled={emailVerificationStep === 'code'}
                                />
                                {emailVerificationStep === 'code' ? (
                                    <>
                                        <input className="form-input" style={{flex:1, textAlign:'center', letterSpacing:'2px'}} placeholder="KOD" maxLength={6} value={codeInput} onChange={e => setCodeInput(e.target.value)} />
                                        <button type="button" className="btn-verify" onClick={handleVerifyCode} disabled={verificationLoading}>Doğrula</button>
                                    </>
                                ) : (
                                    <button type="button" className="btn-verify" onClick={handleSendVerificationCode} disabled={verificationLoading}>Kod Gönder</button>
                                )}
                            </div>
                        )}
                        {verificationError && <span className="error-text">{verificationError}</span>}
                    </div>
                )}

                {/* SMS DOĞRULAMA */}
                {anket.hedefKitleKriterleri?.telefonNumarasi && (
                    <div className="verification-card">
                        <div className="verification-header">
                            <FaPhone className="verification-icon text-accent" />
                            <div className="verification-title">
                                <h3>Telefon Doğrulama</h3>
                                <p>SMS ile telefon numaranızı doğrulayın</p>
                            </div>
                        </div>
                        {phoneVerificationStep === 'verified' ? (
                            <div className="verified-badge"><FaCheck /> {verifiedPhoneNumber} Doğrulandı</div>
                        ) : (
                            <div className="verify-input-group">
                                <input 
                                    className="form-input" 
                                    style={{flex:2}} 
                                    placeholder="Telefon (5XX...)" 
                                    value={dogrulamaBilgileri.telefonNumarasi?.replace(/^0/, '') || ''} 
                                    onChange={e => handleKriterChange('telefonNumarasi', '0' + e.target.value.replace(/\D/g,'').slice(0,10))}
                                    disabled={phoneVerificationStep === 'code'}
                                />
                                <button type="button" className="btn-verify" onClick={phoneVerificationStep === 'code' ? handleVerifyPhoneCode : handleSendPhoneVerificationCode}>
                                    {phoneVerificationStep === 'code' ? 'Doğrula' : 'Kod Gönder'}
                                </button>
                            </div>
                        )}
                        {phoneVerificationStep === 'code' && (
                             <input className="form-input" style={{marginTop:'8px', textAlign:'center', letterSpacing:'4px', fontSize:'1.2rem'}} placeholder="000000" maxLength={6} value={phoneCodeInput} onChange={e => setPhoneCodeInput(e.target.value)} />
                        )}
                        {phoneVerificationError && <span className="error-text">{phoneVerificationError}</span>}
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
                                <h3>Biyometrik Kimlik Doğrulama</h3>
                                <p>Kimlik kartı ve selfie eşleşmesi</p>
                            </div>
                        </div>
                        {identityVerificationStep === 'verified' ? (
                            <div className="verified-badge"><FaCheck /> Kimlik Doğrulandı (TC: {verifiedTcNo})</div>
                        ) : (
                            <div style={{display:'grid', gap:'12px'}}>
                                <input type="file" className="form-input" onChange={e => setIdCardFile(e.target.files[0])} accept="image/*" />
                                <input type="file" className="form-input" onChange={e => setSelfieFile(e.target.files[0])} accept="image/*" />
                                <button type="button" className="btn-verify" style={{width:'100%'}} onClick={handleIdentityVerification} disabled={!idCardFile || !selfieFile}>Kimliği Doğrula</button>
                            </div>
                        )}
                        {identityVerificationError && <span className="error-text">{identityVerificationError}</span>}
                    </div>
                )}

                {/* TC OCR */}
                {anket.hedefKitleKriterleri?.tcNo && (
                   <div className="verification-card">
                        <div className="verification-header">
                            <FaIdCard className="verification-icon" />
                            <div className="verification-title">
                                <h3>TC Kimlik Doğrulama</h3>
                            </div>
                        </div>
                        {tcVerificationStep === 'verified' ? (
                             <div className="verified-badge"><FaCheck /> TC Doğrulandı ({verifiedTcNoOcr})</div>
                        ) : (
                            <div style={{display:'grid', gap:'12px'}}>
                                <input className="form-input" placeholder="TC Kimlik No" maxLength={11} value={dogrulamaBilgileri.tcNo || ''} onChange={e => handleKriterChange('tcNo', e.target.value)} />
                                <input type="file" className="form-input" onChange={e => setTcIdCardFile(e.target.files[0])} accept="image/*" />
                                <button type="button" className="btn-verify" style={{width:'100%'}} onClick={handleTcOcrVerification}>Doğrula</button>
                            </div>
                        )}
                         {tcVerificationError && <span className="error-text">{tcVerificationError}</span>}
                   </div>
                )}

                <div className="form-actions">
                    <button type="submit" className="btn-primary">Sorulara Geç <FaArrowRight style={{marginLeft:'8px'}} /></button>
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
                                                    if(soru.soruTipi === 'coktan-tek') handleAnswerChange(soru._id, text);
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
                      <button type="button" className="btn-verify" style={{background:'transparent', color:'var(--panel-text)', border:'1px solid var(--panel-border)'}} onClick={() => setCurrentStep(1)}> <FaArrowLeft /> Geri</button>
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