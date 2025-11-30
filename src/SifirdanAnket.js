import React, { useState } from "react";
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
    FaPalette
} from "react-icons/fa";
import "./SifirdanAnket.css";

function SifirdanAnket() {
    // --- STATE YÖNETİMİ (AIileAnket ile Eşitlendi) ---
    const [anketBaslik, setAnketBaslik] = useState(""); // İsim düzeltildi
    const [anketAciklama, setAnketAciklama] = useState(""); // İsim düzeltildi

    const [soruSayisi, setSoruSayisi] = useState(0);
    const [sorular, setSorular] = useState([]);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => navigate("/giris");
    const handleGeriDon = () => navigate("/anket-olustur");
    const handleAnketOlustur = () => navigate("/anket-olustur");

    // --- BAŞLANGIÇTA SORU TASLAĞI OLUŞTURMA ---
    const handleOlustur = () => {
        // --- BAŞLIK KONTROLÜ ---
        if (!anketBaslik.trim()) {
            alert("Lütfen anketinize bir isim verin.");
            return;
        }

        const yeniSorular = [];
        for (let i = 0; i < soruSayisi; i++) {
            yeniSorular.push({
                id: Date.now() + i,
                metin: "",
                tip: "acik-uclu",
                secenekler: [],
                zorunlu: true
            });
        }
        setSorular(yeniSorular);
    };

    // --- SORU DÜZENLEME FONKSİYONLARI ---
    const handleSoruDegis = (id, yeniMetin) => {
        setSorular(
            sorular.map((s) => (s.id === id ? { ...s, metin: yeniMetin } : s))
        );
    };

    const handleTipDegis = (id, tip) => {
        setSorular(
            sorular.map((s) => (s.id === id ? {
                ...s,
                tip,
                secenekler: tip.includes("coktan") ? ["", ""] : []
            } : s))
        );
    };

    const handleSecenekEkle = (id) => {
        setSorular(
            sorular.map((s) =>
                s.id === id
                    ? { ...s, secenekler: [...s.secenekler, ""] }
                    : s
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
        setSorular(
            sorular.map((s) => (s.id === id ? { ...s, zorunlu: !s.zorunlu } : s))
        );
    };

    const handleSoruSil = (id) => {
        setSorular(sorular.filter(s => s.id !== id));
    };

    // --- ANKETİ YAYINLA / İLERLE ---
    const handleAnketiYayinla = () => {
        // 1. GİRİŞ KONTROLÜ
        const token = localStorage.getItem("token");

        if (!token) {
            alert("❌ Önce giriş yapmalısınız!");
            navigate("/giris");
            return;
        }

        // 2. VALIDASYONLAR
        if (!anketBaslik.trim()) {
            alert("❌ Anket başlığı boş olamaz!");
            return;
        }

        if (sorular.length === 0) {
            alert("❌ En az bir soru eklemelisiniz!");
            return;
        }

        const bosSorular = sorular.filter(s => !s.metin.trim());
        if (bosSorular.length > 0) {
            alert("❌ Lütfen tüm soruları doldurun!");
            return;
        }

        // 3. VERİYİ HAZIRLA (Mapping) - AIileAnket FORMATI İLE AYNI
        const backendFormatindaSorular = sorular.map((s, index) => ({
            soruId: s.id ? s.id.toString() : (Date.now() + index).toString(),
            soruMetni: s.metin,
            soruTipi: s.tip,
            zorunlu: s.zorunlu !== undefined ? s.zorunlu : true,
            siraNo: index + 1,
            secenekler: (s.secenekler || []).map((sec, i) => ({
                secenekId: `opt-${index}-${i}`,
                metin: sec
            })),
            sliderMin: s.tip === 'slider' ? 1 : null,
            sliderMax: s.tip === 'slider' ? 10 : null
        }));

        // BU KISIM ARTIK AIileAnket İLE TAMAMEN AYNI İSİMLERİ KULLANIYOR
        const tasinanVeri = {
            anketBaslik: anketBaslik,     // Backend'in beklediği: anketBaslik
            anketAciklama: anketAciklama, // Backend'in beklediği: anketAciklama
            sorular: backendFormatindaSorular,
            aiIleOlusturuldu: false
        };

        console.log("Taşınan Veri:", tasinanVeri); // Kontrol için log

        // 4. Veriyi HedefKitleSecimi'ye taşı
        navigate("/hedef-kitle-secimi", { state: tasinanVeri });
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

            {/* İçerik */}
            <main className="anket-main">
                <div className="sifirdan-anket-container">
                    <div className="sifirdan-anket-header">
                        <h1>🎯 Sıfırdan Anket Oluştur</h1>
                        <p>Profesyonel anketinizi adım adım oluşturun.</p>
                    </div>

                    {sorular.length === 0 ? (
                        <div className="sifirdan-baslangic-ekrani">
                            <div className="sifirdan-baslangic-kart">
                                <div className="sifirdan-ikon-cerceve">
                                    <FaPalette className="sifirdan-ana-ikon" />
                                </div>
                                <h2>Anket Detayları</h2>
                                <p>Anketinizin genel bilgilerini girin.</p>

                                {/* --- GÜNCELLENMİŞ INPUT ALANLARI --- */}
                                <div className="sifirdan-input-group">
                                    <label>Anket Başlığı (Zorunlu)</label>
                                    <input
                                        type="text"
                                        className="sifirdan-text-input"
                                        placeholder="Örn: Müşteri Memnuniyet Anketi"
                                        value={anketBaslik} // Değişken adı güncellendi
                                        onChange={(e) => setAnketBaslik(e.target.value)} // Setter güncellendi
                                    />
                                </div>

                                <div className="sifirdan-input-group">
                                    <label>Açıklama (İsteğe Bağlı)</label>
                                    <textarea
                                        className="sifirdan-textarea-input"
                                        placeholder="Anketin amacı nedir?"
                                        value={anketAciklama} // Değişken adı güncellendi
                                        onChange={(e) => setAnketAciklama(e.target.value)} // Setter güncellendi
                                        rows="3"
                                    />
                                </div>

                                <div className="sifirdan-soru-sayisi-girdi">
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Soru Sayısı</label>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={soruSayisi}
                                            onChange={(e) => setSoruSayisi(parseInt(e.target.value) || 0)}
                                            placeholder="5"
                                        />
                                        <span style={{ marginLeft: '10px' }}>soru</span>
                                    </div>
                                </div>
                                {/* ------------------------- */}

                                <button
                                    className="sifirdan-baslat-butonu"
                                    onClick={handleOlustur}
                                    disabled={soruSayisi < 1 || !anketBaslik.trim()}
                                >
                                    <FaPlus style={{ marginRight: "8px" }} />
                                    Anketi Oluşturmaya Başla
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="sifirdan-soru-olusturma-ekrani">
                            <div className="sifirdan-soru-listesi-header">
                                {/* Kullanıcının girdiği başlığı burada gösteriyoruz */}
                                <div>
                                    <h2>{anketBaslik}</h2> {/* Değişken adı güncellendi */}
                                    <p style={{ fontSize: '0.9rem', color: '#666' }}>{anketAciklama}</p> {/* Değişken adı güncellendi */}
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
                                <button className="sifirdan-ikincil-buton" onClick={() => setSorular([])}>
                                    Sıfırla
                                </button>
                                <button className="sifirdan-birincil-buton" onClick={handleAnketiYayinla}>
                                    İleri
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default SifirdanAnket;