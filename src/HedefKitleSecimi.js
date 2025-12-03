import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
    FaBars,
    FaUser,
    FaChartBar,
    FaClipboardList,
    FaSignOutAlt,
    FaArrowLeft,
    FaEnvelope,
    FaIdCard,
    FaMapMarkerAlt,
    FaShieldAlt,
    FaLink,
    FaCheckCircle,
    FaMobileAlt,
    FaSpinner,
    FaCopy,
    FaHome,
    FaMapMarkedAlt,
    FaSearch
} from "react-icons/fa";

// Google Maps API Anahtarınız
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "BURAYA_API_KEY_GIRINIZ";

function HedefKitleSecimi() {
    const location = useLocation();
    const navigate = useNavigate();
    const gelenVeri = location.state;
    const navigationChecked = useRef(false);

    // --- GOOGLE MAPS STATE'LERİ ---
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const autoCompleteRef = useRef(null); // Input referansı
    const [mapSearchInput, setMapSearchInput] = useState("");

    // --- APP STATE'LERİ ---
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [olusanLink, setOlusanLink] = useState(null);

    // KRİTERLER
    const [secilenKriterler, setSecilenKriterler] = useState({
        mail: false,
        tcNo: false,
        konum: false,
        kimlikDogrulama: false
    });

    const [mailUzantisi, setMailUzantisi] = useState("");

    // Konum Modal
    const [konumModalAcik, setKonumModalAcik] = useState(false);
    const [googleYeri, setGoogleYeri] = useState(null); // Google'dan gelen ham veri
    const [kisitlamaTuru, setKisitlamaTuru] = useState("sehir"); // sehir, ilce, mahalle, radius
    const [radiusDegeri, setRadiusDegeri] = useState("50"); // metre

    // Veritabanına Kaydedilecek Nihai Konum Objesi
    const [kayitliKonumKriteri, setKayitliKonumKriteri] = useState(null);

    // Mount Kontrolü
    useEffect(() => {
        if (!navigationChecked.current) {
            navigationChecked.current = true;
            if (!gelenVeri) navigate("/");
        }
    }, [gelenVeri, navigate]);

    // Google Maps Script Yükleme
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

    // Autocomplete Başlatma
    useEffect(() => {
        if (scriptLoaded && konumModalAcik && autoCompleteRef.current) {
            const autocomplete = new window.google.maps.places.Autocomplete(autoCompleteRef.current, {
                types: ['geocode'], // Sadece coğrafi yerler (İşletmeleri filtrele)
                componentRestrictions: { country: "tr" }, // Sadece Türkiye
                fields: ["address_components", "geometry", "formatted_address", "name"]
            });

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                handlePlaceSelect(place);
            });
        }
    }, [scriptLoaded, konumModalAcik]);

    // Google Place Verisini İşleme
    const handlePlaceSelect = (place) => {
        if (!place.geometry) {
            alert("Bu konum için detaylı bilgi bulunamadı.");
            return;
        }

        // Adres bileşenlerini ayrıştır
        let il = "", ilce = "", mahalle = "";

        place.address_components.forEach(component => {
            const types = component.types;
            if (types.includes("administrative_area_level_1")) il = component.long_name;
            if (types.includes("administrative_area_level_2")) ilce = component.long_name;
            if (types.includes("administrative_area_level_4") || types.includes("neighborhood")) mahalle = component.long_name;
        });

        // Google Verisini State'e At
        setGoogleYeri({
            tamAdres: place.formatted_address,
            il,
            ilce,
            mahalle,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        });
        setMapSearchInput(place.formatted_address); // Input'a tam adı yaz
    };

    const handleLogout = () => navigate("/giris");
    const handleGeriDon = () => navigate(-1);
    const handleAnketOlustur = () => navigate("/anket-olustur");
    const handlePaneleDon = () => navigate("/panel");

    // Kriter Toggle
    const handleKriterToggle = (kriter) => {
        const yeniDurum = !secilenKriterler[kriter];
        setSecilenKriterler({ ...secilenKriterler, [kriter]: yeniDurum });

        if (kriter === "mail" && !yeniDurum) setMailUzantisi("");

        if (kriter === "konum") {
            if (yeniDurum) {
                setKonumModalAcik(true);
            } else {
                setKayitliKonumKriteri(null);
                setGoogleYeri(null);
                setMapSearchInput("");
            }
        }
    };

    // Konumu Kaydet
    const handleKonumKaydet = () => {
        if (!googleYeri) {
            alert("Lütfen önce arama kutusundan bir konum seçiniz.");
            return;
        }

        // Seçilen kısıtlama türüne göre objeyi hazırla
        const kriterObjesi = {
            tip: kisitlamaTuru, // 'sehir', 'ilce', 'mahalle', 'radius'
            hedef: {
                il: googleYeri.il,
                ilce: (kisitlamaTuru === 'ilce' || kisitlamaTuru === 'mahalle') ? googleYeri.ilce : null,
                mahalle: (kisitlamaTuru === 'mahalle') ? googleYeri.mahalle : null,
                lat: googleYeri.lat,
                lng: googleYeri.lng
            },
            radius: kisitlamaTuru === 'radius' ? parseInt(radiusDegeri) : null,
            aciklama: googleYeri.tamAdres // UI'da göstermek için
        };

        // Mantıksal kontroller
        if (kisitlamaTuru === 'ilce' && !googleYeri.ilce) {
            alert("Seçtiğiniz konumda 'İlçe' verisi bulunamadı. Lütfen bir ilçe aratın.");
            return;
        }
        if (kisitlamaTuru === 'mahalle' && !googleYeri.mahalle) {
            alert("Seçtiğiniz konumda 'Mahalle' verisi bulunamadı. Lütfen bir mahalle aratın.");
            return;
        }

        setKayitliKonumKriteri(kriterObjesi);
        setKonumModalAcik(false);
    };

    const handleLinkOlustur = async () => {
        if (secilenKriterler.mail && !mailUzantisi.trim()) {
            alert("⚠️ Mail kriteri seçtiniz! Lütfen geçerli bir mail uzantısı girin.");
            return;
        }

        if (secilenKriterler.konum && !kayitliKonumKriteri) {
            alert("⚠️ Konum kriteri seçtiniz! Lütfen bir konum belirleyin.");
            setKonumModalAcik(true);
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Oturum süreniz dolmuş.");
            navigate("/giris");
            return;
        }

        setLoading(true);

        const finalVeri = {
            ...gelenVeri,
            hedefKitleKriterleri: {
                ...secilenKriterler,
                mailUzantisi: mailUzantisi,
                // Backend için veri yapısı
                konumHedefi: secilenKriterler.konum ? kayitliKonumKriteri : null
            }
        };

        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/surveys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(finalVeri)
            });

            const result = await response.json();

            if (result.success) {
                const gelenLink = result.data.paylasimLinki;
                const linkParcalari = gelenLink.split('/');
                const anketKodu = linkParcalari[linkParcalari.length - 1];
                const dinamikLink = `${window.location.origin}/anket-coz/${anketKodu}`;

                setOlusanLink(dinamikLink);
                alert("✅ Anket başarıyla oluşturuldu!");
            } else {
                alert("Hata: " + (result.error || "Anket oluşturulamadı."));
            }

        } catch (error) {
            console.error("Kayıt hatası:", error);
            alert("Sunucuya bağlanılamadı.");
        } finally {
            setLoading(false);
        }
    };

    const handleLinkKopyala = () => {
        navigator.clipboard.writeText(olusanLink);
        alert("📋 Link kopyalandı!");
    };

    if (!gelenVeri) return null;

    return (
        <div className="panel-container" style={{ minHeight: "100vh", background: "#f5f6fa" }}>

            {/* --- GOOGLE MAPS LOCATION MODAL --- */}
            {konumModalAcik && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0, 0, 0, 0.6)",
                    display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
                    backdropFilter: "blur(3px)"
                }}>
                    <div style={{
                        background: "white", borderRadius: "16px",
                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
                        maxWidth: "600px", width: "90%", overflow: "hidden",
                        animation: "fadeInUp 0.3s ease-out"
                    }}>
                        {/* Header */}
                        <div style={{
                            background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)",
                            padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <FaMapMarkedAlt size={24} />
                                <h3 style={{ margin: 0, fontWeight: 600 }}>Google Maps ile Konum Seç</h3>
                            </div>
                            <button onClick={() => setKonumModalAcik(false)} style={{ background: "none", border: "none", color: "white", fontSize: "1.5em", cursor: "pointer" }}>✕</button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "30px" }}>
                            <p style={{ color: "#555", marginBottom: "15px", fontSize: "0.95em" }}>
                                Lütfen anketin uygulanacağı bölgeyi aratın (Örn: "Kadıköy", "Ankara", "Bağdat Caddesi")
                            </p>

                            {/* Google Autocomplete Input */}
                            <div style={{ position: "relative", marginBottom: "25px" }}>
                                <FaSearch style={{ position: "absolute", top: "14px", left: "15px", color: "#999" }} />
                                <input
                                    ref={autoCompleteRef}
                                    type="text"
                                    placeholder="Konum arayın..."
                                    value={mapSearchInput}
                                    onChange={(e) => setMapSearchInput(e.target.value)}
                                    style={{
                                        width: "100%", padding: "12px 12px 12px 40px", borderRadius: "8px",
                                        border: "2px solid #ddd", fontSize: "1em", outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            {/* Seçim Yapıldıysa Gösterilecek Ayarlar */}
                            {googleYeri && (
                                <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "10px", border: "1px solid #e0e0e0" }}>
                                    <div style={{ marginBottom: "15px", fontSize: "0.9em", color: "#333" }}>
                                        <strong>Bulunan Yer:</strong> {googleYeri.tamAdres}
                                    </div>

                                    <label style={{ display: "block", fontWeight: 600, color: "#2c3e50", marginBottom: "10px" }}>
                                        🎯 Bu konum için kısıtlama türü:
                                    </label>

                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
                                        <button
                                            onClick={() => setKisitlamaTuru("sehir")}
                                            style={{
                                                padding: "8px 12px", borderRadius: "20px", border: "1px solid #ddd", cursor: "pointer",
                                                background: kisitlamaTuru === "sehir" ? "#4285F4" : "white",
                                                color: kisitlamaTuru === "sehir" ? "white" : "#555"
                                            }}
                                        >
                                            Şehir Geneli ({googleYeri.il})
                                        </button>

                                        {googleYeri.ilce && (
                                            <button
                                                onClick={() => setKisitlamaTuru("ilce")}
                                                style={{
                                                    padding: "8px 12px", borderRadius: "20px", border: "1px solid #ddd", cursor: "pointer",
                                                    background: kisitlamaTuru === "ilce" ? "#4285F4" : "white",
                                                    color: kisitlamaTuru === "ilce" ? "white" : "#555"
                                                }}
                                            >
                                                İlçe Geneli ({googleYeri.ilce})
                                            </button>
                                        )}

                                        {googleYeri.mahalle && (
                                            <button
                                                onClick={() => setKisitlamaTuru("mahalle")}
                                                style={{
                                                    padding: "8px 12px", borderRadius: "20px", border: "1px solid #ddd", cursor: "pointer",
                                                    background: kisitlamaTuru === "mahalle" ? "#4285F4" : "white",
                                                    color: kisitlamaTuru === "mahalle" ? "white" : "#555"
                                                }}
                                            >
                                                Mahalle ({googleYeri.mahalle})
                                            </button>
                                        )}

                                        <button
                                            onClick={() => setKisitlamaTuru("radius")}
                                            style={{
                                                padding: "8px 12px", borderRadius: "20px", border: "1px solid #ddd", cursor: "pointer",
                                                background: kisitlamaTuru === "radius" ? "#EA4335" : "white",
                                                color: kisitlamaTuru === "radius" ? "white" : "#555"
                                            }}
                                        >
                                            📍 Yarıçap (Mesafe)
                                        </button>
                                    </div>

                                    {/* Yarıçap Seçildiyse Mesafe Inputu */}
                                    {kisitlamaTuru === "radius" && (
                                        <div style={{ marginTop: "10px", padding: "10px", background: "#fff", border: "1px solid #EA4335", borderRadius: "8px" }}>
                                            <label style={{ fontSize: "0.9em", display: "block", marginBottom: "5px" }}>Merkezden kaç metre uzağa kadar?</label>
                                            <select
                                                value={radiusDegeri}
                                                onChange={(e) => setRadiusDegeri(e.target.value)}
                                                style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
                                            >
                                                <option value="50">50 Metre</option>
                                                <option value="100">100 Metre</option>
                                                <option value="500">500 Metre</option>
                                                <option value="1000">1 Kilometre</option>
                                                <option value="5000">5 Kilometre</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Kaydet Butonu */}
                            <button
                                onClick={handleKonumKaydet}
                                disabled={!googleYeri}
                                style={{
                                    width: "100%", padding: "15px", borderRadius: "10px", border: "none", marginTop: "20px",
                                    background: googleYeri ? "#34A853" : "#bdc3c7", color: "white", fontWeight: "bold", fontSize: "1.1em",
                                    cursor: googleYeri ? "pointer" : "not-allowed", transition: "all 0.3s"
                                }}
                            >
                                ✓ Konum Kriterini Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            <div className={`sidebar ${menuOpen ? "open" : ""}`}>
                <ul>
                    <li onClick={() => navigate('/profil')}><FaUser className="icon" /> Profil</li>
                    <li><FaClipboardList className="icon" /> Anket Oluştur</li>
                    <li><FaChartBar className="icon" /> Sonuçları Gör</li>
                    <li onClick={handleLogout}><FaSignOutAlt className="icon" /> Çıkış Yap</li>
                </ul>
            </div>

            <main className="anket-main" style={{ padding: "40px 20px" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "40px" }}>
                        <h1 style={{ fontSize: "2.5em", color: "#2c3e50", marginBottom: "10px" }}>🎯 Hedef Kitle Seçimi</h1>
                        <p style={{ color: "#7f8c8d", fontSize: "1.1em" }}>Katılımcılardan hangi bilgileri istediğinizi seçin</p>
                    </div>

                    {/* ZORUNLU KRİTER */}
                    <div style={{ background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)", borderRadius: "16px", padding: "25px", marginBottom: "30px", boxShadow: "0 6px 20px rgba(231, 76, 60, 0.3)", border: "3px solid #c0392b" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                            <div style={{ background: "white", borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FaMobileAlt style={{ fontSize: "1.8em", color: "#e74c3c" }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                                    <h3 style={{ fontSize: "1.4em", color: "white", margin: 0 }}>Cep Telefonu</h3>
                                    <span style={{ background: "rgba(255,255,255,0.25)", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75em", fontWeight: 700, letterSpacing: "0.5px" }}>ZORUNLU</span>
                                </div>
                                <p style={{ color: "rgba(255,255,255,0.9)", margin: 0, fontSize: "0.95em" }}>Tüm katılımcılardan cep telefonu numarası istenecek</p>
                            </div>
                            <FaCheckCircle style={{ fontSize: "2em", color: "white" }} />
                        </div>
                    </div>

                    {/* SEÇİLEBİLİR KRİTERLER */}
                    <div className="guvenli-alan" style={{ background: "white", borderRadius: "16px", padding: "30px", marginBottom: "25px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                            <FaShieldAlt style={{ fontSize: "1.5em", color: "#3498db" }} />
                            <h3 style={{ fontSize: "1.4em", color: "#2c3e50", margin: 0 }}>Ek Doğrulama Kriterleri</h3>
                        </div>
                        <p style={{ color: "#7f8c8d", marginBottom: "20px" }}>İsteğe bağlı olarak aşağıdaki bilgileri de katılımcılardan isteyebilirsiniz.</p>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginTop: "20px" }}>
                            {/* Mail Kriteri */}
                            <div style={{ gridColumn: secilenKriterler.mail ? "1 / -1" : "auto" }}>
                                <div onClick={() => handleKriterToggle("mail")} style={{ background: secilenKriterler.mail ? "#ebf5fb" : "#f8f9fa", border: `2px solid ${secilenKriterler.mail ? "#3498db" : "#e0e0e0"}`, borderRadius: "12px", padding: "20px", cursor: "pointer", transition: "all 0.3s", boxShadow: secilenKriterler.mail ? "0 4px 12px rgba(52, 152, 219, 0.2)" : "none" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <input type="checkbox" checked={secilenKriterler.mail} onChange={() => { }} style={{ width: "20px", height: "20px", cursor: "pointer" }} />
                                        <FaEnvelope style={{ fontSize: "1.3em", color: "#3498db" }} />
                                        <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "1.05em" }}>E-Mail Adresi</span>
                                    </div>
                                    <p style={{ margin: "10px 0 0 44px", fontSize: "0.9em", color: "#7f8c8d" }}>Katılımcıdan e-mail adresi istenecek</p>
                                </div>
                                {secilenKriterler.mail && (
                                    <div style={{ marginTop: "15px", padding: "20px", background: "#f0f8ff", borderRadius: "10px", border: "2px dashed #3498db", animation: "slideDown 0.3s ease-out" }}>
                                        <label style={{ display: "block", fontWeight: 600, color: "#2c3e50", marginBottom: "10px", fontSize: "0.95em" }}>📧 Mail Uzantısı (Domain) Belirleyin:</label>
                                        <input type="text" value={mailUzantisi} onChange={(e) => setMailUzantisi(e.target.value)} placeholder="Örn: @gmail.com veya @sirket.com" style={{ width: "100%", padding: "12px 15px", border: "2px solid #3498db", borderRadius: "8px", fontSize: "1em", boxSizing: "border-box", outline: "none" }} />
                                    </div>
                                )}
                            </div>

                            {/* TC Kriteri */}
                            <div onClick={() => handleKriterToggle("tcNo")} style={{ background: secilenKriterler.tcNo ? "#ebf5fb" : "#f8f9fa", border: `2px solid ${secilenKriterler.tcNo ? "#3498db" : "#e0e0e0"}`, borderRadius: "12px", padding: "20px", cursor: "pointer", transition: "all 0.3s", boxShadow: secilenKriterler.tcNo ? "0 4px 12px rgba(52, 152, 219, 0.2)" : "none" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <input type="checkbox" checked={secilenKriterler.tcNo} onChange={() => { }} style={{ width: "20px", height: "20px", cursor: "pointer" }} />
                                    <FaIdCard style={{ fontSize: "1.3em", color: "#3498db" }} />
                                    <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "1.05em" }}>TC Kimlik No</span>
                                </div>
                                <p style={{ margin: "10px 0 0 44px", fontSize: "0.9em", color: "#7f8c8d" }}>Katılımcıdan TC kimlik numarası istenecek</p>
                            </div>

                            {/* KONUM KRİTERİ (Google Maps Entegreli) */}
                            <div style={{ gridColumn: secilenKriterler.konum ? "1 / -1" : "auto" }}>
                                <div onClick={() => handleKriterToggle("konum")} style={{ background: secilenKriterler.konum ? "#ebf5fb" : "#f8f9fa", border: `2px solid ${secilenKriterler.konum ? "#3498db" : "#e0e0e0"}`, borderRadius: "12px", padding: "20px", cursor: "pointer", transition: "all 0.3s", boxShadow: secilenKriterler.konum ? "0 4px 12px rgba(52, 152, 219, 0.2)" : "none" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <input type="checkbox" checked={secilenKriterler.konum} onChange={() => { }} style={{ width: "20px", height: "20px", cursor: "pointer" }} />
                                        <FaMapMarkerAlt style={{ fontSize: "1.3em", color: "#3498db" }} />
                                        <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "1.05em" }}>Bölge Kısıtlaması</span>
                                    </div>
                                    <p style={{ margin: "10px 0 0 44px", fontSize: "0.9em", color: "#7f8c8d" }}>Sadece belirlediğiniz bölgedeki kullanıcılar katılabilir</p>
                                </div>

                                {secilenKriterler.konum && (
                                    <div style={{ marginTop: "15px", padding: "20px", background: "#f0f8ff", borderRadius: "10px", border: "2px dashed #3498db", animation: "slideDown 0.3s ease-out" }}>
                                        {!kayitliKonumKriteri ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <p style={{ color: '#e67e22', fontWeight: 600, marginBottom: '15px' }}>Henüz bir bölge seçilmedi.</p>
                                                <button
                                                    onClick={() => setKonumModalAcik(true)}
                                                    style={{ background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                                >
                                                    <FaSearch /> Google Maps ile Bölge Seç
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #2ecc71' }}>
                                                <div>
                                                    <h4 style={{ margin: '0 0 5px 0', color: '#27ae60' }}>✓ Seçilen Hedef Bölge:</h4>
                                                    <div style={{ fontSize: '1em', color: '#555', marginBottom: '4px' }}>
                                                        <strong>Adres:</strong> {kayitliKonumKriteri.aciklama}
                                                    </div>
                                                    <span style={{ fontSize: '0.85em', fontWeight: 600, background: '#d1f2eb', color: '#16a085', padding: '3px 8px', borderRadius: '4px' }}>
                                                        Kısıtlama: {kayitliKonumKriteri.tip === 'radius' ? `Merkeze ${kayitliKonumKriteri.radius}m yakınlık` : `${kayitliKonumKriteri.tip.toUpperCase()} geneli`}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => setKonumModalAcik(true)}
                                                    style={{ background: '#f39c12', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    Düzenle
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Kimlik Kriteri */}
                            <div onClick={() => handleKriterToggle("kimlikDogrulama")} style={{ background: secilenKriterler.kimlikDogrulama ? "#ebf5fb" : "#f8f9fa", border: `2px solid ${secilenKriterler.kimlikDogrulama ? "#3498db" : "#e0e0e0"}`, borderRadius: "12px", padding: "20px", cursor: "pointer", transition: "all 0.3s", boxShadow: secilenKriterler.kimlikDogrulama ? "0 4px 12px rgba(52, 152, 219, 0.2)" : "none" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <input type="checkbox" checked={secilenKriterler.kimlikDogrulama} onChange={() => { }} style={{ width: "20px", height: "20px", cursor: "pointer" }} />
                                    <FaShieldAlt style={{ fontSize: "1.3em", color: "#3498db" }} />
                                    <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "1.05em" }}>Kimlik Belgesi</span>
                                </div>
                                <p style={{ margin: "10px 0 0 44px", fontSize: "0.9em", color: "#7f8c8d" }}>Katılımcıdan kimlik belgesi fotoğrafı istenecek</p>
                            </div>
                        </div>

                        {/* Özet */}
                        {Object.values(secilenKriterler).some(v => v) && (
                            <div style={{ marginTop: "25px", padding: "15px", background: "#e8f5e9", borderRadius: "10px", borderLeft: "4px solid #4caf50" }}>
                                <strong style={{ color: "#2e7d32" }}>✓ Seçilen Ek Kriterler:</strong>
                                <div style={{ marginTop: "8px", color: "#1b5e20" }}>
                                    {secilenKriterler.mail && <div>• E-Mail Adresi {mailUzantisi && `(${mailUzantisi})`}</div>}
                                    {secilenKriterler.tcNo && <div>• TC Kimlik No</div>}
                                    {secilenKriterler.konum && <div>• Bölge Kısıtlaması: {kayitliKonumKriteri ? `${kayitliKonumKriteri.aciklama}` : '(Seçim bekleniyor)'}</div>}
                                    {secilenKriterler.kimlikDogrulama && <div>• Kimlik Belgesi</div>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BUTONLAR */}
                    <div style={{ textAlign: "center", margin: "40px 0" }}>
                        {!olusanLink ? (
                            <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
                                <button onClick={handleLinkOlustur} disabled={loading} style={{ background: loading ? "#95a5a6" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", padding: "18px 50px", fontSize: "1.2em", fontWeight: 600, borderRadius: "50px", cursor: loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", boxShadow: loading ? "none" : "0 4px 15px rgba(102, 126, 234, 0.4)", transition: "all 0.3s", opacity: loading ? 0.7 : 1 }}>
                                    {loading ? <FaSpinner className="fa-spin" style={{ marginRight: "10px" }} /> : <FaLink style={{ marginRight: "10px" }} />}
                                    {loading ? "Oluşturuluyor..." : "Anketi Yayınla ve Link Al"}
                                </button>
                                <button onClick={handlePaneleDon} disabled={loading} style={{ background: "linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)", color: "white", border: "none", padding: "18px 50px", fontSize: "1.2em", fontWeight: 600, borderRadius: "50px", cursor: "pointer", display: "inline-flex", alignItems: "center", boxShadow: "0 4px 15px rgba(149, 165, 166, 0.4)", transition: "all 0.3s" }}>
                                    İptal / Panele Dön
                                </button>
                            </div>
                        ) : (
                            <div style={{ background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)", borderRadius: "20px", padding: "40px", boxShadow: "0 10px 40px rgba(46, 204, 113, 0.3)", animation: "fadeInUp 0.5s ease-out", color: "white" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginBottom: "20px" }}>
                                    <FaCheckCircle style={{ fontSize: "3em", color: "white" }} />
                                    <h2 style={{ margin: 0, fontSize: "2em" }}>🎉 Anket Hazır!</h2>
                                </div>
                                <p style={{ fontSize: "1.1em", marginBottom: "25px", opacity: 0.95 }}>Anketiniz başarıyla oluşturuldu! Aşağıdaki linki kopyalayıp hedef kitlenizle paylaşabilirsiniz:</p>
                                <div style={{ background: "rgba(255, 255, 255, 0.95)", borderRadius: "15px", padding: "20px", display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)" }}>
                                    <a href={olusanLink} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: "250px", color: "#2c3e50", fontSize: "1.05em", fontWeight: 500, textDecoration: "none", wordBreak: "break-all" }}>{olusanLink}</a>
                                    <button onClick={handleLinkKopyala} style={{ background: "#3498db", color: "white", border: "none", padding: "12px 25px", borderRadius: "10px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "1em", transition: "all 0.3s" }} onMouseOver={(e) => e.target.style.background = "#2980b9"} onMouseOut={(e) => e.target.style.background = "#3498db"}>
                                        <FaCopy /> Kopyala
                                    </button>
                                </div>
                                <div style={{ marginTop: "30px" }}>
                                    <button onClick={() => navigate("/panel")} style={{ background: "rgba(255, 255, 255, 0.2)", color: "white", border: "2px solid white", padding: "12px 30px", borderRadius: "25px", fontWeight: 600, cursor: "pointer", fontSize: "1em", transition: "all 0.3s" }} onMouseOver={(e) => { e.target.style.background = "white"; e.target.style.color = "#27ae60"; }} onMouseOut={(e) => { e.target.style.background = "rgba(255, 255, 255, 0.2)"; e.target.style.color = "white"; }}>Panele Dön</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style>{`
                .guvenli-alan { opacity: 1 !important; visibility: visible !important; animation: none !important; transition: none !important; height: auto !important; display: block !important; }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                .fa-spin { animation: spin 1s infinite linear; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default HedefKitleSecimi;