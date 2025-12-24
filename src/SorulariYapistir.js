import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaPaste,
    FaCheckCircle,
    FaEdit,
    FaUpload
} from "react-icons/fa";
import "./SorulariYapistir.css";

function SorulariYapistir() {
    const [anketBaslik, setAnketBaslik] = useState("");
    const [anketAciklama, setAnketAciklama] = useState("");
    const [metin, setMetin] = useState("");
    const [onizleme, setOnizleme] = useState(null);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleGeriDon = () => navigate("/anket-olustur");

    // JSON dosyası yükleme fonksiyonu
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Sadece JSON dosyalarını kabul et
        if (!file.name.endsWith('.json')) {
            alert("❌ Lütfen geçerli bir JSON dosyası seçin!");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // JSON formatını kontrol et ve dönüştür
                // Format 1: anketBaslik / anket_adi
                const baslik = jsonData.anketBaslik || jsonData.anket_adi || jsonData.title;
                if (baslik) {
                    setAnketBaslik(baslik);
                }
                
                // Format 2: anketAciklama / anket_aciklamasi
                const aciklama = jsonData.anketAciklama || jsonData.anket_aciklamasi || jsonData.description;
                if (aciklama) {
                    setAnketAciklama(aciklama);
                }
                
                if (jsonData.sorular && Array.isArray(jsonData.sorular)) {
                    // JSON'dan gelen soruları formatla
                    const formattedSorular = jsonData.sorular.map((soru, index) => {
                        // Soru metnini al (farklı format destekleri)
                        const soruMetni = soru.soruMetni || soru.soru_metni || soru.metin || soru.soru || '';
                        
                        // Cevap tipini al ve dönüştür
                        const cevapTipi = soru.soruTipi || soru.cevap_tipi || soru.tip || 'acik-uclu';
                        let anketTipi = 'acik-uclu';
                        
                        // Cevap tipi dönüşümleri
                        if (cevapTipi === 'tek_secimli' || cevapTipi === 'coktan-tek' || cevapTipi === 'radio') {
                            anketTipi = 'coktan-tek';
                        } else if (cevapTipi === 'coklu_secimli' || cevapTipi === 'coktan-coklu' || cevapTipi === 'checkbox') {
                            anketTipi = 'coktan-coklu';
                        } else if (cevapTipi === 'serbest_metin' || cevapTipi === 'acik-uclu' || cevapTipi === 'text') {
                            anketTipi = 'acik-uclu';
                        } else if (cevapTipi === 'slider' || cevapTipi === 'skala') {
                            anketTipi = 'slider';
                        }
                        
                        // Seçenekleri al ve formatla
                        const secenekler = (soru.secenekler || []).map(sec => {
                            if (typeof sec === 'string') {
                                return sec;
                            } else if (sec.etiket) {
                                return sec.etiket;
                            } else if (sec.metin) {
                                return sec.metin;
                            } else if (sec.label) {
                                return sec.label;
                            }
                            return '';
                        });
                        
                        return {
                            id: Date.now() + index + Math.random(),
                            metin: soruMetni,
                            tip: anketTipi,
                            secenekler: secenekler,
                            zorunlu: soru.zorunlu !== undefined ? soru.zorunlu : true
                        };
                    });
                    
                    setOnizleme(formattedSorular);
                    
                    // Metin alanını da doldur
                    const metinFormati = formattedSorular.map((soru, idx) => {
                        let soruStr = `${idx + 1}. "${soru.metin}"\n`;
                        if (soru.secenekler && soru.secenekler.length > 0) {
                            soru.secenekler.forEach((sec, i) => {
                                soruStr += `${String.fromCharCode(65 + i)}) ${sec}\n`;
                            });
                        }
                        return soruStr;
                    }).join('\n');
                    
                    setMetin(metinFormati);
                    
                } else {
                    alert("❌ JSON dosyasında 'sorular' dizisi bulunamadı!");
                }
            } catch (error) {
                console.error("JSON parse hatası:", error);
                alert("❌ JSON dosyası okunamadı! Lütfen geçerli bir JSON dosyası seçin.");
            }
        };
        
        reader.onerror = () => {
            alert("❌ Dosya okuma hatası!");
        };
        
        reader.readAsText(file);
        
        // Input'u sıfırla (aynı dosyayı tekrar seçebilmek için)
        event.target.value = '';
    };

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
                                    <label>Soruları Yapıştır veya JSON Yükle</label>
                                    
                                    {/* JSON Yükleme Butonu */}
                                    <div className="yapistir-upload-section">
                                        <button 
                                            className="yapistir-upload-btn"
                                            onClick={() => fileInputRef.current?.click()}
                                            type="button"
                                        >
                                            <FaUpload /> JSON Dosyası Yükle
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".json"
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <span className="yapistir-upload-info">
                                            veya aşağıya manuel olarak yapıştırın
                                        </span>
                                    </div>

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
