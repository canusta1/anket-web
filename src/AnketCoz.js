import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./SifirdanAnket.css"; // Aynı CSS'i kullanabiliriz

function AnketCoz() {
  const { id } = useParams(); // Link kodunu al
  const [anket, setAnket] = useState(null);
  const [cevaplar, setCevaplar] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Anketi yükle
  useEffect(() => {
    const fetchAnket = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/surveys/by-link/${id}`);
        const data = await res.json();
        
        if (data.success) {
          setAnket(data.data);
          // Cevaplar state'ini başlat
          const initialCevaplar = {};
          data.data.sorular.forEach(soru => {
            initialCevaplar[soru.soruId] = "";
          });
          setCevaplar(initialCevaplar);
        } else {
          alert("Anket bulunamadı: " + data.error);
        }
      } catch (err) {
        alert("Hata: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnket();
  }, [id]);

  // Cevap değişimi
  const handleCevapDegis = (soruId, value) => {
    setCevaplar(prev => ({
      ...prev,
      [soruId]: value
    }));
  };

  // Çoklu seçim cevabı
  const handleCokluSecim = (soruId, value) => {
    const current = Array.isArray(cevaplar[soruId]) ? cevaplar[soruId] : [];
    if (current.includes(value)) {
      setCevaplar(prev => ({
        ...prev,
        [soruId]: current.filter(v => v !== value)
      }));
    } else {
      setCevaplar(prev => ({
        ...prev,
        [soruId]: [...current, value]
      }));
    }
  };

  // Anketi gönder
  const handleGonder = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/surveys/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anketId: anket._id,
          cevaplar: cevaplar,
          katilimciBilgileri: {}
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        alert("✅ Cevaplarınız başarıyla kaydedildi!");
      } else {
        alert("❌ Hata: " + data.error);
      }
    } catch (err) {
      alert("❌ Gönderme hatası: " + err.message);
    }
  };

  if (loading) return <div className="sifirdan-anket-container"><p>Yükleniyor...</p></div>;
  if (!anket) return <div className="sifirdan-anket-container"><p>Anket bulunamadı</p></div>;
  if (submitted) return <div className="sifirdan-anket-container"><h2>✅ Teşekkürler!</h2><p>Cevaplarınız başarıyla kaydedildi.</p></div>;

  return (
    <div className="sifirdan-anket-container">
      <div className="sifirdan-soru-olusturma-ekrani">
        <div className="sifirdan-soru-listesi-header">
          <h2>📋 {anket.anketBaslik}</h2>
          {anket.anketAciklama && <p>{anket.anketAciklama}</p>}
        </div>

        <div className="sifirdan-sorular-listesi">
          {anket.sorular.map((soru, index) => (
            <div key={soru.soruId} className="sifirdan-modern-soru-kutusu">
              <div className="sifirdan-soru-ust-alani">
                <div className="sifirdan-soru-numarasi">Soru {index + 1}</div>
              </div>

              <div className="sifirdan-soru-metin-alani">
                <label>{soru.soruMetni} {soru.zorunlu && <span style={{color: 'red'}}>*</span>}</label>
              </div>

              {/* Açık Uçlu */}
              {soru.soruTipi === "acik-uclu" && (
                <textarea
                  placeholder="Cevabınızı yazınız..."
                  value={cevaplar[soru.soruId] || ""}
                  onChange={(e) => handleCevapDegis(soru.soruId, e.target.value)}
                  className="sifirdan-acik-uclu-textarea"
                  required={soru.zorunlu}
                />
              )}

              {/* Çoktan Seçmeli - Tek Cevap */}
              {soru.soruTipi === "coktan-tek" && (
                <div>
                  {soru.secenekler.map((secenek) => (
                    <label key={secenek.secenekId} style={{display: 'block', margin: '8px 0'}}>
                      <input
                        type="radio"
                        name={soru.soruId}
                        value={secenek.secenekId}
                        checked={cevaplar[soru.soruId] === secenek.secenekId}
                        onChange={(e) => handleCevapDegis(soru.soruId, e.target.value)}
                        required={soru.zorunlu}
                      />
                      {" "}{secenek.metin}
                    </label>
                  ))}
                </div>
              )}

              {/* Çoktan Seçmeli - Çoklu Cevap */}
              {soru.soruTipi === "coktan-coklu" && (
                <div>
                  {soru.secenekler.map((secenek) => (
                    <label key={secenek.secenekId} style={{display: 'block', margin: '8px 0'}}>
                      <input
                        type="checkbox"
                        value={secenek.secenekId}
                        checked={(Array.isArray(cevaplar[soru.soruId]) && cevaplar[soru.soruId].includes(secenek.secenekId)) || false}
                        onChange={(e) => handleCokluSecim(soru.soruId, e.target.value)}
                      />
                      {" "}{secenek.metin}
                    </label>
                  ))}
                </div>
              )}

              {/* Slider */}
              {soru.soruTipi === "slider" && (
                <div>
                  <input
                    type="range"
                    min={soru.sliderMin || 1}
                    max={soru.sliderMax || 10}
                    value={cevaplar[soru.soruId] || soru.sliderVarsayilan || 5}
                    onChange={(e) => handleCevapDegis(soru.soruId, e.target.value)}
                    className="sifirdan-modern-slider"
                  />
                  <p>Seçilen: {cevaplar[soru.soruId] || soru.sliderVarsayilan || 5}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="sifirdan-anket-aksiyonlari">
          <button className="sifirdan-birincil-buton" onClick={handleGonder}>
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnketCoz;
