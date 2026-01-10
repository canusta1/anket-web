import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaPlus,
    FaTrash,
    FaCheckCircle,
    FaLayerGroup,
    FaCopy,
    FaSpinner,
    FaCalendarAlt,
    FaClipboardList,
    FaChevronLeft,
    FaChevronRight,
    FaSlidersH,
    FaQrcode,
    FaTimes,
    FaImage
} from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import "./AnketKopyala.css";
import "./Wizard.css";
import Navbar from "./components/Navbar";
import HedefKitleSecimi from "./HedefKitleSecimi";
import "./AnketSonuclari.css";

function AnketKopyala() {
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [templates, setTemplates] = useState([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [anketBaslik, setAnketBaslik] = useState("");
    const [anketAciklama, setAnketAciklama] = useState("");
    const [sorular, setSorular] = useState([]);
    const [activeQuestionId, setActiveQuestionId] = useState(null);

    useEffect(() => {
        if (sorular.length > 0 && !activeQuestionId) {
            setActiveQuestionId(sorular[0].id);
        }
    }, [sorular, activeQuestionId]);

    const [secilenKriterler, setSecilenKriterler] = useState({
        mail: false,
        tcNo: false,
        konum: false,
        kimlikDogrulama: false,
        telefonNumarasi: false
    });
    const [mailUzantisi, setMailUzantisi] = useState("");
    const [kayitliKonumKriteri, setKayitliKonumKriteri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [olusanLink, setOlusanLink] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/giris');
                return;
            }
            const res = await fetch(`${apiUrl}/api/surveys`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Anketler yüklenemedi');
            const payload = await res.json();
            setTemplates(payload?.data ?? []);
        } catch (err) {
            console.error('Şablon yükleme hatası:', err);
        } finally {
            setLoadingTemplates(false);
        }
    };

    // --- HANDLERS ---

    // Template Selection - go to Step 2 (Rename)
    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        // Pre-fill with original data (user will customize in Step 2)
        setAnketBaslik(template.anketBaslik || 'Başlıksız');
        setAnketAciklama(template.anketAciklama || "");
        const converted = (template.sorular || []).map((soru, i) => {
            let secenekler = [];
            if (soru.secenekler && Array.isArray(soru.secenekler)) {
                secenekler = soru.secenekler.map(sec => {
                    if (typeof sec === 'string') return sec;
                    if (sec && typeof sec === 'object') return sec.metin || sec.metni || sec.text || '';
                    return '';
                }).filter(s => s.length > 0);
            }
            return {
                id: Date.now() + i + Math.random(),
                metin: soru.soruMetni || soru.metin || soru.soru || '',
                tip: soru.soruTipi || soru.tip || 'acik-uclu',
                secenekler,
                zorunlu: soru.zorunlu !== undefined ? soru.zorunlu : false,
                sliderMin: soru.sliderMin || 1,
                sliderMax: soru.sliderMax || 10
            };
        });
        setSorular(converted);
        setCurrentStep(2);
    };

    const handleSoruDegis = (id, metin) => setSorular(sorular.map(s => s.id === id ? { ...s, metin } : s));
    const handleTipDegis = (id, tip) => setSorular(sorular.map(s => {
        if (s.id === id) {
            const base = { ...s, tip, secenekler: tip.includes("coktan") ? ["Seçenek 1", "Seçenek 2"] : [] };
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
    
    // Görsel yükleme handler
    const handleGorselYukle = (id, file) => {
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('Görsel boyutu 2MB\'dan küçük olmalıdır.'); return; }
        const reader = new FileReader();
        reader.onload = (e) => { setSorular(sorular.map(s => s.id === id ? { ...s, gorselUrl: e.target.result } : s)); };
        reader.readAsDataURL(file);
    };
    const handleGorselSil = (id) => { setSorular(sorular.map(s => s.id === id ? { ...s, gorselUrl: null } : s)); };
    
    const handleSoruSil = (id) => {
        const yeniSorular = sorular.filter(s => s.id !== id);
        setSorular(yeniSorular);
        if (activeQuestionId === id) setActiveQuestionId(yeniSorular.length > 0 ? yeniSorular[0].id : null);
    };
    const handleYeniSoruEkle = () => {
        const yeniId = Math.random();
        const yeniSoru = { id: yeniId, metin: "", tip: "acik-uclu", secenekler: [], zorunlu: false, gorselUrl: null };
        setSorular([...sorular, yeniSoru]);
        setActiveQuestionId(yeniId);
    };

    // --- WIZARD NAVIGATION ---
    const nextStep = () => {
        if (currentStep === 2 && !anketBaslik.trim()) { alert("Lütfen yeni anket için bir başlık girin."); return; }
        if (currentStep === 3 && sorular.length === 0) { alert("En az bir soru eklemelisiniz."); return; }
        if (currentStep === 3 && sorular.some(s => !s.metin.trim())) { alert("Lütfen tüm soruların metnini doldurun."); return; }
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
    };
    const prevStep = () => {
        if (currentStep === 2) {
            // Going back to selection - reset
            setSelectedTemplate(null);
            setSorular([]);
            setAnketBaslik("");
            setAnketAciklama("");
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
            sliderMax: s.tip === 'slider' ? (s.sliderMax || 10) : null,
            gorselUrl: s.gorselUrl || null
        }));

        const finalData = {
            anketBaslik,
            anketAciklama,
            sorular: backendSorular,
            kopyalandiMi: true,
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
                setCurrentStep(5); // Success is now step 5
            } else {
                alert("Hata: " + result.error);
            }
        } catch (err) {
            alert("Bağlantı hatası.");
        } finally {
            setLoading(false);
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="wizard-page panel-container">
            {/* Global Navbar */}
            <Navbar activePage="olustur" showCreateButton={false} />

            <main className="wizard-main">
                <div className="wizard-content-area">
                    {/* STEP 1: SURVEY SELECTION */}
                    {currentStep === 1 && (
                        <div className="wizard-step step-info animate-in">
                            {/* Mini Stepper */}
                            <div className="mini-stepper">
                                <div className="mini-step active">
                                    <span className="mini-step-num">1</span>
                                    <span className="mini-step-text">Anket Seç</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step">
                                    <span className="mini-step-num">2</span>
                                    <span className="mini-step-text">Yeni Bilgiler</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step">
                                    <span className="mini-step-num">3</span>
                                    <span className="mini-step-text">Sorular</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step">
                                    <span className="mini-step-num">4</span>
                                    <span className="mini-step-text">Hedef Kitle</span>
                                </div>
                            </div>

                            <div className="step-header-text">
                                <h2><FaCopy style={{ marginRight: '10px', color: 'var(--w-primary)' }} /> Kopyalanacak Anketi Seçin</h2>
                                <p>Daha önce oluşturduğunuz anketlerden birini seçerek yeni bir kopya oluşturun.</p>
                            </div>

                            {loadingTemplates ? (
                                <div className="template-loading">
                                    <FaSpinner className="spinning" />
                                    <p>Anketleriniz yükleniyor...</p>
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="template-empty">
                                    <FaClipboardList className="empty-icon" />
                                    <h3>Henüz Anket Oluşturmadınız</h3>
                                    <p>Kopyalamak için önce bir anket oluşturmanız gerekiyor.</p>
                                    <button className="btn-wizard next" onClick={() => navigate('/sifirdan-anket')}>
                                        <FaPlus /> Yeni Anket Oluştur
                                    </button>
                                </div>
                            ) : (
                                <div className="anketler-list-container">
                                    {/* List Header */}
                                    <div className="list-header">
                                        <div className="list-col col-title">Anket Başlığı</div>
                                        <div className="list-col col-questions">Sorular</div>
                                        <div className="list-col col-date">Tarih</div>
                                        <div className="list-col col-actions">İşlem</div>
                                    </div>

                                    {/* List Body */}
                                    <div className="list-body">
                                        {templates.map((template, index) => (
                                            <div
                                                key={template._id}
                                                className={`list-row ${selectedTemplate?._id === template._id ? 'selected' : ''}`}
                                                style={{ '--row-index': index }}
                                                onClick={() => handleTemplateSelect(template)}
                                            >
                                                <div className="list-col col-title">
                                                    <div className="title-content">
                                                        <span className="title-text">{template.anketBaslik || 'Başlıksız Anket'}</span>
                                                        {template.anketAciklama && (
                                                            <span className="title-desc">{template.anketAciklama}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="list-col col-questions">
                                                    <span className="stat-badge questions">
                                                        <FaClipboardList /> {template.sorular?.length || 0}
                                                    </span>
                                                </div>
                                                <div className="list-col col-date">
                                                    <span className="date-text">
                                                        <FaCalendarAlt /> {formatDate(template.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="list-col col-actions">
                                                    <button
                                                        className="btn-view-results"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTemplateSelect(template);
                                                        }}
                                                    >
                                                        Seç ve Düzenle
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 2: NEW NAME & DESCRIPTION */}
                    {currentStep === 2 && (
                        <div className="wizard-step step-info animate-in">
                            {/* Mini Stepper */}
                            <div className="mini-stepper">
                                <div className="mini-step completed" onClick={() => { setSelectedTemplate(null); setSorular([]); setAnketBaslik(''); setAnketAciklama(''); setCurrentStep(1); }}>
                                    <span className="mini-step-num">1</span>
                                    <span className="mini-step-text">Anket Seç</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step active">
                                    <span className="mini-step-num">2</span>
                                    <span className="mini-step-text">Yeni Bilgiler</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step">
                                    <span className="mini-step-num">3</span>
                                    <span className="mini-step-text">Sorular</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step">
                                    <span className="mini-step-num">4</span>
                                    <span className="mini-step-text">Hedef Kitle</span>
                                </div>
                            </div>

                            <div className="step-header-text">
                                <h2>Yeni Anket Bilgilerini Girin</h2>
                                <p>Kopyalanan anketinize yeni bir başlık ve açıklama verin.</p>
                            </div>
                            <div className="info-form-fancy">
                                <div className="fancy-input-group">
                                    <label>Anket Başlığı</label>
                                    <input
                                        type="text"
                                        placeholder="Örn: 2025 Müşteri Deneyimi Araştırması"
                                        value={anketBaslik}
                                        onChange={(e) => setAnketBaslik(e.target.value)}
                                        className="fancy-text-input"
                                    />
                                    <span className="input-hint">Orijinal: {selectedTemplate?.anketBaslik || 'Başlıksız'}</span>
                                </div>
                                <div className="fancy-input-group">
                                    <label>Açıklama (İsteğe Bağlı)</label>
                                    <textarea
                                        placeholder="Katılımcılara anketin amacından bahsedin..."
                                        value={anketAciklama}
                                        onChange={(e) => setAnketAciklama(e.target.value)}
                                        className="fancy-textarea"
                                        rows="5"
                                    />
                                </div>
                            </div>
                            {/* Navigation */}
                            <div className="q-nav-buttons">
                                <button className="q-nav-btn" onClick={prevStep}>
                                    <FaChevronLeft /> Geri
                                </button>
                                <button className="q-nav-btn primary" onClick={nextStep}>
                                    Devam Et <FaChevronRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: QUESTIONS */}
                    {currentStep === 3 && (
                        <div className="wizard-step step-questions step-questions-compact animate-in">
                            {/* Mini Stepper */}
                            <div className="mini-stepper">
                                <div className="mini-step completed" onClick={() => { setSelectedTemplate(null); setSorular([]); setAnketBaslik(''); setAnketAciklama(''); setCurrentStep(1); }}>
                                    <span className="mini-step-num">1</span>
                                    <span className="mini-step-text">Anket Seç</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step completed" onClick={() => setCurrentStep(2)}>
                                    <span className="mini-step-num">2</span>
                                    <span className="mini-step-text">Yeni Bilgiler</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step active">
                                    <span className="mini-step-num">3</span>
                                    <span className="mini-step-text">Sorular</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step">
                                    <span className="mini-step-num">4</span>
                                    <span className="mini-step-text">Hedef Kitle</span>
                                </div>
                            </div>

                            <div className="questions-layout-compact">
                                {/* Left Sidebar: Question List */}
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
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSoruSil(s.id);
                                                            }}
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

                                {/* Right Main: Active Question Editor */}
                                <div className="questions-editor">
                                    {sorular.length === 0 ? (
                                        <div className="empty-questions-state">
                                            <div className="empty-icon"><FaClipboardList /></div>
                                            <h3>Henüz soru eklenmedi</h3>
                                            <p>Anketinizi oluşturmaya başlamak için soldaki menüden veya aşağıdaki butondan soru ekleyin.</p>
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

                                                return (
                                                    <div className="q-workspace q-workspace-minimal">
                                                        {/* Question Text - Auto-resize textarea */}
                                                        <div className="q-input-row">
                                                            <textarea
                                                                placeholder="Soru metnini buraya yazın..."
                                                                value={activeQ.metin}
                                                                onChange={(e) => handleSoruDegis(activeQ.id, e.target.value)}
                                                                className="q-main-input"
                                                                autoFocus
                                                                rows={1}
                                                                onInput={(e) => {
                                                                    e.target.style.height = 'auto';
                                                                    e.target.style.height = Math.max(50, e.target.scrollHeight) + 'px';
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Settings Row */}
                                                        <div className="q-settings-row">
                                                            <div className="q-type-select">
                                                                <span className="q-type-label">Tip:</span>
                                                                <select value={activeQ.tip} onChange={(e) => handleTipDegis(activeQ.id, e.target.value)}>
                                                                    <option value="acik-uclu">📝 Açık Uçlu</option>
                                                                    <option value="coktan-tek">◉ Tek Seçim</option>
                                                                    <option value="coktan-coklu">☑ Çoklu Seçim</option>
                                                                    <option value="slider">📊 Slider</option>
                                                                </select>
                                                            </div>
                                                            <button 
                                                                className={`q-toggle-btn ${activeQ.zorunlu ? 'active' : ''}`}
                                                                onClick={() => handleZorunluToggle(activeQ.id)}
                                                            >
                                                                {activeQ.zorunlu ? '✓ Zorunlu' : 'İsteğe Bağlı'}
                                                            </button>
                                                            
                                                            {/* Görüntü Yükle Butonu */}
                                                            <label className={`q-toggle-btn q-image-btn ${activeQ.gorselUrl ? 'has-image' : ''}`}>
                                                                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleGorselYukle(activeQ.id, e.target.files[0])} />
                                                                <FaImage style={{ marginRight: '6px' }} />
                                                                {activeQ.gorselUrl ? 'Görsel Var' : 'Görüntü Yükle'}
                                                            </label>
                                                        </div>

                                                        {/* Preview Section */}
                                                        <div className="q-preview-section">
                                                            <div className="q-preview-label">Önizleme</div>
                                                            
                                                            {/* Görsel Önizleme */}
                                                            {activeQ.gorselUrl && (
                                                                <div className="q-image-preview">
                                                                    <img src={activeQ.gorselUrl} alt="Soru görseli" />
                                                                    <button className="q-image-remove" onClick={() => handleGorselSil(activeQ.id)} type="button">
                                                                        <FaTimes /> Görseli Kaldır
                                                                    </button>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Open-ended Preview */}
                                                            {activeQ.tip === 'acik-uclu' && (
                                                                <div className="q-preview-text">
                                                                    <textarea 
                                                                        placeholder="Kullanıcı cevabını buraya yazacak..." 
                                                                        disabled 
                                                                        rows={3}
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Slider Preview with Config */}
                                                            {activeQ.tip === 'slider' && (
                                                                <div className="q-preview-slider">
                                                                    <div className="q-slider-config">
                                                                        <span>Aralık:</span>
                                                                        <input
                                                                            type="number"
                                                                            value={activeQ.sliderMin || 1}
                                                                            onChange={(e) => handleSliderAyarlarDegis(activeQ.id, 'sliderMin', parseInt(e.target.value))}
                                                                        />
                                                                        <span>-</span>
                                                                        <input
                                                                            type="number"
                                                                            value={activeQ.sliderMax || 10}
                                                                            onChange={(e) => handleSliderAyarlarDegis(activeQ.id, 'sliderMax', parseInt(e.target.value))}
                                                                        />
                                                                    </div>
                                                                    <div className="q-slider-preview">
                                                                        <input 
                                                                            type="range" 
                                                                            min={activeQ.sliderMin || 1} 
                                                                            max={activeQ.sliderMax || 10} 
                                                                            defaultValue={Math.floor(((activeQ.sliderMin || 1) + (activeQ.sliderMax || 10)) / 2)}
                                                                        />
                                                                        <div className="q-slider-labels">
                                                                            <span>{activeQ.sliderMin || 1}</span>
                                                                            <span>{activeQ.sliderMax || 10}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Choice Options */}
                                                            {activeQ.tip.includes("coktan") && (
                                                                <div className="q-options-list">
                                                                    {activeQ.secenekler.map((sec, i) => (
                                                                        <div key={i} className="q-option-row">
                                                                            <div className="q-option-indicator">
                                                                                {activeQ.tip === 'coktan-tek' ? '○' : '☐'}
                                                                            </div>
                                                                            <input
                                                                                type="text"
                                                                                value={sec}
                                                                                onChange={(e) => handleSecenekDegis(activeQ.id, i, e.target.value)}
                                                                                placeholder={`Seçenek ${i + 1}`}
                                                                            />
                                                                            <button onClick={() => handleSecenekSil(activeQ.id, i)}>
                                                                                <FaTrash />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    <button className="q-add-option" onClick={() => handleSecenekEkle(activeQ.id)}>
                                                                        <FaPlus /> Seçenek Ekle
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}

                                    {/* Navigation inside editor */}
                                    <div className="q-nav-buttons">
                                        <button className="q-nav-btn" onClick={prevStep}>
                                            <FaChevronLeft /> Geri
                                        </button>
                                        <button className="q-nav-btn primary" onClick={nextStep}>
                                            Devam Et <FaChevronRight />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: AUDIENCE */}
                    {currentStep === 4 && (
                        <div className="wizard-step step-audience animate-in">
                            {/* Mini Stepper */}
                            <div className="mini-stepper">
                                <div className="mini-step completed" onClick={() => { setSelectedTemplate(null); setSorular([]); setAnketBaslik(''); setAnketAciklama(''); setCurrentStep(1); }}>
                                    <span className="mini-step-num">1</span>
                                    <span className="mini-step-text">Anket Seç</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step completed" onClick={() => setCurrentStep(2)}>
                                    <span className="mini-step-num">2</span>
                                    <span className="mini-step-text">Yeni Bilgiler</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step completed" onClick={() => setCurrentStep(3)}>
                                    <span className="mini-step-num">3</span>
                                    <span className="mini-step-text">Sorular</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step active">
                                    <span className="mini-step-num">4</span>
                                    <span className="mini-step-text">Hedef Kitle</span>
                                </div>
                            </div>

                            <div className="step-header-text">
                                <h2>Hedef Kitle ve Kurallar</h2>
                                <p>Anketinizin kimler tarafından ve hangi kurallarla doldurulacağını belirleyin.</p>
                            </div>

                            <HedefKitleSecimi
                                secilenKriterler={secilenKriterler}
                                setSecilenKriterler={setSecilenKriterler}
                                mailUzantisi={mailUzantisi}
                                setMailUzantisi={setMailUzantisi}
                                kayitliKonumKriteri={kayitliKonumKriteri}
                                setKayitliKonumKriteri={setKayitliKonumKriteri}
                            />

                            {/* Navigation */}
                            <div className="q-nav-buttons">
                                <button className="q-nav-btn" onClick={prevStep}>
                                    <FaChevronLeft /> Geri
                                </button>
                                <button className="q-nav-btn primary" onClick={handleFinalYayinla} disabled={loading}>
                                    {loading ? "Yayınlanıyor..." : "Anketi Yayınla"} <FaCheckCircle />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: SUCCESS */}
                    {currentStep === 5 && (
                        <div className="wizard-step step-success animate-in">
                            <div style={{
                                background: 'var(--w-card, #ffffff)',
                                borderRadius: '20px',
                                padding: '40px',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                border: '1px solid var(--w-border, #e2e8f0)',
                                maxWidth: '600px',
                                margin: '0 auto',
                                textAlign: 'center'
                            }}>
                                {/* Success Icon */}
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 50%, #6366f1 100%)',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px',
                                    boxShadow: '0 8px 24px rgba(0, 212, 170, 0.3)'
                                }}>
                                    <FaCheckCircle style={{ fontSize: '2.5rem', color: 'white' }} />
                                </div>

                                {/* Title */}
                                <h2 style={{
                                    fontSize: '1.75rem',
                                    fontWeight: '800',
                                    margin: '0 0 12px',
                                    background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 40%, #6366f1 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    Anket Başarıyla Kopyalandı!
                                </h2>

                                <p style={{
                                    color: 'var(--w-text-muted, #64748b)',
                                    fontSize: '0.95rem',
                                    marginBottom: '28px'
                                }}>
                                    Kopyalanan anketiniz yayınlandı ve katılımcılarını bekliyor.
                                </p>

                                {/* Link Section */}
                                <div style={{ marginBottom: '28px' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: 'var(--w-text-muted, #64748b)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '10px'
                                    }}>
                                        Paylaşım Linki
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        background: 'var(--w-bg, #f8fafc)',
                                        border: '1px solid var(--w-border, #e2e8f0)',
                                        borderRadius: '12px',
                                        padding: '12px 16px'
                                    }}>
                                        <code style={{
                                            flex: 1,
                                            fontSize: '0.9rem',
                                            color: 'var(--w-text, #1e293b)',
                                            wordBreak: 'break-all',
                                            textAlign: 'left'
                                        }}>
                                            {olusanLink}
                                        </code>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(olusanLink); alert("Link kopyalandı!"); }}
                                            style={{
                                                background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px 16px',
                                                borderRadius: '8px',
                                                fontWeight: '600',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 2px 8px rgba(0, 212, 170, 0.25)'
                                            }}
                                        >
                                            <FaCopy /> Kopyala
                                        </button>
                                    </div>
                                </div>
                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => navigate("/panel")}
                                        style={{
                                            background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '14px 28px',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(0, 212, 170, 0.25)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Dashboard'a Dön
                                    </button>
                                    <button
                                        onClick={() => window.open(olusanLink)}
                                        style={{
                                            background: 'transparent',
                                            color: 'var(--w-text, #1e293b)',
                                            border: '1px solid var(--w-border, #e2e8f0)',
                                            padding: '14px 28px',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        Anketi Görüntüle
                                    </button>
                                    <button
                                        onClick={() => setShowQrModal(true)}
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '14px 28px',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <FaQrcode /> QR Kod
                                    </button>
                                </div>

                                {/* QR Code Modal */}
                                {showQrModal && (
                                    <div
                                        onClick={() => setShowQrModal(false)}
                                        style={{
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'rgba(0, 0, 0, 0.85)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 9999,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                background: 'white',
                                                borderRadius: '24px',
                                                padding: '40px',
                                                textAlign: 'center',
                                                position: 'relative',
                                                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)'
                                            }}
                                        >
                                            <button
                                                onClick={() => setShowQrModal(false)}
                                                style={{
                                                    position: 'absolute',
                                                    top: '16px',
                                                    right: '16px',
                                                    background: '#f1f5f9',
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    width: '40px',
                                                    height: '40px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    fontSize: '1.2rem',
                                                    color: '#64748b'
                                                }}
                                            >
                                                <FaTimes />
                                            </button>
                                            <h3 style={{
                                                margin: '0 0 24px',
                                                fontSize: '1.25rem',
                                                fontWeight: '700',
                                                color: '#1e293b'
                                            }}>
                                                📱 Anketi Tara
                                            </h3>
                                            <div style={{
                                                padding: '20px',
                                                background: 'white',
                                                borderRadius: '16px',
                                                border: '3px solid #e2e8f0'
                                            }}>
                                                <QRCodeSVG
                                                    value={olusanLink}
                                                    size={280}
                                                    level="H"
                                                    includeMargin={true}
                                                />
                                            </div>
                                            <p style={{
                                                marginTop: '20px',
                                                fontSize: '0.9rem',
                                                color: '#64748b'
                                            }}>
                                                Telefonunuzun kamerasıyla QR kodu tarayın
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AnketKopyala;