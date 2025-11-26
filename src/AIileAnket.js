import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
    FaBars,
    FaUser,
    FaChartBar,
    FaClipboardList,
    FaSignOutAlt,
    FaArrowLeft,
    FaPlus,
    FaTrash,
    FaRobot,
    FaMagic,
    FaSpinner
} from "react-icons/fa";
import "./SifirdanAnket.css";

function AIileAnket() {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiModalOpen, setAiModalOpen] = useState(location?.state?.openModal ?? true);

    // AI için state'ler
    const [aiTopic, setAiTopic] = useState(location?.state?.topic ?? "");
    const [aiQuestionCount, setAiQuestionCount] = useState(10);

    // Anket state'leri
    const [anketBaslik, setAnketBaslik] = useState("");
    const [sorular, setSorular] = useState([]);

    const navigate = useNavigate();

    // ✅ SAYFA AÇILDIĞINDA LOCALSTORAGE'DAN OKU
    useEffect(() => {
        const kayitliVeri = localStorage.getItem('anket_verisi');
        if (kayitliVeri) {
            try {
                const anketVerisi = JSON.parse(kayitliVeri);
                console.log("📂 localStorage'dan anket yüklendi:", anketVerisi);
                setAnketBaslik(anketVerisi.baslik || "");
                setSorular(anketVerisi.sorular || []);
                setAiModalOpen(false); // Modal'ı kapat, direkt düzenleme ekranını göster
            } catch (error) {
                console.error("❌ localStorage okuma hatası:", error);
            }
        }
    }, []);

    const handleLogout = () => navigate("/giris");
    const handleGeriDon = () => navigate("/anket-olustur");
    const handleAnketOlustur = () => navigate("/anket-olustur");

    // AI ile anket oluştur
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
                setAnketBaslik(result.data.anketBaslik);
                setSorular(result.data.sorular);
                setAiModalOpen(false);
                alert("✨ Anket başarıyla oluşturuldu! Şimdi düzenleyebilirsiniz.");
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

    // Soru düzenleme fonksiyonları
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

    const handleIleriGit = () => {
        console.log("🔍 İleri butonuna tıklandı!");
        console.log("📊 Anket başlığı:", anketBaslik);
        console.log("📝 Sorular sayısı:", sorular.length);
        
        if (sorular.length === 0) {
            alert("❌ En az bir soru eklemelisiniz!");
            return;
        }

        // Boş soru kontrolü
        const bosSorular = sorular.filter(s => !s.metin.trim());
        if (bosSorular.length > 0) {
            alert("❌ Lütfen tüm soruları doldurun!");
            return;
        }

        // Çoktan seçmeli sorularda seçenek kontrolü
        const eksikSecenekliSorular = sorular.filter(s => 
            (s.tip === "coktan-tek" || s.tip === "coktan-coklu") && 
            s.secenekler.filter(sec => sec.trim()).length < 2
        );
        
        if (eksikSecenekliSorular.length > 0) {
            alert("❌ Çoktan seçmeli sorularda en az 2 seçenek olmalıdır!");
            return;
        }

        // Anket başlığı kontrolü
        if (!anketBaslik.trim()) {
            alert("❌ Lütfen anket başlığı girin!");
            return;
        }

        // Anket verilerini localStorage'a kaydet
        const anketVerisi = {
            baslik: anketBaslik,
            sorular: sorular,
            olusturmaTarihi: new Date().toISOString(),
            aiIleOlusturuldu: true
        };
        
        console.log("💾 Kaydedilen anket verisi:", anketVerisi);
        localStorage.setItem('anket_verisi', JSON.stringify(anketVerisi));
        
        console.log("✅ Hedef kitle seçimi sayfasına yönlendiriliyor...");
        navigate("/hedef-kitle-secimi");
    };

    return (
        <div className="panel-container">
            {/* Navbar */}
            <nav className="panel-navbar">
                <div className="nav-left">
                    <FaBars className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
                    <FaArrowLeft className="menu-icon" onClick={handleGeriDon} style={{ marginRight: "15px" }} />
                    <span className="panel-logo">AnketApp</span>
                </div>

                <div className="nav-right">
                    <Link to="/" className="nav-link">Ana Sayfa</Link>
                    <button className="btn-white" onClick={handleAnketOlustur}>Anket Oluştur</button>
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

            {/* Ana İçerik */}
            <main className="anket-main">
                <div className="sifirdan-anket-container">

                    {/* AI Modal */}
                    {aiModalOpen && (
                        <div className="ai-modal-overlay">
                            <div className="ai-modal">
                                <div className="ai-modal-header">
                                    <FaRobot className="ai-icon" />
                                    <h2>🤖 AI ile Anket Oluştur</h2>
                                    <p>Yapay zeka size profesyonel anket soruları oluşturacak</p>
                                </div>

                                <div className="ai-input-group">
                                    <label>📝 Anket Konusu</label>
                                    <textarea
                                        value={aiTopic}
                                        onChange={(e) => setAiTopic(e.target.value)}
                                        placeholder="Örn: Restoran temizliği ve hijyen hakkında açık uçlu sorular oluştur"
                                        className="ai-topic-input"
                                        disabled={loading}
                                        rows="5"
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div className="ai-input-group">
                                    <label>🔢 Kaç Soru?</label>
                                    <input
                                        type="number"
                                        value={aiQuestionCount}
                                        onChange={(e) => setAiQuestionCount(parseInt(e.target.value) || 10)}
                                        min="1"
                                        max="50"
                                        className="ai-count-input"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="ai-modal-actions">
                                    <button
                                        className="ai-cancel-btn"
                                        onClick={handleGeriDon}
                                        disabled={loading}
                                    >
                                        İptal
                                    </button>
                                    <button
                                        className="ai-generate-btn"
                                        onClick={handleAIileOlustur}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="spinning" />
                                                Oluşturuluyor...
                                            </>
                                        ) : (
                                            <>
                                                <FaMagic />
                                                AI ile Oluştur
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Anket Düzenleme Ekranı */}
                    {!aiModalOpen && (
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
                                <button
                                    className="sifirdan-ikincil-buton"
                                    onClick={() => {
                                        if (window.confirm("Yeniden AI ile oluşturmak ister misiniz?")) {
                                            setAiModalOpen(true);
                                            setSorular([]);
                                        }
                                    }}
                                >
                                    Yeniden Oluştur
                                </button>
                                <button className="sifirdan-birincil-buton" onClick={handleIleriGit}>
                                    İLERİ
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AIileAnket;