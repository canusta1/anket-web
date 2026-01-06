import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    FaPlus,
    FaTrash,
    FaCheckCircle,
    FaLayerGroup,
    FaCopy,
    FaRobot,
    FaMagic,
    FaSpinner,
    FaMinus,
    FaClipboardList,
    FaChevronLeft,
    FaChevronRight,
    FaSlidersH
} from "react-icons/fa";
import "./SifirdanAnket.css";
import "./AIileAnket.css";
import "./Wizard.css";
import Navbar from "./components/Navbar";
import HedefKitleSecimi from "./HedefKitleSecimi";

function AIileAnket() {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentStep, setCurrentStep] = useState(1);
    const [anketBaslik, setAnketBaslik] = useState("");
    const [anketAciklama, setAnketAciklama] = useState("");
    const [aiTopic, setAiTopic] = useState(location?.state?.topic ?? "");
    const [aiQuestionCount, setAiQuestionCount] = useState(10);
    const [aiLoading, setAiLoading] = useState(false);
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

    const handleCountChange = (val) => {
        if (val === "") { setAiQuestionCount(""); return; }
        let newValue = parseInt(val);
        if (isNaN(newValue)) return;
        if (newValue > 50) newValue = 50;
        setAiQuestionCount(newValue);
    };
    const handleCountBlur = () => {
        if (aiQuestionCount === "" || aiQuestionCount < 1) setAiQuestionCount(1);
    };
    const increaseCount = () => {
        const current = aiQuestionCount === "" ? 0 : aiQuestionCount;
        if (current < 50) setAiQuestionCount(current + 1);
    };
    const decreaseCount = () => {
        const current = aiQuestionCount === "" ? 1 : aiQuestionCount;
        if (current > 1) setAiQuestionCount(current - 1);
    };

    // AI Generate Questions
    const handleAIileOlustur = async () => {
        if (!anketBaslik.trim()) { alert("❌ Lütfen anketinize bir başlık verin."); return; }
        if (!aiTopic.trim()) { alert("❌ Lütfen yapay zekaya bir konu (prompt) verin."); return; }
        const count = aiQuestionCount === "" ? 10 : aiQuestionCount;
        if (count < 1 || count > 50) { alert("❌ Soru sayısı 1 ile 50 arasında olmalıdır."); return; }

        setAiLoading(true);
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/ai/generate-survey`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: aiTopic, questionCount: count })
            });
            const result = await response.json();
            if (result.success) {
                const islenmisSorular = result.data.sorular.map((s, i) => ({
                    id: Date.now() + i + Math.random(),
                    metin: s.metin || s.soruMetni || "",
                    tip: s.tip || s.soruTipi || "acik-uclu",
                    secenekler: Array.isArray(s.secenekler) ? s.secenekler.map(sec => typeof sec === 'string' ? sec : (sec.metni || sec.metin || '')) : [],
                    zorunlu: true,
                    sliderMin: s.tip === 'slider' ? 1 : null,
                    sliderMax: s.tip === 'slider' ? 10 : null
                }));
                setSorular(islenmisSorular);
                setCurrentStep(2);
            } else {
                alert("❌ Hata: " + (result.error || "AI servisi yanıt vermedi."));
            }
        } catch (error) {
            console.error('AI Hatası:', error);
            alert("❌ Sunucuya bağlanılamadı.");
        } finally {
            setAiLoading(false);
        }
    };

    // Question Handlers (Same as SifirdanAnket)
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

    // --- WIZARD NAVIGATION ---
    const nextStep = () => {
        if (currentStep === 2 && sorular.length === 0) { alert("En az bir soru eklemelisiniz."); return; }
        if (currentStep === 2 && sorular.some(s => !s.metin.trim())) { alert("Lütfen tüm soruların metnini doldurun."); return; }
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
    };
    const prevStep = () => { setCurrentStep(currentStep - 1); window.scrollTo(0, 0); };

    // Mail uzantısı format kontrolü için regex (örn: gmail.com, outlook.com, kurum.com.tr)
    const mailUzantisiGecerliMi = (uzanti) => {
        const trimmed = uzanti.trim();
        // Domain formatı: en az bir . içermeli, TLD en az 2 karakter olmalı
        const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
        return pattern.test(trimmed);
    };

    // --- FİNAL YAYINLAMA (Same as SifirdanAnket) ---
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
            aiIleOlusturuldu: true, // Mark as AI-created
            hedefKitleKriterleri: {
                ...secilenKriterler,
                mailUzantisi,
                konumHedefi: secilenKriterler.konum && kayitliKonumKriteri ? {
                    tip: kayitliKonumKriteri.tip,
                    hedef: {
                        il: kayitliKonumKriteri.target?.il,
                        ilce: kayitliKonumKriteri.target?.ilce,
                        mahalle: kayitliKonumKriteri.target?.mahalle,
                        lat: kayitliKonumKriteri.target?.lat,
                        lng: kayitliKonumKriteri.target?.lng
                    },
                    radius: kayitliKonumKriteri.tip === 'radius' ? parseInt(kayitliKonumKriteri.radius) : null,
                    aciklama: kayitliKonumKriteri.label
                } : null
            }
        };

        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
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
            {/* Global Navbar */}
            <Navbar activePage="olustur" showCreateButton={false} />

            <main className="wizard-main">
                <div className="wizard-content-area">
                    {/* STEP 1: AI PROMPT */}
                    {currentStep === 1 && (
                        <div className="wizard-step step-info animate-in">
                            {/* Compact Mini Stepper */}
                            <div className="mini-stepper">
                                <div className="mini-step active">
                                    <span className="mini-step-num">1</span>
                                    <span className="mini-step-text">AI Prompt</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step">
                                    <span className="mini-step-num">2</span>
                                    <span className="mini-step-text">Sorular</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step">
                                    <span className="mini-step-num">3</span>
                                    <span className="mini-step-text">Hedef Kitle</span>
                                </div>
                            </div>

                            <div className="step-header-text">
                                <h2><FaRobot style={{ marginRight: '10px', color: 'var(--w-primary)' }} /> Yapay Zeka ile Anket Oluştur</h2>
                                <p>Konunuzu söyleyin, AI sizin için profesyonel sorular oluştursun.</p>
                            </div>
                            <div className="ai-prompt-form">
                                <div className="ai-form-grid">
                                    {/* Left Column: Survey Info */}
                                    <div className="ai-form-col">
                                        <h3><FaClipboardList /> Anket Bilgileri</h3>
                                        <div className="fancy-input-group">
                                            <label>Anket Başlığı</label>
                                            <input
                                                type="text"
                                                placeholder="Örn: Personel Memnuniyet Anketi"
                                                value={anketBaslik}
                                                onChange={(e) => setAnketBaslik(e.target.value)}
                                                className="fancy-text-input"
                                                disabled={aiLoading}
                                            />
                                        </div>
                                        <div className="fancy-input-group">
                                            <label>Açıklama (İsteğe Bağlı)</label>
                                            <textarea
                                                placeholder="Katılımcılara anketin amacından bahsedin..."
                                                value={anketAciklama}
                                                onChange={(e) => setAnketAciklama(e.target.value)}
                                                className="fancy-textarea"
                                                rows="4"
                                                disabled={aiLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Right Column: AI Settings */}
                                    <div className="ai-form-col ai-col">
                                        <h3><FaMagic /> AI Ayarları</h3>
                                        <div className="fancy-input-group">
                                            <label>✨ AI Prompt (Konu)</label>
                                            <textarea
                                                placeholder="Örn: Bir restoran için hijyen, servis hızı ve lezzet hakkında sorular oluştur..."
                                                value={aiTopic}
                                                onChange={(e) => setAiTopic(e.target.value)}
                                                className="fancy-textarea ai-textarea"
                                                rows="5"
                                                disabled={aiLoading}
                                            />
                                        </div>
                                        <div className="ai-count-row">
                                            <div className="question-count-control">
                                                <label>Soru Sayısı</label>
                                                <div className="counter-wrapper">
                                                    <button className="counter-btn" onClick={decreaseCount} disabled={aiLoading}><FaMinus size={10} /></button>
                                                    <input
                                                        type="text"
                                                        className="counter-input"
                                                        value={aiQuestionCount}
                                                        onChange={(e) => handleCountChange(e.target.value)}
                                                        onBlur={handleCountBlur}
                                                        disabled={aiLoading}
                                                    />
                                                    <button className="counter-btn" onClick={increaseCount} disabled={aiLoading}><FaPlus size={10} /></button>
                                                </div>
                                            </div>
                                            <button
                                                className="ai-generate-btn"
                                                onClick={handleAIileOlustur}
                                                disabled={aiLoading || !aiTopic.trim() || !anketBaslik.trim()}
                                            >
                                                {aiLoading ? <FaSpinner className="spinning" /> : <FaMagic />}
                                                {aiLoading ? "Oluşturuluyor..." : "Soruları Oluştur"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: QUESTIONS - With Compact Stepper */}
                    {currentStep === 2 && (
                        <div className="wizard-step step-questions step-questions-compact animate-in">
                            {/* Compact Mini Stepper */}
                            <div className="mini-stepper">
                                <div className="mini-step completed" onClick={() => setCurrentStep(1)}>
                                    <span className="mini-step-num">1</span>
                                    <span className="mini-step-text">AI Prompt</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step active">
                                    <span className="mini-step-num">2</span>
                                    <span className="mini-step-text">Sorular</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step" onClick={() => sorular.length > 0 && setCurrentStep(3)}>
                                    <span className="mini-step-num">3</span>
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

                                                        {/* Settings Row - Better styled */}
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
                                                        </div>

                                                        {/* Preview Section - Shows how answer will look */}
                                                        <div className="q-preview-section">
                                                            <div className="q-preview-label">Önizleme</div>
                                                            
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


                    {/* STEP 3: AUDIENCE */}
                    {currentStep === 3 && (
                        <div className="wizard-step step-audience animate-in">
                            {/* Compact Mini Stepper */}
                            <div className="mini-stepper">
                                <div className="mini-step completed" onClick={() => setCurrentStep(1)}>
                                    <span className="mini-step-num">1</span>
                                    <span className="mini-step-text">AI Prompt</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step completed" onClick={() => setCurrentStep(2)}>
                                    <span className="mini-step-num">2</span>
                                    <span className="mini-step-text">Sorular</span>
                                </div>
                                <div className="mini-step-line"></div>
                                <div className="mini-step active">
                                    <span className="mini-step-num">3</span>
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

                    {/* STEP 4: SUCCESS */}
                    {currentStep === 4 && (
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
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #00d4aa 100%)',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 24px',
                                    boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)'
                                }}>
                                    <FaCheckCircle style={{ fontSize: '2.5rem', color: 'white' }} />
                                </div>

                                {/* Title */}
                                <h2 style={{
                                    fontSize: '1.75rem',
                                    fontWeight: '800',
                                    margin: '0 0 12px',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 40%, #00d4aa 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                }}>
                                    Harika Bir İş Çıkardın!
                                </h2>

                                <p style={{
                                    color: 'var(--w-text-muted, #64748b)',
                                    fontSize: '0.95rem',
                                    marginBottom: '28px'
                                }}>
                                    AI ile oluşturduğun anket başarıyla yayınlandı.
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
                                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
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
                                                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)'
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
                                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                                            color: 'white',
                                            border: 'none',
                                            padding: '14px 28px',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
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
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                
            </main>
        </div>
    );
}

export default AIileAnket;