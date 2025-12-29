import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    FaBars,
    FaUser,
    FaChartBar,
    FaClipboardList,
    FaSignOutAlt,
    FaArrowLeft,
    FaPlus,
    FaTrash,
    FaHome,
    FaMoon,
    FaSun,
    FaCheckCircle,
    FaLayerGroup,
    FaChevronRight,
    FaChevronLeft,
    FaEnvelope,
    FaIdCard,
    FaMapMarkerAlt,
    FaMobileAlt,
    FaShieldAlt,
    FaCopy,
    FaSearch,
    FaMapMarkedAlt,
    FaPaste,
    FaUpload,
    FaFileCode
} from "react-icons/fa";
import "./SifirdanAnket.css"; // SHARED CSS

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "BURAYA_API_KEY_GIRINIZ";

function SorulariYapistir() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // --- WIZARD STATE ---
    const [currentStep, setCurrentStep] = useState(1); // 1: Paste, 2: Questions, 3: Audience, 4: Success

    // --- STEP 1: Paste / Upload ---
    const [anketBaslik, setAnketBaslik] = useState("");
    const [anketAciklama, setAnketAciklama] = useState("");
    const [metin, setMetin] = useState("");

    // --- STEP 2: Questions ---
    const [sorular, setSorular] = useState([]);
    const [activeQuestionId, setActiveQuestionId] = useState(null);

    // Auto-select first question
    useEffect(() => {
        if (sorular.length > 0 && !activeQuestionId) {
            setActiveQuestionId(sorular[0].id);
        }
    }, [sorular, activeQuestionId]);

    // --- STEP 3: Audience ---
    const [secilenKriterler, setSecilenKriterler] = useState({
        mail: false,
        tcNo: false,
        konum: false,
        kimlikDogrulama: false,
        telefonNumarasi: false
    });
    const [mailUzantisi, setMailUzantisi] = useState("");
    const [kayitliKonumKriteri, setKayitliKonumKriteri] = useState(null);

    // Location Modal & Google Maps
    const [konumModalAcik, setKonumModalAcik] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [googleYeri, setGoogleYeri] = useState(null);
    const [kisitlamaTuru, setKisitlamaTuru] = useState("sehir");
    const [radiusDegeri, setRadiusDegeri] = useState("50");
    const [mapSearchInput, setMapSearchInput] = useState("");
    const autoCompleteRef = useRef(null);

    // --- GLOBAL STATES ---
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [olusanLink, setOlusanLink] = useState(null);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('panelDarkMode');
        return saved === 'true';
    });

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

    // --- EFFECTS ---
    useEffect(() => {
        localStorage.setItem('panelDarkMode', darkMode);
        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    // Google Maps Script
    useEffect(() => {
        if (konumModalAcik && !scriptLoaded) {
            if (window.google && window.google.maps && window.google.maps.places) {
                setScriptLoaded(true);
                return;
            }
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => setScriptLoaded(true);
            document.head.appendChild(script);
        }
    }, [konumModalAcik, scriptLoaded]);

    useEffect(() => {
        if (scriptLoaded && konumModalAcik && autoCompleteRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(autoCompleteRef.current, {
                types: ['geocode'],
                componentRestrictions: { country: "tr" },
                fields: ["address_components", "geometry", "formatted_address", "name"]
            });
            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (place.geometry) {
                    let il = "", ilce = "", mahalle = "";
                    place.address_components.forEach(cp => {
                        if (cp.types.includes("administrative_area_level_1")) il = cp.long_name;
                        if (cp.types.includes("administrative_area_level_2")) ilce = cp.long_name;
                        if (cp.types.includes("neighborhood") || cp.types.includes("sublocality")) mahalle = cp.long_name;
                    });
                    setGoogleYeri({ tamAdres: place.formatted_address, il, ilce, mahalle, lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
                }
            });
        }
    }, [scriptLoaded, konumModalAcik]);

    // --- HANDLERS ---
    const handleLogout = () => navigate("/giris");
    const handleGeriDon = () => navigate("/anket-olustur");

    // =============================================
    // TEXT PARSING FUNCTIONS (PRESERVED)
    // =============================================
    const parseAnketMetni = (text) => {
        const sorular = [];
        const satirlar = text.split('\n');

        let aktifSoru = null;
        let soruNumarasi = 0;

        for (let i = 0; i < satirlar.length; i++) {
            const satir = satirlar[i].trim();

            if (!satir) continue;

            const soruMatch = satir.match(/^(\d+)\.\s*["""](.+?)["""](.*)/) ||
                satir.match(/^["""](.+?)["""](.*)$/);

            if (soruMatch) {
                if (aktifSoru) sorular.push(aktifSoru);

                soruNumarasi++;
                const soruMetni = soruMatch[2] || soruMatch[1];
                const soruDevami = soruMatch[3] || soruMatch[2] || '';

                aktifSoru = {
                    id: Date.now() + soruNumarasi + Math.random(),
                    metin: (soruMetni + ' ' + soruDevami).trim(),
                    tip: "acik-uclu",
                    secenekler: [],
                    zorunlu: true
                };
            }
            else if (satir.match(/^[A-Za-z]\)\s*/)) {
                if (aktifSoru) {
                    const secenekMetni = satir.replace(/^[A-Za-z]\)\s*/, '').trim();
                    if (secenekMetni) {
                        aktifSoru.secenekler.push(secenekMetni);
                        aktifSoru.tip = "coktan-tek";
                    }
                }
            }
            else if (aktifSoru && !satir.match(/^[A-Za-z]\)/) && !satir.match(/^["""]/) && !satir.match(/^\d+\./)) {
                if (aktifSoru.secenekler.length > 0) {
                    const lastIndex = aktifSoru.secenekler.length - 1;
                    aktifSoru.secenekler[lastIndex] += ' ' + satir;
                } else {
                    aktifSoru.metin += ' ' + satir;
                }
            }
        }

        if (aktifSoru) sorular.push(aktifSoru);
        return sorular;
    };

    // JSON File Upload Handler (PRESERVED)
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            alert("❌ Lütfen geçerli bir JSON dosyası seçin!");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);

                const baslik = jsonData.anketBaslik || jsonData.anket_adi || jsonData.title;
                if (baslik) setAnketBaslik(baslik);

                const aciklama = jsonData.anketAciklama || jsonData.anket_aciklamasi || jsonData.description;
                if (aciklama) setAnketAciklama(aciklama);

                if (jsonData.sorular && Array.isArray(jsonData.sorular)) {
                    const formattedSorular = jsonData.sorular.map((soru, index) => {
                        const soruMetni = soru.soruMetni || soru.soru_metni || soru.metin || soru.soru || '';
                        const cevapTipi = soru.soruTipi || soru.cevap_tipi || soru.tip || 'acik-uclu';

                        let anketTipi = 'acik-uclu';
                        if (cevapTipi === 'tek_secimli' || cevapTipi === 'coktan-tek' || cevapTipi === 'radio') {
                            anketTipi = 'coktan-tek';
                        } else if (cevapTipi === 'coklu_secimli' || cevapTipi === 'coktan-coklu' || cevapTipi === 'checkbox') {
                            anketTipi = 'coktan-coklu';
                        } else if (cevapTipi === 'slider' || cevapTipi === 'skala') {
                            anketTipi = 'slider';
                        }

                        const secenekler = (soru.secenekler || []).map(sec => {
                            if (typeof sec === 'string') return sec;
                            return sec.etiket || sec.metin || sec.label || '';
                        });

                        return {
                            id: Date.now() + index + Math.random(),
                            metin: soruMetni,
                            tip: anketTipi,
                            secenekler,
                            zorunlu: soru.zorunlu !== undefined ? soru.zorunlu : true,
                            sliderMin: anketTipi === 'slider' ? 1 : null,
                            sliderMax: anketTipi === 'slider' ? 10 : null
                        };
                    });

                    setSorular(formattedSorular);
                    setCurrentStep(2); // Go to question editing
                } else {
                    alert("❌ JSON dosyasında 'sorular' dizisi bulunamadı!");
                }
            } catch (error) {
                console.error("JSON parse hatası:", error);
                alert("❌ JSON dosyası okunamadı!");
            }
        };

        reader.onerror = () => alert("❌ Dosya okuma hatası!");
        reader.readAsText(file);
        event.target.value = '';
    };

    // Parse and proceed to Step 2
    const handleParseAndProceed = () => {
        if (!anketBaslik.trim()) {
            alert("Lütfen anket başlığı girin!");
            return;
        }
        if (!metin.trim()) {
            alert("Lütfen sorularınızı yapıştırın!");
            return;
        }
        const parsed = parseAnketMetni(metin);
        if (parsed.length === 0) {
            alert("Geçerli soru bulunamadı! Lütfen formatı kontrol edin.");
            return;
        }
        setSorular(parsed);
        setCurrentStep(2);
    };

    // Question Handlers (Same as other wizards)
    const handleSoruDegis = (id, metin) => setSorular(sorular.map(s => s.id === id ? { ...s, metin } : s));
    const handleTipDegis = (id, tip) => setSorular(sorular.map(s => {
        if (s.id === id) {
            const base = { ...s, tip, secenekler: tip.includes("coktan") ? (s.secenekler.length > 0 ? s.secenekler : ["Seçenek 1", "Seçenek 2"]) : [] };
            if (tip === 'slider') return { ...base, sliderMin: 1, sliderMax: 10 };
            return base;
        }
        return s;
    }));
    const handleSliderAyarlarDegis = (id, key, deger) => setSorular(sorular.map(s => s.id === id ? { ...s, [key]: deger } : s));
    const handleSecenekDegis = (sId, index, deger) => setSorular(sorular.map(s => {
        if (s.id === sId) {
            const yeniSec = [...s.secenekler];
            yeniSec[index] = deger;
            return { ...s, secenekler: yeniSec };
        }
        return s;
    }));
    const handleSecenekSil = (sId, index) => setSorular(sorular.map(s => s.id === sId ? { ...s, secenekler: s.secenekler.filter((_, i) => i !== index) } : s));
    const handleSecenekEkle = (sId) => setSorular(sorular.map(s => s.id === sId ? { ...s, secenekler: [...s.secenekler, `Yeni Seçenek`] } : s));
    const handleZorunluToggle = (id) => setSorular(sorular.map(s => s.id === id ? { ...s, zorunlu: !s.zorunlu } : s));
    const handleSoruSil = (id) => {
        const yeniSorular = sorular.filter(s => s.id !== id);
        setSorular(yeniSorular);
        if (activeQuestionId === id) setActiveQuestionId(yeniSorular.length > 0 ? yeniSorular[0].id : null);
    };
    const handleYeniSoruEkle = () => {
        const yeniId = Math.random();
        const yeniSoru = { id: yeniId, metin: "", tip: "acik-uclu", secenekler: [], zorunlu: false };
        setSorular([...sorular, yeniSoru]);
        setActiveQuestionId(yeniId);
    };

    // Audience Handlers
    const handleKriterToggle = (kriter) => setSecilenKriterler({ ...secilenKriterler, [kriter]: !secilenKriterler[kriter] });
    const handleKonumKaydet = () => {
        setKayitliKonumKriteri({ tip: kisitlamaTuru, target: googleYeri, radius: radiusDegeri, label: googleYeri.tamAdres });
        setKonumModalAcik(false);
    };

    // --- WIZARD NAVIGATION ---
    const nextStep = () => {
        if (currentStep === 2 && sorular.length === 0) { alert("En az bir soru eklemelisiniz."); return; }
        if (currentStep === 2 && sorular.some(s => !s.metin.trim())) { alert("Lütfen tüm soruların metnini doldurun."); return; }
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
    };
    const prevStep = () => {
        if (currentStep === 2) {
            // Going back - keep questions but allow re-edit of text
        }
        setCurrentStep(currentStep - 1);
        window.scrollTo(0, 0);
    };

    // Mail uzantısı format kontrolü için regex (örn: gmail.com, outlook.com, kurum.com.tr)
    const mailUzantisiGecerliMi = (uzanti) => {
        const trimmed = uzanti.trim();
        // Domain formatı: en az bir . içermeli, TLD en az 2 karakter olmalı
        const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
        return pattern.test(trimmed);
    };

    // --- FINAL PUBLISH ---
    const handleFinalYayinla = async () => {
        // Mail uzantısı validasyonu
        if (secilenKriterler.mail) {
            if (!mailUzantisi.trim()) {
                alert("⚠️ E-posta kısıtlaması seçtiniz! Lütfen bir mail uzantısı girin.");
                return;
            }
            if (!mailUzantisiGecerliMi(mailUzantisi)) {
                alert("⚠️ Geçersiz mail uzantısı formatı!\n\nÖrnek formatlar:\n• gmail.com\n• outlook.com\n• kurum.com.tr\n\nLütfen geçerli bir domain girin.");
                return;
            }
        }

        const token = localStorage.getItem("token");
        if (!token) { navigate("/giris"); return; }
        setLoading(true);

        const backendSorular = sorular.map((s, idx) => ({
            soruId: idx.toString(),
            soruMetni: s.metin,
            soruTipi: s.tip,
            zorunlu: s.zorunlu,
            siraNo: idx + 1,
            secenekler: s.secenekler.map((m, i) => ({ secenekId: i.toString(), metin: m })),
            sliderMin: s.tip === 'slider' ? (s.sliderMin || 1) : null,
            sliderMax: s.tip === 'slider' ? (s.sliderMax || 10) : null
        }));

        const finalData = {
            anketBaslik,
            anketAciklama,
            sorular: backendSorular,
            yapistarildiMi: true,
            hedefKitleKriterleri: {
                ...secilenKriterler,
                mailUzantisi,
                konumHedefi: secilenKriterler.konum && kayitliKonumKriteri ? {
                    tip: kayitliKonumKriteri.tip,
                    hedef: {
                        il: kayitliKonumKriteri.target.il,
                        ilce: kayitliKonumKriteri.target.ilce,
                        mahalle: kayitliKonumKriteri.target.mahalle,
                        lat: kayitliKonumKriteri.target.lat,
                        lng: kayitliKonumKriteri.target.lng
                    },
                    radius: kayitliKonumKriteri.tip === 'radius' ? parseInt(kayitliKonumKriteri.radius) : null,
                    aciklama: kayitliKonumKriteri.label
                } : null
            }
        };

        try {
            const res = await fetch(`${apiUrl}/api/surveys`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(finalData)
            });
            const result = await res.json();
            if (result.success) {
                const link = `${window.location.origin}/anket-coz/${result.data.paylasimLinki.split('/').pop()}`;
                setOlusanLink(link);
                setCurrentStep(4);
            } else {
                alert("Hata: " + result.error);
            }
        } catch (err) {
            alert("Bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wizard-page panel-container">
            {/* Navbar */}
            <nav className="panel-navbar">
                <div className="nav-left">
                    <button className="icon-btn" onClick={() => setMenuOpen(!menuOpen)}><FaBars /></button>
                    <button className="icon-btn back-btn" onClick={handleGeriDon}><FaArrowLeft /></button>
                    <span className="panel-logo">SurvAI <span className="logo-badge paste-badge">YAPIŞTIR</span></span>
                </div>
                <div className="nav-right">
                    <Link to="/panel" className="nav-link"><FaHome /> Ana Sayfa</Link>
                    <Link to="/profil" className="nav-link"><FaUser /> Profil</Link>
                    <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
                        {darkMode ? <FaSun /> : <FaMoon />}
                    </button>
                </div>
            </nav>

            {/* Sidebar */}
            <div className={`sidebar ${menuOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">📋 Soruları Yapıştır</div>
                </div>
                <ul>
                    <li onClick={() => navigate('/panel')}><FaChartBar className="icon" /> Dashboard</li>
                    <li className="active"><FaPaste className="icon" /> Soruları Yapıştır</li>
                    <li onClick={() => navigate('/profil')}><FaUser className="icon" /> Profil</li>
                    <li onClick={handleLogout}><FaSignOutAlt className="icon" /> Çıkış</li>
                </ul>
            </div>
            {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>}

            <main className="wizard-main">
                {/* Stepper */}
                {currentStep < 4 && (
                    <div className="wizard-stepper">
                        <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                            <div className="step-number">{currentStep > 1 ? <FaCheckCircle /> : <FaPaste />}</div>
                            <div className="step-label">Yapıştır</div>
                        </div>
                        <div className="step-connector"></div>
                        <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                            <div className="step-number">{currentStep > 2 ? <FaCheckCircle /> : "2"}</div>
                            <div className="step-label">Sorular</div>
                        </div>
                        <div className="step-connector"></div>
                        <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
                            <div className="step-number">3</div>
                            <div className="step-label">Hedef Kitle</div>
                        </div>
                    </div>
                )}

                <div className="wizard-content-area">
                    {/* STEP 1: PASTE / UPLOAD */}
                    {currentStep === 1 && (
                        <div className="wizard-step step-info animate-in">
                            <div className="step-header-text">
                                <h2><FaPaste style={{ marginRight: '10px', color: 'var(--w-primary)' }} /> Soruları Yapıştır veya Yükle</h2>
                                <p>Hazır anket sorularınızı buraya yapıştırın veya JSON dosyası yükleyin.</p>
                            </div>

                            <div className="paste-form">
                                <div className="paste-form-grid">
                                    {/* Left: Survey Info */}
                                    <div className="paste-form-col">
                                        <h3><FaClipboardList /> Anket Bilgileri</h3>
                                        <div className="fancy-input-group">
                                            <label>Anket Başlığı *</label>
                                            <input
                                                type="text"
                                                placeholder="Örn: Temizlik Alışkanlıkları Anketi"
                                                value={anketBaslik}
                                                onChange={(e) => setAnketBaslik(e.target.value)}
                                                className="fancy-text-input"
                                            />
                                        </div>
                                        <div className="fancy-input-group">
                                            <label>Açıklama (İsteğe Bağlı)</label>
                                            <textarea
                                                placeholder="Anketin amacını kısaca açıklayın..."
                                                value={anketAciklama}
                                                onChange={(e) => setAnketAciklama(e.target.value)}
                                                className="fancy-textarea"
                                                rows="3"
                                            />
                                        </div>

                                        {/* JSON Upload */}
                                        <div className="json-upload-section">
                                            <button
                                                className="json-upload-btn"
                                                onClick={() => fileInputRef.current?.click()}
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
                                            <span className="upload-hint">JSON yüklerseniz otomatik olarak sorulara geçilir</span>
                                        </div>
                                    </div>

                                    {/* Right: Paste Area */}
                                    <div className="paste-form-col paste-col">
                                        <h3><FaFileCode /> Soruları Yapıştır</h3>
                                        <div className="paste-format-hint">
                                            <code>
                                                1. "Soru metni?"<br />
                                                A) Seçenek 1<br />
                                                B) Seçenek 2
                                            </code>
                                        </div>
                                        <textarea
                                            className="paste-textarea"
                                            placeholder='1. "Soru metni?"&#10;A) Seçenek 1&#10;B) Seçenek 2&#10;&#10;2. "İkinci soru?"&#10;A) Cevap 1&#10;B) Cevap 2'
                                            value={metin}
                                            onChange={(e) => setMetin(e.target.value)}
                                            rows="12"
                                        />
                                        <button
                                            className="parse-btn"
                                            onClick={handleParseAndProceed}
                                            disabled={!anketBaslik.trim() || !metin.trim()}
                                        >
                                            <FaCheckCircle /> Soruları Çözümle ve Devam Et
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: QUESTIONS (Same as SifirdanAnket) */}
                    {currentStep === 2 && (
                        <div className="wizard-step step-questions animate-in">
                            <div className="questions-layout">
                                <div className="questions-sidebar">
                                    <div className="sidebar-card">
                                        <h3>Sorular ({sorular.length})</h3>
                                        <div className="question-list-nav">
                                            {sorular.map((s, i) => (
                                                <div
                                                    key={s.id}
                                                    className={`nav-item ${activeQuestionId === s.id ? 'active' : ''}`}
                                                    onClick={() => setActiveQuestionId(s.id)}
                                                >
                                                    <span className="idx">{i + 1}</span>
                                                    <span className="txt">{s.metin || "Adsız Soru"}</span>
                                                    <div className="nav-actions">
                                                        <button
                                                            className="mini-del-btn"
                                                            onClick={(e) => { e.stopPropagation(); handleSoruSil(s.id); }}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="add-btn-sidebar" onClick={handleYeniSoruEkle}>
                                            <FaPlus /> Soru Ekle
                                        </button>
                                    </div>
                                </div>

                                <div className="questions-editor">
                                    {sorular.length === 0 ? (
                                        <div className="empty-questions-state">
                                            <div className="empty-icon"><FaClipboardList /></div>
                                            <h3>Henüz soru eklenmedi</h3>
                                            <p>Soru eklemek için soldaki menüyü kullanın.</p>
                                            <button className="big-add-question" onClick={handleYeniSoruEkle}>
                                                <FaPlus /> İlk Soruyu Ekle
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {(() => {
                                                const activeQ = sorular.find(s => s.id === activeQuestionId) || sorular[0];
                                                if (activeQ && activeQuestionId !== activeQ.id) setActiveQuestionId(activeQ.id);
                                                if (!activeQ) return null;
                                                const index = sorular.findIndex(s => s.id === activeQ.id);

                                                return (
                                                    <div className="q-workspace">
                                                        <div className="q-workspace-header">
                                                            <div className="q-info">
                                                                <span className="q-index">Soru {index + 1}</span>
                                                                <span className="q-type-label">{activeQ.tip.replace('-', ' ').toUpperCase()}</span>
                                                            </div>
                                                        </div>

                                                        <div className="q-workspace-panel animate-in">
                                                            <div className="q-panel-section main-input-section">
                                                                <label className="section-mini-label">Soru Metni</label>
                                                                <textarea
                                                                    placeholder="Katılımcıya ne sormak istersiniz?"
                                                                    value={activeQ.metin}
                                                                    onChange={(e) => handleSoruDegis(activeQ.id, e.target.value)}
                                                                    className="q-panel-input"
                                                                    autoFocus
                                                                    rows={1}
                                                                    onInput={(e) => {
                                                                        e.target.style.height = 'auto';
                                                                        e.target.style.height = e.target.scrollHeight + 'px';
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="q-panel-section settings-section">
                                                                <div className="section-header">
                                                                    <FaLayerGroup /> <span>Soru Ayarları</span>
                                                                </div>
                                                                <div className="q-config-grid">
                                                                    <div className="q-config-field">
                                                                        <label>Soru Tipi</label>
                                                                        <select value={activeQ.tip} onChange={(e) => handleTipDegis(activeQ.id, e.target.value)}>
                                                                            <option value="acik-uclu">✍️ Açık Uçlu (Metin)</option>
                                                                            <option value="coktan-tek">◉ Çoktan Seçmeli (Tek)</option>
                                                                            <option value="coktan-coklu">☑️ Çoktan Seçmeli (Çoklu)</option>
                                                                            <option value="slider">🎚️ Slider (Puanlama)</option>
                                                                        </select>
                                                                    </div>

                                                                    <div className="q-config-field clickable" onClick={() => handleZorunluToggle(activeQ.id)}>
                                                                        <label>Zorunluluk</label>
                                                                        <div className="compact-toggle-wrap">
                                                                            <div className={`custom-toggle mini ${activeQ.zorunlu ? 'on' : 'off'}`}>
                                                                                <div className="toggle-circle"></div>
                                                                            </div>
                                                                            <span className="toggle-label">{activeQ.zorunlu ? 'Zorunlu' : 'İsteğe Bağlı'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {activeQ.tip === 'slider' && (
                                                                <div className="q-panel-section slider-config-section animate-in">
                                                                    <div className="section-header">
                                                                        <FaSearch /> <span>Slider Yapılandırması</span>
                                                                    </div>
                                                                    <div className="slider-config-grid">
                                                                        <div className="config-group">
                                                                            <label>Değer Aralığı</label>
                                                                            <div className="range-inputs">
                                                                                <input type="number" value={activeQ.sliderMin || 1} onChange={(e) => handleSliderAyarlarDegis(activeQ.id, 'sliderMin', parseInt(e.target.value))} placeholder="Min" />
                                                                                <span>-</span>
                                                                                <input type="number" value={activeQ.sliderMax || 10} onChange={(e) => handleSliderAyarlarDegis(activeQ.id, 'sliderMax', parseInt(e.target.value))} placeholder="Max" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {activeQ.tip.includes("coktan") && (
                                                                <div className="q-panel-section choices-section">
                                                                    <div className="section-header">
                                                                        <FaClipboardList /> <span>Seçenekler</span>
                                                                    </div>
                                                                    <div className="choices-compact-list">
                                                                        {activeQ.secenekler.map((sec, i) => (
                                                                            <div key={i} className="choice-compact-row">
                                                                                <div className="choice-indicator">
                                                                                    {activeQ.tip === 'coktan-tek' ? <div className="dot-icon" /> : <div className="check-icon" />}
                                                                                </div>
                                                                                <input
                                                                                    type="text"
                                                                                    value={sec}
                                                                                    onChange={(e) => handleSecenekDegis(activeQ.id, i, e.target.value)}
                                                                                    placeholder={`Seçenek ${i + 1}`}
                                                                                    className="choice-minimal-input"
                                                                                />
                                                                                <button className="minimal-del-btn" onClick={() => handleSecenekSil(activeQ.id, i)}>
                                                                                    <FaTrash />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                        <button className="add-choice-minimal" onClick={() => handleSecenekEkle(activeQ.id)}>
                                                                            <FaPlus /> Yeni Seçenek Ekle
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {activeQ.tip === 'slider' && (
                                                                <div className="q-panel-section preview-section">
                                                                    <div className="section-header">
                                                                        <FaSearch /> <span>Slider Önizleme</span>
                                                                    </div>
                                                                    <div className="slider-preview-box">
                                                                        <input type="range" min={activeQ.sliderMin || 1} max={activeQ.sliderMax || 10} disabled />
                                                                        <div className="slider-labels">
                                                                            <span>{activeQ.sliderMin || 1}</span>
                                                                            <span>{activeQ.sliderMax || 10}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: AUDIENCE */}
                    {currentStep === 3 && (
                        <div className="wizard-step step-audience animate-in">
                            <div className="step-header-text">
                                <h2>Hedef Kitle ve Kurallar</h2>
                                <p>Anketinizin kimler tarafından ve hangi kurallarla doldurulacağını belirleyin.</p>
                            </div>

                            <div className="audience-grid">
                                <div className={`audience-card ${secilenKriterler.kimlikDogrulama ? 'expanded' : ''}`} onClick={() => handleKriterToggle("kimlikDogrulama")}>
                                    <div className={`check-indicator ${secilenKriterler.kimlikDogrulama ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleKriterToggle("kimlikDogrulama") }}><FaCheckCircle /></div>
                                    <FaShieldAlt className="card-icon" />
                                    <div className="card-content-wrap">
                                        <h3>Biyometrik Kimlik & Yüz Doğrulama</h3>
                                        <p>AI destekli yüz tanıma ve canlılık testi ile en yüksek güvenlik seviyesini sağlar.</p>
                                    </div>
                                </div>
                                <div className={`audience-card ${secilenKriterler.tcNo ? 'expanded' : ''}`} onClick={() => handleKriterToggle("tcNo")}>
                                    <div className={`check-indicator ${secilenKriterler.tcNo ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleKriterToggle("tcNo") }}><FaCheckCircle /></div>
                                    <FaIdCard className="card-icon" />
                                    <div className="card-content-wrap">
                                        <h3>TC Kimlik No Doğrulama</h3>
                                        <p>Nüfus ve Vatandaşlık İşleri (NVİ) üzerinden kimlik bilgilerinin doğruluğu kontrol edilir.</p>
                                    </div>
                                </div>
                                <div className={`audience-card ${secilenKriterler.telefonNumarasi ? 'expanded' : ''}`} onClick={() => handleKriterToggle("telefonNumarasi")}>
                                    <div className={`check-indicator ${secilenKriterler.telefonNumarasi ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleKriterToggle("telefonNumarasi") }}><FaCheckCircle /></div>
                                    <FaMobileAlt className="card-icon" />
                                    <div className="card-content-wrap">
                                        <h3>Telefon Doğrulama</h3>
                                        <p>Bot saldırılarını engellemek için katılımcıların telefon numarası SMS ile onaylanır.</p>
                                    </div>
                                </div>
                                <div className={`audience-card ${secilenKriterler.mail ? 'expanded' : ''}`} onClick={() => handleKriterToggle("mail")}>
                                    <div className={`check-indicator ${secilenKriterler.mail ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleKriterToggle("mail") }}><FaCheckCircle /></div>
                                    <FaEnvelope className="card-icon" />
                                    <div className="card-content-wrap">
                                        <h3>E-posta Kısıtlaması</h3>
                                        <p>Anketinizi sadece belirli kurumsal e-posta uzantılarına sahip kişilerle sınırlayın.</p>
                                        {secilenKriterler.mail && (
                                            <div className="nested-input" onClick={e => e.stopPropagation()}>
                                                <input type="text" placeholder="@kurum.com" value={mailUzantisi} onChange={e => setMailUzantisi(e.target.value)} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={`audience-card ${secilenKriterler.konum ? 'expanded' : ''}`} onClick={() => handleKriterToggle("konum")}>
                                    <div className={`check-indicator ${secilenKriterler.konum ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleKriterToggle("konum") }}><FaCheckCircle /></div>
                                    <FaMapMarkerAlt className="card-icon" />
                                    <div className="card-content-wrap">
                                        <h3>Bölge Kısıtlaması</h3>
                                        <p>Anketin sadece sizin belirlediğiniz bölge içinden cevaplanmasını sağlar.</p>
                                        {secilenKriterler.konum && (
                                            <div className="nested-actions">
                                                {kayitliKonumKriteri ? (
                                                    <span className="location-badge">{kayitliKonumKriteri.label}</span>
                                                ) : (
                                                    <span className="no-location">Konum seçilmedi</span>
                                                )}
                                                <button className="select-map-btn" onClick={() => setKonumModalAcik(true)}>Haritada Seç</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {currentStep === 4 && (
                        <div className="wizard-step step-success animate-in">
                            <div className="celebration-card">
                                <div className="check-blob"><FaCheckCircle /></div>
                                <h1 className="success-title">Anket Başarıyla Oluşturuldu!</h1>
                                <p>Yapıştırdığınız sorulardan anketiniz yayınlandı.</p>

                                <div className="link-copy-area">
                                    <label>Paylaşım Linki</label>
                                    <div className="link-box">
                                        <code>{olusanLink}</code>
                                        <button onClick={() => { navigator.clipboard.writeText(olusanLink); alert("Link kopyalandı!"); }}><FaCopy /></button>
                                    </div>
                                </div>

                                <div className="success-actions">
                                    <button className="btn-main-finish" onClick={() => navigate("/panel")}>Dashboard'a Dön</button>
                                    <button className="btn-sec-finish" onClick={() => window.open(olusanLink)}>Anketi Görüntüle</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {currentStep > 1 && currentStep < 4 && (
                    <div className="wizard-footer">
                        <div className="footer-left">
                            <button className="btn-wizard prev" onClick={prevStep}>
                                <FaChevronLeft /> Geri
                            </button>
                        </div>
                        <div className="footer-right">
                            {currentStep < 3 ? (
                                <button className="btn-wizard next" onClick={nextStep}>
                                    Devam Et <FaChevronRight />
                                </button>
                            ) : (
                                <button className="btn-wizard launch" onClick={handleFinalYayinla} disabled={loading}>
                                    {loading ? "Yayınlanıyor..." : "Anketi Yayınla"} <FaCheckCircle />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Google Maps Modal */}
            {konumModalAcik && (
                <div className="maps-modal-overlay">
                    <div className="maps-modal">
                        <div className="modal-head">
                            <h3><FaMapMarkedAlt /> Lokasyon Hedefleme</h3>
                            <button className="close-btn" onClick={() => setKonumModalAcik(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="search-box-map">
                                <FaSearch className="s-icon" />
                                <input ref={autoCompleteRef} type="text" placeholder="Şehir, ilçe veya mahalle aratın..." value={mapSearchInput} onChange={e => setMapSearchInput(e.target.value)} />
                            </div>
                            {googleYeri && (
                                <div className="location-settings">
                                    <div className="selected-preview">Seçilen: <strong>{googleYeri.tamAdres}</strong></div>
                                    <div className="config-row">
                                        <button className={kisitlamaTuru === "sehir" ? 'active' : ''} onClick={() => setKisitlamaTuru("sehir")}>Şehir ({googleYeri.il})</button>
                                        {googleYeri.ilce && <button className={kisitlamaTuru === "ilce" ? 'active' : ''} onClick={() => setKisitlamaTuru("ilce")}>İlçe ({googleYeri.ilce})</button>}
                                        <button className={kisitlamaTuru === "radius" ? 'active' : ''} onClick={() => setKisitlamaTuru("radius")}>Mesafe (Radius)</button>
                                    </div>
                                    {kisitlamaTuru === "radius" && (
                                        <div className="radius-pick">
                                            <label>Yarıçap (Metre):</label>
                                            <select value={radiusDegeri} onChange={e => setRadiusDegeri(e.target.value)}>
                                                <option value="100">100m</option>
                                                <option value="500">500m</option>
                                                <option value="1000">1km</option>
                                                <option value="5000">5km</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-confirm" onClick={handleKonumKaydet} disabled={!googleYeri}>Seçimi Onayla</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SorulariYapistir;
