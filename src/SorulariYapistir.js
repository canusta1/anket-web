import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaPaste,
    FaCheckCircle,
    FaEdit
} from "react-icons/fa";
import "./SorulariYapistir.css";

function SorulariYapistir() {
    const [anketBaslik, setAnketBaslik] = useState("");
    const [anketAciklama, setAnketAciklama] = useState("");
    const [metin, setMetin] = useState("");
    const [onizleme, setOnizleme] = useState(null);
    const navigate = useNavigate();

    const handleGeriDon = () => navigate("/anket-olustur");

    // Metin parse fonksiyonu - Gelişmiş
    const parseAnketMetni = (text) => {
        const sorular = [];
        const satirlar = text.split('\n');
        
        let aktifSoru = null;
        let soruNumarasi = 0;
        
        for (let i = 0; i < satirlar.length; i++) {
            const satir = satirlar[i].trim();
            
            // Boş satırları atla
            if (!satir) {
                continue;
            }
            
            // Soru başlangıcını tespit et 
            // Format: "1. "Soru metni?"" veya sadece ""Soru metni?""
            const soruMatch = satir.match(/^(\d+)\.\s*[""](.+?)[""](.*)/) || 
                             satir.match(/^[""](.+?)[""](.*)$/);
            
            if (soruMatch) {
                // Önceki soruyu kaydet
                if (aktifSoru) {
                    sorular.push(aktifSoru);
                }
                
                // Yeni soru başlat
                soruNumarasi++;
                const soruMetni = soruMatch[2] || soruMatch[1];
                const soruDevami = soruMatch[3] || soruMatch[2] || '';
                
                aktifSoru = {
                    id: Date.now() + soruNumarasi + Math.random(),
                    metin: (soruMetni + ' ' + soruDevami).trim(),
                    tip: "acik-uclu", // Varsayılan
                    secenekler: [],
                    zorunlu: true
                };
            } 
            // Seçenek tespit et (A), B), C), D) formatı veya a), b), c), d))
            else if (satir.match(/^[A-Za-z]\)\s*/)) {
                if (aktifSoru) {
                    // A) sonrasındaki metni al
                    const secenekMetni = satir.replace(/^[A-Za-z]\)\s*/, '').trim();
                    
                    if (secenekMetni) {
                        aktifSoru.secenekler.push(secenekMetni);
                        
                        // Seçenek varsa çoktan seçmeli yap
                        aktifSoru.tip = "coktan-tek";
                    }
                }
            }
            // Eğer soru varsa ve yeni bir soru/seçenek değilse
            // ve metinde tırnak işareti yoksa, önceki içeriğe ekle
            else if (aktifSoru && !satir.match(/^[A-Za-z]\)/) && !satir.match(/^[""]/) && !satir.match(/^\d+\./)) {
                // Eğer son seçeneğe ait bir devam metni ise
                if (aktifSoru.secenekler.length > 0) {
                    // Son seçeneğe ekle
                    const lastIndex = aktifSoru.secenekler.length - 1;
                    aktifSoru.secenekler[lastIndex] += ' ' + satir;
                } else {
                    // Soru metnine ekle
                    aktifSoru.metin += ' ' + satir;
                }
            }
        }
        
        // Son soruyu ekle
        if (aktifSoru) {
            sorular.push(aktifSoru);
        }
        
        return sorular;
    };

    // Metin değiştiğinde otomatik önizleme
    useEffect(() => {
        if (metin.trim()) {
            const parsedSorular = parseAnketMetni(metin);
            setOnizleme(parsedSorular);
        } else {
            setOnizleme(null);
        }
    }, [metin]);

    // Anketi düzenlemeye gönder
    const handleDuzenle = () => {
        if (!anketBaslik.trim()) {
            alert("Lütfen anket başlığı girin!");
            return;
        }

        if (!onizleme || onizleme.length === 0) {
            alert("Lütfen geçerli sorular yapıştırın!");
            return;
        }

        // SifirdanAnket'e yönlendir
        navigate("/sifirdan-anket", {
            state: {
                template: {
                    anketBaslik,
                    anketAciklama,
                    sorular: onizleme
                }
            }
        });
    };

    return (
        <div className="anket-kopyala-container">
            <div className="yapistir-container">
                    {/* Header - AnketKopyala Stili */}
                    <div className="ak-header">
                        <button className="ak-btn-back" onClick={handleGeriDon}>
                            <FaArrowLeft /> Geri Dön
                        </button>
                        <h1>📋 Soruları Yapıştır</h1>
                        <p className="ak-subtitle">
                            Hazır anket sorularınızı buraya yapıştırın ve otomatik olarak ankete dönüştürün
                        </p>
                    </div>

                    <div className="yapistir-content">
                        {/* Sol Panel - Giriş Kartı */}
                        <div className="yapistir-input-card">
                            <div className="ak-card-header">
                                <FaPaste className="ak-card-icon" />
                                <h3>Anket Bilgileri ve Sorular</h3>
                            </div>
                            
                            <div className="ak-card-body">
                                <div className="yapistir-input-group">
                                    <label>Anket Başlığı *</label>
                                    <input
                                        type="text"
                                        className="yapistir-input"
                                        placeholder="Örn: Temizlik Alışkanlıkları Anketi"
                                        value={anketBaslik}
                                        onChange={(e) => setAnketBaslik(e.target.value)}
                                    />
                                </div>

                                <div className="yapistir-input-group">
                                    <label>Anket Açıklaması (İsteğe Bağlı)</label>
                                    <textarea
                                        className="yapistir-textarea"
                                        placeholder="Anketin amacını kısaca açıklayın..."
                                        value={anketAciklama}
                                        onChange={(e) => setAnketAciklama(e.target.value)}
                                        rows="2"
                                    />
                                </div>

                                <div className="yapistir-divider"></div>

                                <div className="yapistir-input-group">
                                    <label>Soruları Yapıştır</label>
                                    <p className="yapistir-aciklama">
                                        Sorularınızı şu formatta yapıştırın:
                                    </p>
                                    <div className="yapistir-format-ornegi">
                                        <code>
                                            1. "Soru metni?"<br />
                                            A) Seçenek 1<br />
                                            B) Seçenek 2
                                        </code>
                                    </div>

                                    <textarea
                                        className="yapistir-metin-alani"
                                        placeholder='1. "Soru metni?"&#10;A) Seçenek 1&#10;B) Seçenek 2&#10;&#10;2. "İkinci soru?"&#10;A) Cevap 1&#10;B) Cevap 2'
                                        value={metin}
                                        onChange={(e) => setMetin(e.target.value)}
                                        rows="15"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sağ Panel - Önizleme Kartı */}
                        <div className="yapistir-preview-card">
                            {!onizleme || onizleme.length === 0 ? (
                                <div className="ak-empty">
                                    <FaPaste className="empty-icon" />
                                    <h2>Canlı Önizleme</h2>
                                    <p>Sorularınızı sol tarafa yapıştırdığınızda burada otomatik olarak görünecek</p>
                                </div>
                            ) : (
                                <>
                                    <div className="ak-card-header">
                                        <FaCheckCircle className="ak-card-icon" />
                                        <h3>Önizleme ({onizleme.length} Soru)</h3>
                                    </div>
                                    
                                    <div className="ak-card-body yapistir-preview-body">
                                        <div className="yapistir-preview-title">
                                            <h4>{anketBaslik}</h4>
                                            {anketAciklama && <p>{anketAciklama}</p>}
                                        </div>

                                        <div className="yapistir-preview-questions">
                                            {onizleme.map((soru, index) => (
                                                <div key={soru.id} className="yapistir-question-item">
                                                    <div className="yapistir-question-header">
                                                        <span className="yapistir-q-number">Soru {index + 1}</span>
                                                        <span className="yapistir-q-type">
                                                            {soru.tip === "acik-uclu" ? "Açık Uçlu" : "Çoktan Seçmeli"}
                                                        </span>
                                                    </div>
                                                    <p className="yapistir-question-text">{soru.metin}</p>
                                                    
                                                    {soru.secenekler.length > 0 && (
                                                        <div className="yapistir-options">
                                                            {soru.secenekler.map((secenek, i) => (
                                                                <div key={i} className="yapistir-option">
                                                                    <div className="yapistir-radio"></div>
                                                                    <span>{secenek}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="ak-card-footer">
                                        <button className="ak-btn-copy" onClick={handleDuzenle}>
                                            <FaEdit /> Düzenle ve Devam Et
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
    );
}

export default SorulariYapistir;
