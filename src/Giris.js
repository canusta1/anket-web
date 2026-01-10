import React, { useState } from "react";
import "./Giris.css";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import ParticleBackground from "./components/ParticleBackground";
import { useAuth } from "./context/AuthContext";

function Giris() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();
  
  // Şifremi unuttum state'leri
  const [forgotMode, setForgotMode] = useState(null); // null | 'email' | 'code' | 'newPassword' | 'success'
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLocalLoading(true);

    try {
      await login(email, password);
      navigate("/panel", { replace: true });
    } catch (err) {
      console.error("Giriş Hatası Detayı:", err);
      const message = err.response?.data?.error || err.message || "Giriş başarısız";
      setError(message);
    } finally {
      setLocalLoading(false);
    }
  };

  // Google OAuth Login Handler
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLocalLoading(true);
      setError("");
      
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoRes.json();
        
        const googleData = {
          credential: tokenResponse.access_token,
          email: userInfo.email,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
          picture: userInfo.picture,
          sub: userInfo.sub
        };

        await googleLogin(googleData);
        navigate("/panel", { replace: true });

      } catch (err) {
        console.error("Google Giriş Hatası:", err);
        const message = err.response?.data?.error || err.message || "Google ile giriş yapılamadı";
        setError(message);
      } finally {
        setLocalLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google Login Error:", error);
      setError("Google ile giriş yapılamadı");
    }
  });

  // Şifremi unuttum - Kod gönder
  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLocalLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/auth/forgot-password/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Kod gönderilemedi");
      
      setSuccessMessage("Doğrulama kodu e-posta adresinize gönderildi");
      setForgotMode('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLocalLoading(false);
    }
  };

  // Şifremi unuttum - Kod doğrula
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLocalLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/auth/forgot-password/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Kod doğrulanamadı");
      
      setSuccessMessage("Kod doğrulandı! Yeni şifrenizi belirleyin.");
      setForgotMode('newPassword');
    } catch (err) {
      setError(err.message);
    } finally {
      setLocalLoading(false);
    }
  };

  // Şifremi unuttum - Şifre güncelle
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword.length < 6) {
      setError("Şifre en az 6 karakter olmalı");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setLocalLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/auth/forgot-password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Şifre güncellenemedi");
      
      setSuccessMessage("Şifreniz başarıyla güncellendi!");
      setForgotMode('success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLocalLoading(false);
    }
  };

  // Sıfırlama işlemini iptal et
  const handleBackToLogin = () => {
    setForgotMode(null);
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccessMessage("");
  };

  // Şifremi unuttum kart içerikleri
  const renderForgotPasswordContent = () => {
    // E-posta girme adımı
    if (forgotMode === 'email') {
      return (
        <>
          <div className="auth-header">
            <h2>Şifremi Unuttum</h2>
            <p>Kayıtlı e-posta adresinizi girin</p>
          </div>

          <form onSubmit={handleSendResetCode} className="auth-form">
            <div className="form-group">
              <label htmlFor="resetEmail">E-posta Adresi</label>
              <input
                id="resetEmail"
                type="email"
                placeholder="ornek@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="alert alert-error">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={localLoading}>
              {localLoading ? (
                <>
                  <span className="spinner"></span>
                  Gönderiliyor...
                </>
              ) : (
                "Kod Gönder"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p><button type="button" className="link-btn" onClick={handleBackToLogin}>← Giriş'e Dön</button></p>
          </div>
        </>
      );
    }

    // Kod doğrulama adımı
    if (forgotMode === 'code') {
      return (
        <>
          <div className="auth-header">
            <h2>Kodu Doğrula</h2>
            <p>E-posta adresinize gönderilen 6 haneli kodu girin</p>
          </div>

          <form onSubmit={handleVerifyCode} className="auth-form">
            <div className="form-group">
              <label htmlFor="resetCode">Doğrulama Kodu</label>
              <input
                id="resetCode"
                type="text"
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                maxLength={6}
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
              />
            </div>

            {successMessage && (
              <div className="alert alert-success">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                </svg>
                <span>{successMessage}</span>
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

            <button type="submit" className="btn-primary" disabled={localLoading}>
              {localLoading ? (
                <>
                  <span className="spinner"></span>
                  Doğrulanıyor...
                </>
              ) : (
                "Kodu Doğrula"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p><button type="button" className="link-btn" onClick={handleBackToLogin}>← Giriş'e Dön</button></p>
          </div>
        </>
      );
    }

    // Yeni şifre belirleme adımı
    if (forgotMode === 'newPassword') {
      return (
        <>
          <div className="auth-header">
            <h2>Yeni Şifre Belirle</h2>
            <p>En az 6 karakterli yeni şifrenizi girin</p>
          </div>

          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="newPassword">Yeni Şifre</label>
              <input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Şifre Tekrar</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {successMessage && (
              <div className="alert alert-success">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                </svg>
                <span>{successMessage}</span>
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

            <button type="submit" className="btn-primary" disabled={localLoading}>
              {localLoading ? (
                <>
                  <span className="spinner"></span>
                  Güncelleniyor...
                </>
              ) : (
                "Şifreyi Güncelle"
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p><button type="button" className="link-btn" onClick={handleBackToLogin}>← Giriş'e Dön</button></p>
          </div>
        </>
      );
    }

    // Başarılı güncelleme
    if (forgotMode === 'success') {
      return (
        <>
          <div className="auth-header">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2>Şifre Güncellendi!</h2>
            <p>Yeni şifrenizle giriş yapabilirsiniz.</p>
          </div>

          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleBackToLogin}
            style={{ marginTop: '1.5rem' }}
          >
            Giriş Yap
          </button>
        </>
      );
    }

    return null;
  };

  return (
    <div className="auth-page">
      {/* Particle Animasyonu - Tüm Sayfa Arka Planı */}
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

      {/* Sağ Panel - Login Form veya Şifremi Unuttum */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          {forgotMode ? (
            renderForgotPasswordContent()
          ) : (
            <>
              <div className="auth-header">
                <h2>Oturum Aç</h2>
                <p>Hesabınıza giriş yaparak devam edin</p>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">E-posta Adresi</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Şifre</label>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="forgot-password-link">
                  <button 
                    type="button" 
                    className="link-btn" 
                    onClick={() => setForgotMode('email')}
                  >
                    Şifremi Unuttum
                  </button>
                </div>

                {error && (
                  <div className="alert alert-error">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={localLoading}>
                  {localLoading ? (
                    <>
                      <span className="spinner"></span>
                      Giriş Yapılıyor...
                    </>
                  ) : (
                    "Giriş Yap"
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>veya</span>
              </div>

              <div className="social-login">
                <button 
                  className="social-btn google" 
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={localLoading}
                >
                  {localLoading ? (
                    <>
                      <span className="spinner"></span>
                      Google ile Giriş Yapılıyor...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google ile Giriş Yap
                    </>
                  )}
                </button>
              </div>

              <div className="auth-footer">
                <p>Hesabınız yok mu? <Link to="/uyeol">Kayıt Ol</Link></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Giris;