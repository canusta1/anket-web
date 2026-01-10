import React, { useEffect, useState, useCallback } from "react";
import "./Anasayfa.css";
import { Link } from "react-router-dom";
import ParticleBackground from "./components/ParticleBackground";
import aiLogo from "./res/drawable/unnamed.png";
import SurvAILogo from "./assets/SurvAI_Logo.png";

function Anasayfa() {
  // 🎯 Navbar scroll efekti için state
  const [isScrolled, setIsScrolled] = useState(false);
  
  // 🔧 Performance: Scroll handler'ı useCallback ile optimize et
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 50);
  }, []);


  useEffect(() => {
    // Anasayfaya her gelişte oturumu sonlandır (geri tuşu koruması)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.scrollTo(0, 0);
    
    // 📱 Scroll event listener ekle
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div className="landing-page">
      {/* Navbar - Scroll'da gölge efekti */}
      <nav className={`landing-navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <Link to="/" className="landing-logo">
          <img src={SurvAILogo} alt="SurvAI" className="landing-logo-img" />
        </Link>
        <div className="nav-links">
          <Link to="/giris">
            <button className="btn-outline">Giriş Yap</button>
          </Link>
          <Link to="/uyeol">
            <button className="btn-primary-landing">Ücretsiz Başla</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <ParticleBackground />
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Yapay Zeka Destekli Anket Platformu
          </div>
          <h1 className="hero-title">
            Profesyonel anketlerle
            <span className="gradient-text"> veriye dayalı kararlar </span>
            alın
          </h1>
          <p className="hero-description">
            Dakikalar içinde anket oluşturun, AI ile sorular üretin,
            sonuçları anlık analiz edin. Üstelik tamamen güvenli ve KVKK uyumlu.
          </p>
          <div className="hero-buttons">
            <Link to="/uyeol">
              <button className="btn-hero-primary">
                <span>Hemen Başla</span>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </Link>
            <Link to="/giris">
              <button className="btn-hero-secondary">Demo Görüntüle</button>
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Aktif Kullanıcı</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Oluşturulan Anket</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
          </div>
        </div>

        {/* AI Logo - Floating Animation */}
        <div className="hero-image-container">
          <img src={aiLogo} alt="AI Anket Logo" className="hero-ai-logo" />
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="scroll-mouse"></div>
          <span>Kaydır</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Anket Oluşturma Seçenekleri</h2>
          <p>Size en uygun yöntemi seçin ve hemen başlayın</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✏️</div>
            <h3>Sıfırdan Oluştur</h3>
            <p>Boş bir sayfadan başlayarak tamamen özelleştirilmiş anketler hazırlayın.</p>
            <ul className="feature-list">
              <li>Sınırsız soru ekleme</li>
              <li>Çoktan seçmeli, açık uçlu, ölçekli</li>
              <li>Mantıksal atlama kuralları</li>
            </ul>
          </div>
          <div className="feature-card featured">
            <div className="featured-badge">Hemen</div>
            <div className="feature-icon">🤖</div>
            <h3>AI ile Oluştur</h3>
            <p>Sadece konuyu yazın, yapay zeka sizin için profesyonel sorular oluştursun.</p>
            <ul className="feature-list">
              <li>Saniyeler içinde hazır anket</li>
              <li>GPT destekli akıllı sorular</li>
              <li>Otomatik soru optimizasyonu</li>
            </ul>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>Anketi Kopyala</h3>
            <p>Mevcut anketlerinizi temel alarak yeni versiyonlar oluşturun.</p>
            <ul className="feature-list">
              <li>Hızlı klonlama</li>
              <li>Geçmiş anketlere erişim</li>
              <li>Şablon olarak kaydetme</li>
            </ul>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Yapıştır & Oluştur</h3>
            <p>Hazır sorularınızı yapıştırın, sistem otomatik olarak ankete dönüştürsün.</p>
            <ul className="feature-list">
              <li>Excel/Word'den aktar</li>
              <li>Otomatik format tanıma</li>
              <li>Toplu soru ekleme</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="security-section">
        <div className="security-content">
          <div className="security-text">
            <div className="section-badge">🔒 Güvenlik & Gizlilik</div>
            <h2>Verileriniz Güvende</h2>
            <p>
              KVKK ve GDPR uyumlu altyapımız ile tüm verileriniz şifreli olarak saklanır.
              Katılımcı gizliliği bizim için önceliktir.
            </p>
            <ul className="security-list">
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>SSL/TLS Şifreleme</strong>
                  <span>Tüm veriler 256-bit şifreleme ile korunur</span>
                </div>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>KVKK Uyumlu</strong>
                  <span>Türkiye'deki yasal gereksinimlere tam uyum</span>
                </div>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>Anonim Katılım</strong>
                  <span>İsteğe bağlı anonim yanıt toplama</span>
                </div>
              </li>
              <li>
                <span className="check-icon">✓</span>
                <div>
                  <strong>Veri Yedekleme</strong>
                  <span>Günlük otomatik yedekleme</span>
                </div>
              </li>
            </ul>
          </div>
          <div className="security-visual">
            <div className="security-card">
              <div className="shield-icon">🛡️</div>
              <div className="security-badge-text">
                <span className="badge-title">Güvenlik Sertifikası</span>
                <span className="badge-subtitle">ISO 27001 Uyumlu</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="steps-section">
        <div className="section-header">
          <h2>Nasıl Çalışır?</h2>
          <p>3 basit adımda anketinizi oluşturun</p>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Anket Oluştur</h3>
            <p>Sıfırdan veya AI yardımıyla anketinizi hazırlayın</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Paylaş</h3>
            <p>Bağlantıyı QR kod  veya kopyalayarak paylaşın</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Analiz Et</h3>
            <p>Yanıtları anlık olarak grafiklerle görün</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Hemen Ücretsiz Hesap Oluşturun</h2>
          <p>Kredi kartı gerekmez. Dakikalar içinde anketinizi oluşturmaya başlayın.</p>
          <Link to="/uyeol">
            <button className="btn-cta">
              Ücretsiz Başla
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      
        <div className="footer-bottom">
          <p>© 2025 SurvAI - Tüm hakları saklıdır.</p>
        </div>
      
    </div>
  );
}

export default Anasayfa;