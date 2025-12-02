import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
    FaBars,
    FaUser,
    FaClipboardList,
    FaChartBar,
    FaSignOutAlt,
    FaArrowLeft,
    FaTrash,
    FaRobot,
    FaMagic,
    FaSpinner,
    FaPlus,
    FaMinus, // Eksi ikonu eklendi
    FaHome
} from "react-icons/fa";
import "./AIileAnket.css"; // CSS dosyasını import ediyoruz

function AIileAnket() {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // --- STATE YÖNETİMİ ---
    const [aiTopic, setAiTopic] = useState(location?.state?.topic ?? "");
    const [aiQuestionCount, setAiQuestionCount] = useState(10);
    const [anketBaslik, setAnketBaslik] = useState("");
    const [anketAciklama, setAnketAciklama] = useState("");

    const [sorular, setSorular] = useState([]);
    const [soruListesiAcik, setSoruListesiAcik] = useState(false); // False = Giriş Formu, True = Liste

    const navigate = useNavigate();

    const handleLogout = () => navigate("/giris");
    const handleGeriDon = () => navigate("/anket-olustur");
    const handleAnketOlustur = () => navigate("/anket-olustur");

    // --- SORU SAYISI ARTIRMA/AZALTMA (YENİ) ---
    const handleCountChange = (val) => {
        if (val === "") {
            setAiQuestionCount(""); // Kullanıcı sildiğinde boş kalsın
            return;
        }
        let newValue = parseInt(val);
        if (isNaN(newValue)) return;
        if (newValue > 50) newValue = 50;
        setAiQuestionCount(newValue);
    };

    const handleCountBlur = () => {
        // Inputtan çıkınca boşsa veya 1'den küçükse 1 yap
        if (aiQuestionCount === "" || aiQuestionCount < 1) {
            setAiQuestionCount(1);
        }
    };

    const increaseCount = () => {
        const current = aiQuestionCount === "" ? 0 : aiQuestionCount;
        if (current < 50) setAiQuestionCount(current + 1);
    };

    const decreaseCount = () => {
        const current = aiQuestionCount === "" ? 1 : aiQuestionCount;
        if (current > 1) setAiQuestionCount(current - 1);
    };

    // ----------------------------------------------------
    // 1. ADIM: AI İLE SORULARI OLUŞTUR
    // ----------------------------------------------------
    const handleAIileOlustur = async () => {
        if (!anketBaslik.trim()) {
            alert("❌ Lütfen anketinize bir başlık verin.");
            return;
        }
        if (!aiTopic.trim()) {
            alert("❌ Lütfen yapay zekaya bir konu (prompt) verin.");
            return;
        }
        const count = aiQuestionCount === "" ? 10 : aiQuestionCount;
        if (count < 1 || count > 50) {
            alert("❌ Soru sayısı 1 ile 50 arasında olmalıdır.");
            return;
        }

        setLoading(true);

        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/ai/generate-survey`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${localStorage.getItem("token")}` 
                },
                body: JSON.stringify({
                    topic: aiTopic,
                    questionCount: count
                })
            });

            const result = await response.json();

            if (result.success) {
                // Gelen sorulara frontend için unique ID ekle ve secenekleri normalize et
                const islenmisSorular = result.data.sorular.map((s, i) => ({
                    ...s,
                    id: Date.now() + i,
                    zorunlu: true,
                    // Seçeneklerin array olduğundan emin ol
                    secenekler: Array.isArray(s.secenekler) ? s.secenekler : []
                }));

                setSorular(islenmisSorular);
                setSoruListesiAcik(true); // Formu gizle, listeyi aç
            } else {
                alert("❌ Hata: " + (result.error || "AI servisi yanıt vermedi."));
            }

        } catch (error) {
            console.error('AI Hatası:', error);
            alert("❌ Sunucuya bağlanılamadı.");
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------
    // 2. ADIM: ANKETİ VERİTABANINA KAYDET
    // ----------------------------------------------------
    const handleDevamEt = () => {
        // 1. Validasyonlar
        const token = localStorage.getItem("token");
        if (!token) {
            alert("❌ Önce giriş yapmalısınız!");
            navigate("/giris");
            return;
        }

        if (!anketBaslik.trim()) {
            alert("❌ Anket başlığı boş olamaz!");
            return;
        }
        if (sorular.length === 0) {
            alert("❌ En az bir soru olmalı!");
            return;
        }

        // 2. Veriyi Paketle (Backend'e uygun formatta hazırlıyoruz ama göndermiyoruz)
        const backendFormatindaSorular = sorular.map((s, index) => {
            // Seçenekleri normalize et - array olduğundan emin ol
            let secenekler = [];
            if (Array.isArray(s.secenekler)) {
                secenekler = s.secenekler.map((sec, i) => {
                    // String ise direkt metni kullan, obje ise metni/text alanını al
                    const metinDegeri = typeof sec === 'string' ? sec : (sec.metni || sec.metin || sec.text || '');
                    return {
                        metni: metinDegeri // Backend 'metni' (i ile biten) bekliyor
                    };
                });
            }

            return {
                soruMetni: s.metin,
                soruTipi: s.tip,
                zorunlu: s.zorunlu !== undefined ? s.zorunlu : true,
                siraNo: index + 1,
                secenekler: secenekler,
                sliderMin: s.tip === 'slider' ? 1 : null,
                sliderMax: s.tip === 'slider' ? 10 : null
            };
        });

        const tasinanVeri = {
            anketBaslik: anketBaslik,
            anketAciklama: anketAciklama,
            sorular: backendFormatindaSorular,
            aiIleOlusturuldu: true
        };

        // 3. Veriyi yanımıza alıp bir sonraki ekrana geçiyoruz
        navigate("/hedef-kitle-secimi", { state: tasinanVeri });
    };
    // --- YARDIMCI FONKSİYONLAR (SORU LİSTESİ İÇİN) ---
    const handleSoruDegis = (id, yeniMetin) => {
        setSorular(sorular.map((s) => (s.id === id ? { ...s, metin: yeniMetin } : s)));
    };
    const handleTipDegis = (id, tip) => {
        setSorular(sorular.map((s) => s.id === id ? { ...s, tip, secenekler: tip.includes("coktan") ? ["", ""] : [] } : s));
    };
    const handleSecenekEkle = (id) => {
        setSorular(sorular.map((s) => s.id === id ? { ...s, secenekler: [...s.secenekler, ""] } : s));
    };
    const handleSecenekDegis = (id, index, text) => {
        setSorular(sorular.map((s) => {
            if (s.id === id) {
                const arr = [...s.secenekler];
                arr[index] = text;
                return { ...s, secenekler: arr };
            }
            return s;
        }));
    };
    const handleSecenekSil = (id, index) => {
        setSorular(sorular.map((s) => {
            if (s.id === id) {
                return { ...s, secenekler: s.secenekler.filter((_, i) => i !== index) };
            }
            return s;
        }));
    };
    const handleZorunluDegis = (id) => {
        setSorular(sorular.map((s) => (s.id === id ? { ...s, zorunlu: !s.zorunlu } : s)));
    };
    const handleSoruSil = (id) => {
        setSorular(sorular.filter(s => s.id !== id));
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
                    <Link to="/panel" className="nav-link"><FaHome /> Ana Sayfa</Link>
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
            {/* Eğer form açıksa 'compact-mode' ekle (scroll yok), liste açıksa normal davran */}
            <main className={`anket-main ${!soruListesiAcik ? 'compact-mode' : ''}`}>

                {/* --- EKRAN 1: KOMPAKT SPLIT VIEW --- */}
                {!soruListesiAcik ? (
                    <div className="compact-center-wrapper">
                        <div className="compact-card">

                            {/* SOL SÜTUN: Anket Bilgileri */}
                            <div className="compact-col left-col">
                                <div className="compact-header">
                                    <div className="sifirdan-ikon-cerceve small-icon">
                                        <FaClipboardList className="sifirdan-ana-ikon" />
                                    </div>
                                    <div>
                                        <h2>Anket Bilgileri</h2>
                                        <p>Temel detayları belirleyin.</p>
                                    </div>
                                </div>

                                <div className="sifirdan-input-group">
                                    <label>Anket Başlığı</label>
                                    <input
                                        type="text"
                                        className="sifirdan-text-input compact-input"
                                        placeholder="Örn: Personel Memnuniyet Anketi"
                                        value={anketBaslik}
                                        onChange={(e) => setAnketBaslik(e.target.value)}
                                        disabled={loading}
                                        autoFocus
                                    />
                                </div>

                                <div className="sifirdan-input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label>Açıklama <span style={{ fontWeight: 'normal', color: '#999' }}>(Opsiyonel)</span></label>
                                    <textarea
                                        className="sifirdan-textarea-input compact-textarea"
                                        placeholder="Anketin amacı nedir?"
                                        value={anketAciklama}
                                        onChange={(e) => setAnketAciklama(e.target.value)}
                                        disabled={loading}
                                        style={{ flex: 1, resize: 'none' }}
                                    />
                                </div>
                            </div>

                            {/* SAĞ SÜTUN: AI Ayarları */}
                            <div className="compact-col right-col">
                                <div className="compact-header">
                                    <div className="sifirdan-ikon-cerceve small-icon ai-bg">
                                        <FaRobot className="sifirdan-ana-ikon ai-color" />
                                    </div>
                                    <div>
                                        <h2>Yapay Zeka</h2>
                                        <p>Konuyu söyleyin, soruları yazsın.</p>
                                    </div>
                                </div>

                                <div className="sifirdan-input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ color: '#2d6a4f' }}>✨ AI Prompt (Konu)</label>
                                    <textarea
                                        value={aiTopic}
                                        onChange={(e) => setAiTopic(e.target.value)}
                                        placeholder="Örn: Bir restoran için hijyen, servis hızı ve lezzet hakkında sorular..."
                                        className="sifirdan-textarea-input compact-textarea ai-focus"
                                        disabled={loading}
                                        style={{ flex: 1, resize: 'none' }}
                                    />
                                </div>

                                {/* YENİ: Soru Sayısı ve Oluştur Butonu Yan Yana */}
                                <div className="ai-footer-row">
                                    <div className="question-count-control">
                                        <label>Soru Sayısı</label>
                                        <div className="counter-wrapper">
                                            <button
                                                className="counter-btn"
                                                onClick={decreaseCount}
                                                disabled={loading}
                                            >
                                                <FaMinus size={10} />
                                            </button>

                                            <input
                                                type="text"
                                                className="counter-input"
                                                value={aiQuestionCount}
                                                onChange={(e) => handleCountChange(e.target.value)}
                                                onBlur={handleCountBlur}
                                                disabled={loading}
                                            />

                                            <button
                                                className="counter-btn"
                                                onClick={increaseCount}
                                                disabled={loading}
                                            >
                                                <FaPlus size={10} />
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        className="ai-generate-btn"
                                        onClick={handleAIileOlustur}
                                        disabled={loading || !aiTopic.trim() || !anketBaslik.trim()}
                                    >
                                        {loading ? <FaSpinner className="spinning" /> : <FaMagic />}
                                        {loading ? "Oluşturuluyor..." : "Anket Oluştur"}
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    /* --- EKRAN 2: LİSTELEME EKRANI (Burası scroll olabilir) --- */
                    <div className="sifirdan-soru-olusturma-ekrani" style={{ paddingTop: '2rem' }}>
                        <div className="sifirdan-soru-listesi-header">
                            <div style={{ flex: 1 }}>
                                <div className="sifirdan-input-group" style={{ marginBottom: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={anketBaslik}
                                        onChange={(e) => setAnketBaslik(e.target.value)}
                                        className="sifirdan-text-input"
                                        style={{ fontWeight: 'bold', fontSize: '1.2rem' }}
                                    />
                                </div>
                                <div className="sifirdan-input-group">
                                    <textarea
                                        value={anketAciklama}
                                        onChange={(e) => setAnketAciklama(e.target.value)}
                                        className="sifirdan-textarea-input"
                                        rows="2"
                                    />
                                </div>
                            </div>
                            <span className="sifirdan-soru-sayisi-badge">{sorular.length} soru</span>
                        </div>

                        <div className="sifirdan-sorular-listesi">
                            {sorular.map((soru, index) => (
                                <div key={soru.id} className="sifirdan-modern-soru-kutusu">
                                    {/* Soru İçeriği */}
                                    <div className="sifirdan-soru-ust-alani">
                                        <div className="sifirdan-soru-numarasi">Soru {index + 1}</div>
                                        <button className="sifirdan-soru-sil-butonu" onClick={() => handleSoruSil(soru.id)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                    <div className="sifirdan-soru-metin-alani">
                                        <input
                                            type="text"
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
                                                <option value="coktan-tek">Çoktan Seçmeli (Tek)</option>
                                                <option value="coktan-coklu">Çoktan Seçmeli (Çoklu)</option>
                                                <option value="slider">Slider (1-10)</option>
                                            </select>
                                        </div>
                                        <div className="sifirdan-zorunluluk-alani">
                                            <label className="sifirdan-switch">
                                                <input type="checkbox" checked={soru.zorunlu} onChange={() => handleZorunluDegis(soru.id)} />
                                                <span className="sifirdan-slider round"></span>
                                            </label>
                                            <span>{soru.zorunlu ? "Zorunlu" : "İsteğe Bağlı"}</span>
                                        </div>
                                    </div>
                                    {/* Seçenekler */}
                                    {(soru.tip === "coktan-tek" || soru.tip === "coktan-coklu") && (
                                        <div className="sifirdan-secenekler-alani">
                                            {soru.secenekler.map((secenek, i) => (
                                                <div key={i} className="sifirdan-secenek-satiri">
                                                    <div className="sifirdan-secenek-tipi-goster">
                                                        {soru.tip === "coktan-tek" ? <div className="sifirdan-radio-nokta"></div> : <div className="sifirdan-checkbox-kare"></div>}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={secenek}
                                                        onChange={(e) => handleSecenekDegis(soru.id, i, e.target.value)}
                                                        className="sifirdan-secenek-input"
                                                    />
                                                    <button className="sifirdan-secenek-sil-butonu" onClick={() => handleSecenekSil(soru.id, i)}>
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            ))}
                                            <button className="sifirdan-secenek-ekle-butonu" onClick={() => handleSecenekEkle(soru.id)}>
                                                <FaPlus style={{ marginRight: "6px" }} /> Yeni Seçenek
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="sifirdan-anket-aksiyonlari">
                            <button
                                className="sifirdan-ikincil-buton"
                                onClick={() => {
                                    if (window.confirm("Yeniden AI ile oluşturmak ister misiniz? Mevcut sorular silinecek.")) {
                                        setSoruListesiAcik(false); // Başa dön
                                        setSorular([]);
                                    }
                                }}
                            >
                                Yeniden Oluştur
                            </button>
                            <button className="sifirdan-birincil-buton" onClick={handleDevamEt}>
                                İlerle
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AIileAnket;