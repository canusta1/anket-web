import React, { useState, useEffect } from "react";
import "./UyeOl.css";
import { Link, useNavigate } from "react-router-dom";
import ParticleBackground from "./components/ParticleBackground";
import { useAuth } from "./context/AuthContext";
import AuthService from "./services/authService"; // Import AuthService

function UyeOl() {
  // Form state
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [confirmPassword, setConfirmPass] = useState("");
  const [agreeLoc, setAgreeLoc] = useState(false);
  const [agreeKvkk, setAgreeKvkk] = useState(false);
  
  // Verification state
  const [step, setStep] = useState(1); // 1: Form, 2: Verification
  const [verificationCode, setVerificationCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Şifre validasyon kontrolleri
  const validatePassword = (pass) => {
    const errors = [];
    if (pass.length < 8) errors.push("Şifre en az 8 karakter olmalı");
    if (!/[a-zA-ZÇçĞğİıÖöŞşÜü]/.test(pass)) errors.push("En az bir harf içermeli");
    if (!/[0-9]/.test(pass)) errors.push("En az bir rakam içermeli");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) errors.push("En az bir sembol içermeli (!@#$%^&*)");
    return errors;
  };

  // Telefon numarası formatı: 0 (5XX) XXX XX XX
  const formatPhone = (value) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);
    
    if (limited.length === 0) return '';
    if (limited.length <= 1) return limited;
    if (limited.length <= 4) return `${limited[0]} (${limited.slice(1)})`;
    if (limited.length <= 7) return `${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4)}`;
    if (limited.length <= 9) return `${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4, 7)} ${limited.slice(7)}`;
    return `${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4, 7)} ${limited.slice(7, 9)} ${limited.slice(9)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  // useAuth - Context üzerinden metotları al
  const { register } = useAuth();
  
  // Doğrulama kodu gönder
  const sendCode = async () => {
    setError("");
    setSuccess("");
    
    // Form validasyonları
    if (!firstName || !lastName || !email || !password) {
      setError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Geçersiz e-posta adresi.");
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join(", "));
      return;
    }

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    if (!agreeLoc || !agreeKvkk) {
      setError("Lütfen tüm onayları işaretleyin.");
      return;
    }

    setLoading(true);
    try {
      // AuthService kullanımı
      await AuthService.sendCode(email, firstName);
      
      setSuccess("Doğrulama kodu e-posta adresinize gönderildi.");
      setStep(2);
      setCountdown(60); // 60 saniye bekle
      
    } catch (err) {
       // Axios error handling
       const message = err.response?.data?.error || err.message || "Kod gönderilemedi";
       setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Yeniden kod gönder
  const resendCode = async () => {
    if (countdown > 0) return;
    await sendCode();
  };

  // Kayıt tamamla
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Lütfen 6 haneli doğrulama kodunu girin.");
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      
      // AuthContext register metodu kullanımı
      await register({ 
        firstName, 
        lastName, 
        phone: cleanPhone, 
        email, 
        password,
        verificationCode 
      });
      
      setSuccess("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
      setTimeout(() => navigate("/giris"), 2000);
      
    } catch (err) {
      const message = err.response?.data?.error || err.message || "Kayıt başarısız";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Geri git
  const goBack = () => {
    setStep(1);
    setVerificationCode("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="auth-page">
      <ParticleBackground />
      
      {/* Sol Panel - Branding */}
      <div className="auth-branding">
        <div className="branding-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17ZM19 19H5V5H19V19.1V19ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="logo-text">Anket Platformu</h1>
          </div>
          <p className="branding-subtitle">Profesyonel Anket Yönetim Sistemi</p>
          
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                </svg>
              </div>
              <div className="feature-text">
                <strong>Hızlı Anket Oluşturma</strong>
                <span>Dakikalar içinde profesyonel anketler</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                </svg>
              </div>
              <div className="feature-text">
                <strong>Güvenli Veri Yönetimi</strong>
                <span>Tüm verileriniz şifreli ve güvende</span>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                </svg>
              </div>
              <div className="feature-text">
                <strong>Detaylı Analiz</strong>
                <span>Sonuçları anlık olarak takip edin</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="branding-footer">
          <p>© 2025 Anket Platformu · Tüm hakları saklıdır</p>
        </div>
      </div>

      {/* Sağ Panel - Form */}
      <div className="auth-form-panel">
        <div className="auth-form-container register-form">
          
          {/* Step Indicator */}
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className="step-line"></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
          </div>

          {/* STEP 1: Registration Form */}
          {step === 1 && (
            <>
              <div className="auth-header">
                <h2>Hesap Oluştur</h2>
                <p>Bilgilerinizi girin ve doğrulama kodunuzu alın</p>
              </div>

              <form className="auth-form" onSubmit={(e) => { e.preventDefault(); sendCode(); }}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">İsim</label>
                    <input
                      id="firstName"
                      type="text"
                      placeholder="Adınız"
                      value={firstName}
                      onChange={(e) => setFirst(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Soyisim</label>
                    <input
                      id="lastName"
                      type="text"
                      placeholder="Soyadınız"
                      value={lastName}
                      onChange={(e) => setLast(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Telefon Numarası</label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="0 (5XX) XXX XX XX"
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">E-posta Adresi</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div className="label-with-info">
                      <label htmlFor="password">Şifre</label>
                      <div className="info-tooltip">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
                        </svg>
                        <div className="tooltip-content">
                          <strong>Şifre Gereksinimleri:</strong>
                          <ul>
                            <li>En az 8 karakter</li>
                            <li>En az 1 harf</li>
                            <li>En az 1 rakam</li>
                            <li>En az 1 sembol (!@#$%^&*)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPass(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Şifre Tekrar</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreeLoc}
                      onChange={(e) => setAgreeLoc(e.target.checked)}
                      required
                    />
                    <span className="checkbox-text">Konumumun kullanılmasına onay veriyorum</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreeKvkk}
                      onChange={(e) => setAgreeKvkk(e.target.checked)}
                      required
                    />
                    <span className="checkbox-text">KVKK metnini okudum ve onaylıyorum</span>
                  </label>
                </div>

                {error && (
                  <div className="alert alert-error">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Kod Gönderiliyor...
                    </>
                  ) : (
                    "Doğrulama Kodu Gönder"
                  )}
                </button>
              </form>

              <div className="auth-footer">
                <p>Zaten hesabınız var mı? <Link to="/giris">Giriş Yap</Link></p>
              </div>
            </>
          )}

          {/* STEP 2: Verification Code */}
          {step === 2 && (
            <>
              <div className="auth-header">
                <h2>E-posta Doğrulama</h2>
                <p><strong>{email}</strong> adresine gönderilen 6 haneli kodu girin</p>
              </div>

              <form className="auth-form" onSubmit={handleRegister}>
                <div className="form-group verification-input-group">
                  <label htmlFor="verificationCode">Doğrulama Kodu</label>
                  <input
                    id="verificationCode"
                    type="text"
                    placeholder="000000"
                    maxLength="6"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="verification-input"
                    autoFocus
                  />
                </div>

                {success && (
                  <div className="alert alert-success">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                    </svg>
                    <span>{success}</span>
                  </div>
                )}

                {error && (
                  <div className="alert alert-error">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Kayıt Yapılıyor...
                    </>
                  ) : (
                    "Kayıt Ol"
                  )}
                </button>

                <div className="resend-section">
                  <button 
                    type="button" 
                    className="btn-link"
                    onClick={resendCode}
                    disabled={countdown > 0 || loading}
                  >
                    {countdown > 0 ? `Yeniden gönder (${countdown}s)` : "Kodu yeniden gönder"}
                  </button>
                </div>

                <button type="button" className="btn-secondary" onClick={goBack}>
                  ← Geri Dön
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UyeOl;
