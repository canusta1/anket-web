import React, { useEffect } from "react";
import "./Anasayfa.css"; // CSS dosya adı küçük harfle ise burayı kontrol et (anasayfa.css)
import { Link } from "react-router-dom";
import unnamedImg from "./res/drawable/unnamed.png";

function Anasayfa() {
  function scrollSlider(direction) {
    const slider = document.getElementById("slider");
    if (slider) {
      slider.scrollBy({
        left: direction * 350,
        behavior: "smooth",
      });
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="App">
      {/* Üst Menü - Padding azaltıldı */}
      <nav className="navbar" style={{ padding: "10px 60px" }}>
        {/* Sol üstteki logo zaten panele gidiyor */}
        <Link to="/panel" className="logo">AnketApp</Link>
        <div className="nav-links">
          <Link to="/giris">
            <button className="btn-outline">Giriş Yap</button>
          </Link>
          <Link to="/uyeol">
            <button className="btn-filled">Üye Ol</button>
          </Link>
        </div>
      </nav>

      {/* Hero Bölümü - Padding azaltılarak içerik yukarı taşındı */}
      <section className="hero" style={{ padding: "50px 120px" }}>
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-subtitle">
              BAŞARILI OLMANIZ İÇİN TASARLANMIŞ ANKETLER VE FORMLAR
            </p>
            <h1>
              Yapay zeka destekli anketlerle hedef kitlenizin ilgisini çekin.{" "}
              <span className="highlight">Büyümenize hız katacak görüşler alın.</span>
            </h1>
            <p className="hero-desc">
              Güzel görünen, ilgi çekici anket ve formlarla etkili geri bildirimler toplayın
              ve akıllı iş kararlarına yön verin.
            </p>

            {/* --- GÜNCELLENEN KISIM --- */}
            {/* Hedef /uyeol yapıldı ve metin değiştirildi */}
            <Link to="/uyeol">
              <button className="btn-green">Hemen Kullanmaya Başlayın</button>
            </Link>
            {/* ------------------------- */}

          </div>

          <div className="hero-image">
            <img
              src={unnamedImg}
              alt="Yapay Zeka Destekli Anket"
            />
          </div>
        </div>
      </section>

      {/* Slider Alanı */}
      <section className="slider">
        <h2>6 Adımda Anket Oluşturma</h2>

        <div className="slider-container">
          <button className="arrow-btn left" onClick={() => scrollSlider(-1)}>‹</button>

          <div className="slider-steps" id="slider">
            <div className="step"><span className="step-number">1</span><h3>Kullanacağınız anket türünü belirleyin</h3><p>Amacınıza uygun anket türünü seçin.</p></div>
            <div className="step"><span className="step-number">2</span><h3>Anketinizi yazın</h3><p>Katılımcılara sormak istediğiniz soruları hazırlayın.</p></div>
            <div className="step"><span className="step-number">3</span><h3>Hedef kitlenizi seçin</h3><p>Doğru kişilere anketinizi yönlendirin.</p></div>
            <div className="step"><span className="step-number">4</span><h3>Bağlantı linki oluşturun</h3><p>Paylaşım bağlantısını otomatik oluşturun.</p></div>
            <div className="step"><span className="step-number">5</span><h3>Linki paylaşın</h3><p>E-posta veya sosyal medya üzerinden gönderin.</p></div>
            <div className="step"><span className="step-number">6</span><h3>Analizleri görün</h3><p>Yanıtları anlık olarak izleyin.</p></div>
          </div>

          <button className="arrow-btn right" onClick={() => scrollSlider(1)}>›</button>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>© 2025 AnketApp - Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}

export default Anasayfa;