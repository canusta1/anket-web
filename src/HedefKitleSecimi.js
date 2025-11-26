import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    FaMobileAlt
} from "react-icons/fa";

function HedefKitleSecimi() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [secilenKriterler, setSecilenKriterler] = useState({
        mail: false,
        tcNo: false,
        konum: false,
        kimlikDogrulama: false
    });

    const [mailUzantisi, setMailUzantisi] = useState("");
    const [anketLinki, setAnketLinki] = useState("");
    
    const navigate = useNavigate();

    const handleLogout = () => navigate("/giris");
    const handleGeriDon = () => navigate(-1);
    const handleAnketOlustur = () => navigate("/anket-olustur");

    const handleKriterToggle = (kriter) => {
        setSecilenKriterler({
            ...secilenKriterler,
            [kriter]: !secilenKriterler[kriter]
        });
        
        // Mail seçimi kaldırıldığında uzantıyı temizle
        if (kriter === "mail" && secilenKriterler.mail) {
            setMailUzantisi("");
        }
    };

    const handleLinkOlustur = () => {
        const secilenler = Object.entries(secilenKriterler)
            .filter(([_, deger]) => deger)
            .map(([kriter, _]) => kriter);

        // Mail seçiliyse uzantı kontrolü
        if (secilenKriterler.mail && !mailUzantisi.trim()) {
            alert("⚠️ Mail kriteri seçtiniz! Lütfen geçerli bir mail uzantısı girin (örn: @gmail.com veya @sirket.com)");
            return;
        }

        const benzersizKod = Math.random().toString(36).substring(2, 10).toUpperCase();
        const yeniLink = `https://anketapp.com/s/${benzersizKod}`;
        setAnketLinki(yeniLink);

        // Seçilen kriterleri göster
        const kriterIsimler = {
            mail: mailUzantisi ? `E-Mail (${mailUzantisi})` : "E-Mail",
            tcNo: "TC Kimlik No",
            konum: "Konum",
            kimlikDogrulama: "Kimlik Doğrulama"
        };
        const secilenIsimler = secilenler.map(k => kriterIsimler[k]).join(", ");
        
        alert(`✨ Anket linki oluşturuldu!\n\n📱 Zorunlu: Cep Telefonu\n\nKatılımcılardan istenecek ek bilgiler:\n${secilenIsimler || "Yok"}`);
    };

    const handleLinkKopyala = () => {
        navigator.clipboard.writeText(anketLinki);
        alert("📋 Link kopyalandı!");
    };

    return (
        <div className="panel-container" style={{ minHeight: "100vh", background: "#f5f6fa" }}>
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

                    {/* ZORUNLU KRİTER - CEP TELEFONU */}
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

                    {/* EK KRİTERLER */}
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
                                            onChange={() => {}}
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
                                        onChange={() => {}}
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
                                        onChange={() => {}}
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
                                        onChange={() => {}}
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

                    {/* Link Oluştur Butonu */}
                    <div style={{ textAlign: "center", margin: "40px 0" }}>
                        <button 
                            onClick={handleLinkOlustur} 
                            style={{ 
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
                                color: "white", 
                                border: "none", 
                                padding: "18px 50px", 
                                fontSize: "1.2em", 
                                fontWeight: 600, 
                                borderRadius: "50px", 
                                cursor: "pointer", 
                                display: "inline-flex", 
                                alignItems: "center", 
                                boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
                                transition: "all 0.3s"
                            }}
                            onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
                            onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
                        >
                            <FaLink style={{ marginRight: "10px" }} />
                            Anket Linki Oluştur
                        </button>
                    </div>

                    {/* Oluşturulan Link */}
                    {anketLinki && (
                        <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "16px", padding: "30px", color: "white", boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)", animation: "fadeIn 0.5s" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                                <FaCheckCircle style={{ fontSize: "2em", color: "#2ecc71" }} />
                                <h3 style={{ margin: 0, fontSize: "1.5em" }}>Anket Linkiniz Hazır!</h3>
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
                                <input
                                    type="text"
                                    value={anketLinki}
                                    readOnly
                                    style={{ 
                                        flex: 1, 
                                        minWidth: "200px",
                                        padding: "15px", 
                                        border: "none", 
                                        borderRadius: "10px", 
                                        fontSize: "1em", 
                                        background: "rgba(255,255,255,0.95)", 
                                        color: "#2c3e50", 
                                        fontWeight: 500 
                                    }}
                                />
                                <button 
                                    onClick={handleLinkKopyala} 
                                    style={{ 
                                        background: "#2ecc71", 
                                        color: "white", 
                                        border: "none", 
                                        padding: "15px 30px", 
                                        borderRadius: "10px", 
                                        fontWeight: 600, 
                                        cursor: "pointer", 
                                        whiteSpace: "nowrap",
                                        transition: "all 0.3s"
                                    }}
                                    onMouseOver={(e) => e.target.style.background = "#27ae60"}
                                    onMouseOut={(e) => e.target.style.background = "#2ecc71"}
                                >
                                    Kopyala
                                </button>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: "10px", padding: "15px", marginBottom: "15px" }}>
                                <p style={{ margin: "0 0 10px 0", fontWeight: 600, fontSize: "1.05em" }}>📋 Katılımcılardan İstenecek Bilgiler:</p>
                                <div style={{ paddingLeft: "10px" }}>
                                    <p style={{ margin: "5px 0", opacity: 0.95 }}>✓ Cep Telefonu (Zorunlu)</p>
                                    {secilenKriterler.mail && <p style={{ margin: "5px 0", opacity: 0.95 }}>✓ E-Mail Adresi {mailUzantisi && `(${mailUzantisi})`}</p>}
                                    {secilenKriterler.tcNo && <p style={{ margin: "5px 0", opacity: 0.95 }}>✓ TC Kimlik No</p>}
                                    {secilenKriterler.konum && <p style={{ margin: "5px 0", opacity: 0.95 }}>✓ Konum Bilgisi</p>}
                                    {secilenKriterler.kimlikDogrulama && <p style={{ margin: "5px 0", opacity: 0.95 }}>✓ Kimlik Belgesi</p>}
                                </div>
                            </div>
                            <p style={{ margin: 0, opacity: 0.9, fontSize: "0.95em", lineHeight: 1.5 }}>
                                Bu linki hedef kitlenizle paylaşın. Katılımcılar anketi doldururken seçtiğiniz kriterleri doldurmak zorunda kalacaklar.
                            </p>
                        </div>
                    )}
                </div>
            </main>

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
            `}</style>
        </div>
    );
}

export default HedefKitleSecimi;