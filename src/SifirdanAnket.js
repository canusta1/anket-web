import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FaPlus,
    FaTrash,
    FaCheckCircle,
    FaLayerGroup,
    FaCopy,
    FaClipboardList,
    FaChevronLeft,
    FaChevronRight,
    FaSlidersH,
    FaEye
} from "react-icons/fa";
import "./SifirdanAnket.css";
import Navbar from "./components/Navbar";
import HedefKitleSecimi from "./HedefKitleSecimi";

function SifirdanAnket() {
    const navigate = useNavigate();
    const location = useLocation();

    const [currentStep, setCurrentStep] = useState(1);
    const [anketBaslik, setAnketBaslik] = useState("");
    const [anketAciklama, setAnketAciklama] = useState("");
    const [sorular, setSorular] = useState([]);
    const [activeQuestionId, setActiveQuestionId] = useState(null);

    useEffect(() => {
        const template = location.state?.template;
        const initialCount = location.state?.initialQuestionCount;

        if (template) {
            setAnketBaslik(`${template.anketBaslik || template.name} - Kopya`);
            setAnketAciklama(template.anketAciklama || "");
            const formatted = (template.sorular || []).map((soru) => ({
                id: Math.random(),
                metin: soru.soruMetni || soru.metin || soru.soru || '',
                tip: soru.soruTipi || soru.tip || 'acik-uclu',
                secenekler: (soru.secenekler || []).map(sec => (typeof sec === 'string' ? sec : (sec.metin || ""))),
                zorunlu: soru.zorunlu !== undefined ? soru.zorunlu : false
            }));
            setSorular(formatted);
            setCurrentStep(2);
        } else if (initialCount) {
            const yeniSorular = [];
            for (let i = 0; i < initialCount; i++) {
                yeniSorular.push({
                    id: Date.now() + i + Math.random(),
                    metin: "",
                    tip: "acik-uclu",
                    secenekler: [],
                    zorunlu: false
                });
            }
            setSorular(yeniSorular);
            setAnketBaslik("Yeni Anket");
            setCurrentStep(2);
        }
    }, [location.state]);

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

    const handleSoruDegis = (id, metin) => setSorular(sorular.map(s => s.id === id ? { ...s, metin } : s));
    const handleTipDegis = (id, tip) => setSorular(sorular.map(s => {
        if (s.id === id) {
            const base = { ...s, tip, secenekler: tip.includes("coktan") ? ["Seçenek 1", "Seçenek 2"] : [] };
            if (tip === 'slider') {
                return { ...base, sliderMin: 1, sliderMax: 10 };
            }
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
        if (activeQuestionId === id) {
            setActiveQuestionId(yeniSorular.length > 0 ? yeniSorular[0].id : null);
        }
    };

    const handleYeniSoruEkle = () => {
        const yeniId = Math.random();
        const yeniSoru = { id: yeniId, metin: "", tip: "acik-uclu", secenekler: [], zorunlu: false };
        setSorular([...sorular, yeniSoru]);
        setActiveQuestionId(yeniId);
    };

    const nextStep = () => {
        if (currentStep === 1 && !anketBaslik.trim()) { alert("Lütfen anket başlığı girin."); return; }
        if (currentStep === 2 && sorular.length === 0) { alert("En az bir soru eklemelisiniz."); return; }
        if (currentStep === 2 && sorular.some(s => !s.metin.trim())) { alert("Lütfen tüm soruların metnini doldurun."); return; }
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
    };
    const prevStep = () => { setCurrentStep(currentStep - 1); window.scrollTo(0, 0); };

    const mailUzantisiGecerliMi = (uzanti) => {
        const trimmed = uzanti.trim();
        const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
        return pattern.test(trimmed);
    };

    const handleFinalYayinla = async () => {
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
            hedefKitleKriterleri: {
                ...secilenKriterler,
                mailUzantisi,
                konumHedefi: (secilenKriterler.konum && kayitliKonumKriteri) ? {
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
                {/* Stepper */}
                {currentStep < 4 && (
                    <div className="wizard-stepper">
                        <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                            <div className="step-number">{currentStep > 1 ? <FaCheckCircle /> : "1"}</div>
                            <div className="step-label">Genel Bilgiler</div>
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
                    {/* STEP 1: INFO */}
                    {currentStep === 1 && (
                        <div className="wizard-step step-info animate-in">
                            <div className="step-header-text">
                                <h2>Anketine hayat ver</h2>
                                <p>Harika bir başlangıç için anketinize etkileyici bir başlık ve açıklama ekleyin.</p>
                            </div>
                            <div className="info-form-fancy">
                                <div className="fancy-input-group">
                                    <label>Anket Başlığı</label>
                                    <input
                                        type="text"
                                        placeholder="Örn: 2024 Müşteri Deneyimi Araştırması"
                                        value={anketBaslik}
                                        onChange={(e) => setAnketBaslik(e.target.value)}
                                        className="fancy-text-input"
                                    />
                                    <span className="input-hint">Kısa ve öz bir başlık her zaman daha iyidir.</span>
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
                        </div>
                    )}

                    {/* STEP 2: QUESTIONS (Master-Detail Layout) */}
                    {currentStep === 2 && (
                        <div className="wizard-step step-questions animate-in">
                            <div className="questions-layout">
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
                                            {/* Get Active Question */}
                                            {(() => {
                                                const activeQ = sorular.find(s => s.id === activeQuestionId) || sorular[0];
                                                // Sync if activeQuestionId is invalid (e.g. after delete)
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
                                                            <div className="q-actions">
                                                                {/* Optional header actions */}
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
                                                                        <FaSlidersH /> <span>Slider Yapılandırması</span>
                                                                    </div>
                                                                    <div className="slider-config-grid">
                                                                        <div className="config-group">
                                                                            <label>Değer Aralığı</label>
                                                                            <div className="range-inputs">
                                                                                <input
                                                                                    type="number"
                                                                                    value={activeQ.sliderMin || 1}
                                                                                    onChange={(e) => handleSliderAyarlarDegis(activeQ.id, 'sliderMin', parseInt(e.target.value))}
                                                                                    placeholder="Min"
                                                                                />
                                                                                <span>-</span>
                                                                                <input
                                                                                    type="number"
                                                                                    value={activeQ.sliderMax || 10}
                                                                                    onChange={(e) => handleSliderAyarlarDegis(activeQ.id, 'sliderMax', parseInt(e.target.value))}
                                                                                    placeholder="Max"
                                                                                />
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
                                                                        <FaEye /> <span>Slider Önizleme</span>
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

                            <HedefKitleSecimi
                                secilenKriterler={secilenKriterler}
                                setSecilenKriterler={setSecilenKriterler}
                                mailUzantisi={mailUzantisi}
                                setMailUzantisi={setMailUzantisi}
                                kayitliKonumKriteri={kayitliKonumKriteri}
                                setKayitliKonumKriteri={setKayitliKonumKriteri}
                            />
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
                                    Harika Bir İş Çıkardın!
                                </h2>

                                <p style={{
                                    color: 'var(--w-text-muted, #64748b)',
                                    fontSize: '0.95rem',
                                    marginBottom: '28px'
                                }}>
                                    Anketin başarıyla oluşturuldu ve katılımcılarını bekliyor.
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
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                {currentStep < 4 && (
                    <div className="wizard-footer">
                        <div className="footer-left">
                            {currentStep > 1 && (
                                <button className="btn-wizard prev" onClick={prevStep}>
                                    <FaChevronLeft /> Geri
                                </button>
                            )}
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
        </div>
    );
}

export default SifirdanAnket;