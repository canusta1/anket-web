import React, { useState } from "react";
import "./AnketOlustur.css";
import { FaBars, FaUser, FaChartBar, FaClipboardList, FaSignOutAlt, FaPlus, FaTrash, FaSpinner, FaMagic } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaRobot } from "react-icons/fa";

function AnketOlustur() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiFormMode, setAiFormMode] = useState(false); // AI form ekranı açık mı?
  const [aiTopic, setAiTopic] = useState("");
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [anketBaslik, setAnketBaslik] = useState("");
  const [sorular, setSorular] = useState([]);
  const [editMode, setEditMode] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => navigate("/giris");

  const handleSifirdanAnket = () => {
    console.log("🚀 Sıfırdan Anket'e tıklandı, yönlendiriliyor...");
    navigate("/sifirdan-anket");
  };

  const handleYapayZeka = () => {
    console.log("🤖 AI Form ekranı açılıyor...");
    setAiFormMode(true);
  };

  const handleAIileOlustur = async () => {
    if (!aiTopic.trim()) {
      alert("Lütfen bir anket konusu girin!");
      return;
    }

    if (aiQuestionCount < 1 || aiQuestionCount > 50) {
      alert("Soru sayısı 1-50 arasında olmalıdır!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/ai/generate-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: aiTopic,
          questionCount: aiQuestionCount
        })
      });

      const result = await response.json();

      if (result.success) {
        // Anket verilerini localStorage'a kaydet
        const anketVerisi = {
            baslik: result.data.anketBaslik,
            sorular: result.data.sorular,
            aiIleOlusturuldu: true
        };
        localStorage.setItem('anket_verisi', JSON.stringify(anketVerisi));
        
        // AIileAnket sayfasına yönlendir (modal kapalı)
        navigate("/ai-ile-anket", { 
            state: { 
                openModal: false 
            } 
        });
        console.log("✨ Anket başarıyla oluşturuldu!");
      } else {
        alert("❌ Hata: " + result.error);
      }

    } catch (error) {
      console.error('AI Hatası:', error);
      alert("❌ Anket oluşturulurken bir hata oluştu. Backend'in çalıştığından emin olun.");
    } finally {
      setLoading(false);
    }
  };

  // Düzenleme fonksiyonları
  const handleSoruDegis = (id, yeniMetin) => {
    setSorular(sorular.map((s) => (s.id === id ? { ...s, metin: yeniMetin } : s)));
  };

  const handleTipDegis = (id, tip) => {
    setSorular(
      sorular.map((s) =>
        s.id === id
          ? { ...s, tip, secenekler: tip.includes("coktan") ? s.secenekler.length > 0 ? s.secenekler : ["", ""] : [] }
          : s
      )
    );
  };

  const handleSecenekEkle = (id) => {
    setSorular(
      sorular.map((s) =>
        s.id === id ? { ...s, secenekler: [...s.secenekler, ""] } : s
      )
    );
  };

  const handleSecenekDegis = (id, index, text) => {
    setSorular(
      sorular.map((s) => {
        if (s.id === id) {
          const yeniSecenekler = [...s.secenekler];
          yeniSecenekler[index] = text;
          return { ...s, secenekler: yeniSecenekler };
        }
        return s;
      })
    );
  };

  const handleSecenekSil = (id, index) => {
    setSorular(
      sorular.map((s) => {
        if (s.id === id) {
          const yeniSecenekler = s.secenekler.filter((_, i) => i !== index);
          return { ...s, secenekler: yeniSecenekler };
        }
        return s;
      })
    );
  };

  const handleZorunluDegis = (id) => {
    setSorular(sorular.map((s) => (s.id === id ? { ...s, zorunlu: !s.zorunlu } : s)));
  };

  const handleSoruSil = (id) => {
    setSorular(sorular.filter(s => s.id !== id));
  };

  const handleAnketiYayinla = () => {
    if (sorular.length === 0) {
      alert("En az bir soru eklemelisiniz!");
      return;
    }
    console.log("Yayınlanacak anket:", { anketBaslik, sorular });
    alert("🎉 Anket başarıyla yayınlandı!");
  };

  const handleKopyala = () => alert("Anket kopyalama özelliği yakında gelecek!");
  const handleYapistir = () => alert("Soruları yapıştırma özelliği yakında gelecek!");


  // AI Form Ekranı
  if (aiFormMode) {
    return (
      <div className="panel-container">
        <nav className="panel-navbar">
          <div className="nav-left">
            <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
            <span className="panel-logo">AnketApp</span>
          </div>
          <div className="nav-right">
            <a href="/">Ana Sayfa</a>
            <button className="btn-white" onClick={() => setAiFormMode(false)}>Geri</button>
          </div>
        </nav>

        <div className={`sidebar ${menuOpen ? "open" : ""}`}>
          <ul>
            <li onClick={() => navigate('/profil')}><FaUser className="icon" /> Profil</li>
            <li><FaClipboardList className="icon" /> Anket Oluştur</li>
            <li><FaChartBar className="icon" /> Sonuçları Gör</li>
            <li onClick={handleLogout}><FaSignOutAlt className="icon" /> Çıkış Yap</li>
          </ul>
        </div>

        <main className="anket-main" style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 70px)",
          padding: "0",
          overflow: "hidden",
        }}>
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 12px 45px rgba(0,0,0,0.12)",
            padding: "50px",
            width: "100%",
            maxWidth: "650px",
            maxHeight: "90vh",
            overflowY: "auto"
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '35px'
            }}>
              <FaRobot style={{
                fontSize: '55px',
                color: '#667eea',
                marginRight: '15px'
              }} />
              <div>
                <h1 style={{
                  margin: '0',
                  fontSize: '30px',
                  color: '#333',
                  fontWeight: '700'
                }}>🤖 AI ile Anket Oluştur</h1>
                <p style={{ margin: '4px 0 0', color: '#666' }}>
                  Yapay zeka size profesyonel anket soruları oluşturacak
                </p>
              </div>
            </div>

            {/* ANKET KONUSU (BÜYÜK TEXTAREA) */}
            <div style={{ marginBottom: "25px" }}>
              <label style={{
                display: "block",
                fontSize: "15px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#333"
              }}>📝 Anket Konusu</label>

              <textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Örn: Müşteri memnuniyeti, ürün kalitesi, hizmet değerlendirmesi..."
                disabled={loading}
                style={{
                  width: "100%",
                  height: "130px",
                  padding: "15px",
                  fontSize: "15px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "10px",
                  resize: "vertical",
                  backgroundColor: loading ? "#f5f5f5" : "#fff",
                  transition: "border-color 0.3s",
                  outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
            </div>

            {/* SORU SAYISI SLIDER */}
            <div style={{ marginBottom: "30px" }}>
              <label style={{
                display: "block",
                fontSize: "15px",
                fontWeight: "600",
                marginBottom: "8px",
                color: "#333"
              }}>🔢 Kaç Soru Oluştursun?</label>

              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={aiQuestionCount}
                  onChange={(e) => setAiQuestionCount(parseInt(e.target.value))}
                  disabled={loading}
                  style={{
                    flex: 1,
                    height: "6px",
                    borderRadius: "4px",
                    background: "#ddd",
                    cursor: loading ? "not-allowed" : "pointer"
                  }}
                />

                <div style={{
                  backgroundColor: "#667eea",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  minWidth: "45px",
                  textAlign: "center"
                }}>
                  {aiQuestionCount}
                </div>
              </div>
            </div>

            {/* BUTONLAR */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setAiFormMode(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  fontSize: "15px",
                  fontWeight: "600",
                  borderRadius: "10px",
                  border: "2px solid #ccc",
                  backgroundColor: "#fff",
                  cursor: loading ? "not-allowed" : "pointer"
                }}
              >
                İptal Et
              </button>

              <button
                onClick={handleAIileOlustur}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "14px 20px",
                  fontSize: "15px",
                  fontWeight: "600",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#667eea",
                  color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {loading ? (
                  <>
                    <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <FaMagic />
                    Anket Oluştur
                  </>
                )}
              </button>
            </div>

            <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          </div>
        </main>
      </div>
    );
  }


  // Edit Ekranı
  if (editMode) {
    return (
      <div className="panel-container">
        {/* Navbar */}
        <nav className="panel-navbar">
          <div className="nav-left">
            <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
            <span className="panel-logo">AnketApp</span>
          </div>

          <div className="nav-right">
            <a href="/">Ana Sayfa</a>
            <button className="btn-white" onClick={() => setEditMode(false)}>Geri</button>
          </div>
        </nav>

        {/* Sidebar */}
        <div className={`sidebar ${menuOpen ? "open" : ""}`}>
          <ul>
            <li onClick={() => navigate('/profil')}><FaUser className="icon" /> Profil</li>
            <li><FaClipboardList className="icon" /> Anket Oluştur</li>
            <li><FaChartBar className="icon" /> Sonuçları Gör</li>
            <li onClick={handleLogout}><FaSignOutAlt className="icon" /> Çıkış Yap</li>
          </ul>
        </div>

        {/* İçerik - Düzenleme Ekranı */}
        <main className="anket-main">
          <div className="sifirdan-anket-container">
            <div className="sifirdan-soru-olusturma-ekrani">
              <div className="sifirdan-soru-listesi-header">
                <div>
                  <h2>📋 {anketBaslik}</h2>
                  <input
                    type="text"
                    value={anketBaslik}
                    onChange={(e) => setAnketBaslik(e.target.value)}
                    placeholder="Anket başlığını düzenleyin..."
                    className="anket-baslik-input"
                    style={{
                      fontSize: "1.2em",
                      marginTop: "10px",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      width: "100%"
                    }}
                  />
                </div>
                <span className="sifirdan-soru-sayisi-badge">{sorular.length} soru</span>
              </div>

              <div className="sifirdan-sorular-listesi">
                {sorular.map((soru, index) => (
                  <div key={soru.id} className="sifirdan-modern-soru-kutusu">
                    <div className="sifirdan-soru-ust-alani">
                      <div className="sifirdan-soru-numarasi">Soru {index + 1}</div>
                      <button
                        className="sifirdan-soru-sil-butonu"
                        onClick={() => handleSoruSil(soru.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>

                    <div className="sifirdan-soru-metin-alani">
                      <input
                        type="text"
                        placeholder="Sorunuzu buraya yazın..."
                        value={soru.metin}
                        onChange={(e) => handleSoruDegis(soru.id, e.target.value)}
                        className="sifirdan-soru-metin-input"
                      />
                    </div>

                    <div className="sifirdan-soru-ayarlari">
                      <div className="sifirdan-tip-secim-alani">
                        <label>Soru Tipi:</label>
                        <select
                          value={soru.tip}
                          onChange={(e) => handleTipDegis(soru.id, e.target.value)}
                          className="sifirdan-tip-select"
                        >
                          <option value="acik-uclu">Açık Uçlu</option>
                          <option value="coktan-tek">Çoktan Seçmeli (Tek Cevap)</option>
                          <option value="coktan-coklu">Çoktan Seçmeli (Çoklu Cevap)</option>
                          <option value="slider">Slider (1-10)</option>
                        </select>
                      </div>

                      <div className="sifirdan-zorunluluk-alani">
                        <label className="sifirdan-switch">
                          <input
                            type="checkbox"
                            checked={soru.zorunlu}
                            onChange={() => handleZorunluDegis(soru.id)}
                          />
                          <span className="sifirdan-slider round"></span>
                        </label>
                        <span>{soru.zorunlu ? "Zorunlu Soru" : "İsteğe Bağlı Soru"}</span>
                      </div>
                    </div>

                    {/* Cevap Alanları */}
                    <div className="sifirdan-cevap-alani">
                      {soru.tip === "acik-uclu" && (
                        <div className="sifirdan-acik-uclu-alani">
                          <div className="sifirdan-cevap-etiket">Cevap Alanı:</div>
                          <textarea
                            placeholder="Katılımcı bu alana cevabını yazacak..."
                            disabled
                            className="sifirdan-acik-uclu-textarea"
                          />
                        </div>
                      )}

                      {soru.tip === "slider" && (
                        <div className="sifirdan-slider-alani">
                          <div className="sifirdan-cevap-etiket">Slider Cevap:</div>
                          <div className="sifirdan-slider-container">
                            <div className="sifirdan-slider-labels">
                              <span>1</span>
                              <span>5</span>
                              <span>10</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              defaultValue="5"
                              disabled
                              className="sifirdan-modern-slider"
                            />
                          </div>
                        </div>
                      )}

                      {(soru.tip === "coktan-tek" || soru.tip === "coktan-coklu") && (
                        <div className="sifirdan-secenekler-alani">
                          <div className="sifirdan-cevap-etiket">Seçenekler:</div>
                          {soru.secenekler.map((secenek, i) => (
                            <div key={i} className="sifirdan-secenek-satiri">
                              <div className="sifirdan-secenek-tipi-goster">
                                {soru.tip === "coktan-tek" ? (
                                  <div className="sifirdan-radio-nokta"></div>
                                ) : (
                                  <div className="sifirdan-checkbox-kare"></div>
                                )}
                              </div>
                              <input
                                type="text"
                                placeholder={`Seçenek ${i + 1}`}
                                value={secenek}
                                onChange={(e) => handleSecenekDegis(soru.id, i, e.target.value)}
                                className="sifirdan-secenek-input"
                              />
                              {soru.secenekler.length > 1 && (
                                <button
                                  className="sifirdan-secenek-sil-butonu"
                                  onClick={() => handleSecenekSil(soru.id, i)}
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            className="sifirdan-secenek-ekle-butonu"
                            onClick={() => handleSecenekEkle(soru.id)}
                          >
                            <FaPlus style={{ marginRight: "6px" }} />
                            Yeni Seçenek Ekle
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sifirdan-anket-aksiyonlari">
                <button className="sifirdan-ikincil-buton" onClick={() => setEditMode(false)}>
                  Geri
                </button>
                <button className="sifirdan-birincil-buton" onClick={handleAnketiYayinla}>
                  Anketi Yayınla
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="panel-container">
      {/* Navbar */}
      <nav className="panel-navbar">
        <div className="nav-left">
          <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
          <span className="panel-logo">AnketApp</span>
        </div>

        <div className="nav-right">
          <a href="/">Ana Sayfa</a>
          <button className="btn-white">Anket Oluştur</button>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`sidebar ${menuOpen ? "open" : ""}`}>
        <ul>
          <li onClick={() => navigate('/profil')}><FaUser className="icon" /> Profil</li>
          <li><FaClipboardList className="icon" /> Anket Oluştur</li>
          <li><FaChartBar className="icon" /> Sonuçları Gör</li>
          <li onClick={handleLogout}><FaSignOutAlt className="icon" /> Çıkış Yap</li>
        </ul>
      </div>

      {/* İçerik */}
      <main className="anket-main">
        <h1>Nasıl bir anket oluşturmak istiyorsunuz?</h1>
        <div className="anket-grid">
          <div className="anket-card" onClick={handleSifirdanAnket}>
            <img src="https://img.icons8.com/color/96/000000/survey.png" alt="Sıfırdan" />
            <h3>Sıfırdan Anket Oluştur</h3>
            <p>Boş bir sayfadan başlayarak kendi sorularınızı oluşturun.</p>
          </div>

          <div className="anket-card" onClick={handleYapayZeka}>
            <img src="https://img.icons8.com/color/96/000000/artificial-intelligence.png" alt="Yapay Zeka" />
            <h3>Yapay Zeka ile Anket Oluştur</h3>
            <p>Kısa bir açıklama girin, yapay zeka sizin için anket tasarlasın.</p>
          </div>

          <div className="anket-card" onClick={handleKopyala}>
            <img src="https://img.icons8.com/color/96/000000/copy.png" alt="Kopyala" />
            <h3>Daha Önceki Anketi Kopyalayın</h3>
            <p>Mevcut anketlerinizi temel alarak yeni bir sürüm oluşturun.</p>
          </div>

          <div className="anket-card" onClick={handleYapistir}>
            <img src="https://img.icons8.com/color/96/000000/paste.png" alt="Soruları Yapıştır" />
            <h3>Soruları Yapıştırarak Oluştur</h3>
            <p>Elinizdeki soruları yapıştırın, sistem otomatik olarak anketi oluştursun.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AnketOlustur;