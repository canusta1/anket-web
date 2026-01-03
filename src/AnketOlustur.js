import React, { useState, useEffect } from "react";
import "./AnketOlustur.css";
import { FaPlus, FaRobot, FaCopy, FaPaste } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";

function AnketOlustur() {
  const [titleText, setTitleText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const navigate = useNavigate();

  const fullTitle = "Nasıl bir anket oluşturmak istiyorsunuz?";

  // Yazı animasyonu
  useEffect(() => {
    if (charIndex < fullTitle.length) {
      const timer = setTimeout(() => {
        setTitleText(fullTitle.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 25);
      return () => clearTimeout(timer);
    }
  }, [charIndex, fullTitle]);

  return (
    <div className="ac-container">
      {/* Global Navbar */}
      <Navbar activePage="olustur" showCreateButton={false} />

      {/* Main Content */}
      <main className="anket-main">
        <h1>
          {titleText}
          <span style={{ animation: 'blink 1s infinite' }}>|</span>
        </h1>

        <div className="option-cards">
          {/* SIFIRDAN ANKET */}
          <div className="option-card standard" onClick={() => navigate("/sifirdan-anket")}>
            <div className="card-icon">
              <FaPlus />
            </div>
            <div className="card-badge new">Popüler</div>
            <h3>Sıfırdan Oluştur</h3>
            <p>Boş bir sayfadan başlayarak kendi sorularınızı ve akışınızı oluşturun.</p>
          </div>

          {/* YAPAY ZEKA */}
          <div className="option-card ai" onClick={() => navigate("/ai-ile-anket")}>
            <div className="card-icon">
              <FaRobot />
            </div>
            <div className="card-badge beta">Yapay Zeka</div>
            <h3>AI ile Oluştur</h3>
            <p>Konuyu söyleyin, yapay zeka sizin için en uygun anket sorularını hazırlasın.</p>
          </div>

          {/* KOPYALA */}
          <div className="option-card copy" onClick={() => navigate("/anket-kopyala")}>
            <div className="card-icon">
              <FaCopy />
            </div>
            <h3>Anketi Kopyala</h3>
            <p>Mevcut bir anketinizi veya şablonu kopyalayarak üzerinde değişiklik yapın.</p>
          </div>

          {/* YAPIŞTIR */}
          <div className="option-card paste" onClick={() => navigate("/sorulari-yapistir")}>
            <div className="card-icon">
              <FaPaste />
            </div>
            <h3>Soruları Yapıştır</h3>
            <p>Elinizdeki soru listesini yapıştırın, otomatik forma dönüştürelim.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnketOlustur;