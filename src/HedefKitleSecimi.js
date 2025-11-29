import React, { useState, useEffect } from "react";
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
    FaSpinner
} from "react-icons/fa";




function HedefKitleSecimi() {
    const location = useLocation();
    const navigate = useNavigate();

    // Önceki sayfadan (AIileAnket veya SifirdanAnket) taşınan verileri alıyoruz
    const gelenVeri = location.state;

    // Güvenlik: Eğer bu sayfaya direkt linkten girildiyse (veri yoksa) anasayfaya yönlendir
    useEffect(() => {
        if (!gelenVeri) {
            navigate("/");
        }
    }, [gelenVeri, navigate]);

    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [olusanLink, setOlusanLink] = useState(null);

    const [secilenKriterler, setSecilenKriterler] = useState({
        mail: false,
        tcNo: false,
        konum: false,
        kimlikDogrulama: false
    });

    const [mailUzantisi, setMailUzantisi] = useState("");

    const handleLogout = () => navigate("/giris");
    const handleGeriDon = () => navigate(-1);
    const handleAnketOlustur = () => navigate("/anket-olustur");
    const handlePaneleDon = () => navigate("/panel");

    const handleKriterToggle = (kriter) => {
        setSecilenKriterler({ ...secilenKriterler, [kriter]: !secilenKriterler[kriter] });
        // Mail seçimi kaldırıldığında uzantıyı temizle
        if (kriter === "mail" && secilenKriterler.mail) setMailUzantisi("");
    };

    // =================================================================
    // ASIL KAYIT VE LİNK OLUŞTURMA İŞLEMİ (BACKEND İLE)
    // =================================================================
    const handleLinkOlustur = async () => {
        // 1. Validasyon
        if (secilenKriterler.mail && !mailUzantisi.trim()) {
            alert("⚠️ Mail kriteri seçtiniz! Lütfen geçerli bir mail uzantısı girin (örn: @gmail.com).");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            alert("Oturum süreniz dolmuş, lütfen tekrar giriş yapın.");
            navigate("/giris");
            return;
        }

        setLoading(true);

        // 2. Önceki sayfadan gelen veriyi ve burada seçilen kriterleri birleştir
        const finalVeri = {
            ...gelenVeri,
            hedefKitleKriterleri: {
                ...secilenKriterler,
                mailUzantisi: mailUzantisi
            }
        };

        try {
            // 3. Backend'e POST isteği at
            const response = await fetch('http://localhost:4000/api/surveys', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(finalVeri)
            });

            const result = await response.json();

            if (result.success) {
                // --- DEĞİŞİKLİK BURADA ---
                // Yönlendirme (navigate) YAPMIYORUZ.
                // Linki state'e kaydediyoruz.
                setOlusanLink(result.data.paylasimLinki);

                alert("✅ Anket başarıyla oluşturuldu! Link aşağıda belirecektir.");

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

    // Eğer veri yoksa boş render (useEffect yönlendirecek)
    if (!gelenVeri) return null;

    return (
        <div className="panel-container" style={{ minHeight: "100vh", background: "#f5f6fa" }}>
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
            <main className="anket-main" style={{ padding: "40px 20px" }}>
                <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: "40px" }}>
                        <h1 style={{ fontSize: "2.5em", color: "#2c3e50", marginBottom: "10px" }}>🎯 Hedef Kitle Seçimi</h1>
                        <p style={{ color: "#7f8c8d", fontSize: "1.1em" }}>Katılımcılardan hangi bilgileri istediğinizi seçin</p>
                    </div>

                    {/* ZORUNLU KRİTER - CEP TELEFONU (Sabit) */}
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
                                <p style={{ color: "rgba(255,255,255,0.9)", margin: 0, fontSize: "0.95em" }}>
                                    Tüm katılımcılardan cep telefonu numarası istenecek
                                </p>
                            </div>
                            <FaCheckCircle style={{ fontSize: "2em", color: "white" }} />
                        </div>
                    </div>

                    {/* SEÇİLEBİLİR KRİTERLER */}
                    <div style={{ background: "white", borderRadius: "16px", padding: "30px", marginBottom: "25px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                            <FaShieldAlt style={{ fontSize: "1.5em", color: "#3498db" }} />
                            <h3 style={{ fontSize: "1.4em", color: "#2c3e50", margin: 0 }}>Ek Doğrulama Kriterleri</h3>
                        </div>
                        <p style={{ color: "#7f8c8d", marginBottom: "20px" }}>
                            İsteğe bağlı olarak aşağıdaki bilgileri de katılımcılardan isteyebilirsiniz.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginTop: "20px" }}>
                            {/* Mail Kriteri */}
                            <div style={{ gridColumn: secilenKriterler.mail ? "1 / -1" : "auto" }}>
                                <div
                                    onClick={() => handleKriterToggle("mail")}
                                    style={{
                                        background: secilenKriterler.mail ? "#ebf5fb" : "#f8f9fa",
                                        border: `2px solid ${secilenKriterler.mail ? "#3498db" : "#e0e0e0"}`,
                                        borderRadius: "12px",
                                        padding: "20px",
                                        cursor: "pointer",
                                        transition: "all 0.3s",
                                        boxShadow: secilenKriterler.mail ? "0 4px 12px rgba(52, 152, 219, 0.2)" : "none"
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <input
                                            type="checkbox"
                                            checked={secilenKriterler.mail}
                                            onChange={() => { }}
                                            style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                        />
                                        <FaEnvelope style={{ fontSize: "1.3em", color: "#3498db" }} />
                                        <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "1.05em" }}>E-Mail Adresi</span>
                                    </div>
                                    <p style={{ margin: "10px 0 0 44px", fontSize: "0.9em", color: "#7f8c8d" }}>
                                        Katılımcıdan e-mail adresi istenecek
                                    </p>
                                </div>

                                {/* Mail Uzantısı Girişi */}
                                {secilenKriterler.mail && (
                                    <div style={{
                                        marginTop: "15px",
                                        padding: "20px",
                                        background: "#f0f8ff",
                                        borderRadius: "10px",
                                        border: "2px dashed #3498db",
                                        animation: "slideDown 0.3s ease-out"
                                    }}>
                                        <label style={{ display: "block", fontWeight: 600, color: "#2c3e50", marginBottom: "10px", fontSize: "0.95em" }}>
                                            📧 Mail Uzantısı (Domain) Belirleyin:
                                        </label>
                                        <input
                                            type="text"
                                            value={mailUzantisi}
                                            onChange={(e) => setMailUzantisi(e.target.value)}
                                            placeholder="Örn: @gmail.com veya @sirket.com"
                                            style={{
                                                width: "100%",
                                                padding: "12px 15px",
                                                border: "2px solid #3498db",
                                                borderRadius: "8px",
                                                fontSize: "1em",
                                                boxSizing: "border-box",
                                                outline: "none",
                                                transition: "all 0.3s"
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = "#2980b9"}
                                            onBlur={(e) => e.target.style.borderColor = "#3498db"}
                                        />
                                        <p style={{ margin: "10px 0 0 0", fontSize: "0.85em", color: "#7f8c8d", lineHeight: 1.4 }}>
                                            💡 <strong>İpucu:</strong> Sadece bu uzantıya sahip e-mail adresleri ankete erişebilecek.
                                            Örneğin "@sirket.com" yazarsanız, sadece sirket.com uzantılı mailler kabul edilir.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* TC Kriteri */}
                            <div
                                onClick={() => handleKriterToggle("tcNo")}
                                style={{
                                    background: secilenKriterler.tcNo ? "#ebf5fb" : "#f8f9fa",
                                    border: `2px solid ${secilenKriterler.tcNo ? "#3498db" : "#e0e0e0"}`,
                                    borderRadius: "12px",
                                    padding: "20px",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                    boxShadow: secilenKriterler.tcNo ? "0 4px 12px rgba(52, 152, 219, 0.2)" : "none"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <input
                                        type="checkbox"
                                        checked={secilenKriterler.tcNo}
                                        onChange={() => { }}
                                        style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                    />
                                    <FaIdCard style={{ fontSize: "1.3em", color: "#3498db" }} />
                                    <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "1.05em" }}>TC Kimlik No</span>
                                </div>
                                <p style={{ margin: "10px 0 0 44px", fontSize: "0.9em", color: "#7f8c8d" }}>
                                    Katılımcıdan TC kimlik numarası istenecek
                                </p>
                            </div>

                            {/* Konum Kriteri */}
                            <div
                                onClick={() => handleKriterToggle("konum")}
                                style={{
                                    background: secilenKriterler.konum ? "#ebf5fb" : "#f8f9fa",
                                    border: `2px solid ${secilenKriterler.konum ? "#3498db" : "#e0e0e0"}`,
                                    borderRadius: "12px",
                                    padding: "20px",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                    boxShadow: secilenKriterler.konum ? "0 4px 12px rgba(52, 152, 219, 0.2)" : "none"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <input
                                        type="checkbox"
                                        checked={secilenKriterler.konum}
                                        onChange={() => { }}
                                        style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                    />
                                    <FaMapMarkerAlt style={{ fontSize: "1.3em", color: "#3498db" }} />
                                    <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "1.05em" }}>Konum Bilgisi</span>
                                </div>
                                <p style={{ margin: "10px 0 0 44px", fontSize: "0.9em", color: "#7f8c8d" }}>
                                    Katılımcıdan konum/şehir bilgisi istenecek
                                </p>
                            </div>

                            {/* Kimlik Doğrulama Kriteri */}
                            <div
                                onClick={() => handleKriterToggle("kimlikDogrulama")}
                                style={{
                                    background: secilenKriterler.kimlikDogrulama ? "#ebf5fb" : "#f8f9fa",
                                    border: `2px solid ${secilenKriterler.kimlikDogrulama ? "#3498db" : "#e0e0e0"}`,
                                    borderRadius: "12px",
                                    padding: "20px",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                    boxShadow: secilenKriterler.kimlikDogrulama ? "0 4px 12px rgba(52, 152, 219, 0.2)" : "none"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <input
                                        type="checkbox"
                                        checked={secilenKriterler.kimlikDogrulama}
                                        onChange={() => { }}
                                        style={{ width: "20px", height: "20px", cursor: "pointer" }}
                                    />
                                    <FaShieldAlt style={{ fontSize: "1.3em", color: "#3498db" }} />
                                    <span style={{ fontWeight: 600, color: "#2c3e50", fontSize: "1.05em" }}>Kimlik Belgesi</span>
                                </div>
                                <p style={{ margin: "10px 0 0 44px", fontSize: "0.9em", color: "#7f8c8d" }}>
                                    Katılımcıdan kimlik belgesi fotoğrafı istenecek
                                </p>
                            </div>
                        </div>

                        {/* Seçilen Kriterler Özeti */}
                        {Object.values(secilenKriterler).some(v => v) && (
                            <div style={{ marginTop: "25px", padding: "15px", background: "#e8f5e9", borderRadius: "10px", borderLeft: "4px solid #4caf50" }}>
                                <strong style={{ color: "#2e7d32" }}>✓ Seçilen Ek Kriterler:</strong>
                                <div style={{ marginTop: "8px", color: "#1b5e20" }}>
                                    {secilenKriterler.mail && <div>• E-Mail Adresi {mailUzantisi && `(${mailUzantisi})`}</div>}
                                    {secilenKriterler.tcNo && <div>• TC Kimlik No</div>}
                                    {secilenKriterler.konum && <div>• Konum Bilgisi</div>}
                                    {secilenKriterler.kimlikDogrulama && <div>• Kimlik Belgesi</div>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Aksiyon Alanı */}
                    <div style={{ textAlign: "center", margin: "40px 0" }}>

                        {/* EĞER LİNK OLUŞTUYSA -> YEŞİL KUTUYU GÖSTER */}
                        {olusanLink ? (
                            <div className="anket-basari-kutusu">
                                <h3>🎉 Anketiniz Yayına Hazır!</h3>
                                <p>Aşağıdaki linki kopyalayarak hedef kitlenizle paylaşabilirsiniz:</p>

                                <div className="link-satiri">
                                    <a
                                        href={olusanLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="olusan-link"
                                    >
                                        {olusanLink}
                                    </a>

                                    <button
                                        className="link-kopyala-btn"
                                        onClick={() => {
                                            navigator.clipboard.writeText(olusanLink);
                                            alert("Link kopyalandı! 📋");
                                        }}
                                    >
                                        Kopyala
                                    </button>
                                </div>

                                {/* İsteğe bağlı: Tekrar ana sayfaya dön butonu */}
                                <div style={{ marginTop: '20px' }}>
                                    <button className="sifirdan-ikincil-buton" onClick={() => navigate('/')}>Ana Sayfaya Dön</button>
                                </div>
                            </div>
                        ) : (
                            /* EĞER LİNK YOKSA -> SİZİN TASARIMINIZ OLAN BUTONU GÖSTER */
                            <button
                                onClick={handleLinkOlustur}
                                disabled={loading}
                                style={{
                                    background: loading ? "#95a5a6" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    color: "white",
                                    border: "none",
                                    padding: "18px 50px",
                                    fontSize: "1.2em",
                                    fontWeight: 600,
                                    borderRadius: "50px",
                                    cursor: loading ? "not-allowed" : "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    boxShadow: loading ? "none" : "0 4px 15px rgba(102, 126, 234, 0.4)",
                                    transition: "all 0.3s",
                                    marginRight: "15px",
                                    opacity: loading ? 0.7 : 1
                                }}
                                onMouseOver={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
                                onMouseOut={(e) => !loading && (e.target.style.transform = "translateY(0)")}
                            >
                                {loading ? (
                                    <FaSpinner className="fa-spin" style={{ marginRight: "10px" }} />
                                ) : (
                                    <FaLink style={{ marginRight: "10px" }} />
                                )}
                                {loading ? "Oluşturuluyor..." : "Anketi Yayınla ve Link Al"}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handlePaneleDon}
                        disabled={loading}
                        style={{
                            background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)",
                            color: "white",
                            border: "none",
                            padding: "18px 50px",
                            fontSize: "1.2em",
                            fontWeight: 600,
                            borderRadius: "50px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            boxShadow: "0 4px 15px rgba(46, 204, 113, 0.4)",
                            transition: "all 0.3s"
                        }}
                        onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
                        onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
                    >
                        İptal / Panele Dön
                    </button>

                    {/* Link oluştuysa bu kutuyu göster */}
                    {olusanLink && (
                        <div className="anket-basari-kutusu">
                            <h3>🎉 Anket Hazır!</h3>
                            <p>Anketiniz başarıyla oluşturuldu. Aşağıdaki linki kopyalayabilir veya tıklayabilirsiniz:</p>

                            <div className="link-satiri">
                                <a
                                    href={olusanLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="olusan-link"
                                >
                                    {olusanLink}
                                </a>

                                <button
                                    className="link-kopyala-btn"
                                    onClick={() => {
                                        navigator.clipboard.writeText(olusanLink);
                                        alert("Link kopyalandı!");
                                    }}
                                >
                                    Kopyala
                                </button>
                            </div>
                        </div>
                    )}


                </div>

            </main >

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .fa-spin {
                    animation: spin 1s infinite linear;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div >
    );
}

export default HedefKitleSecimi;