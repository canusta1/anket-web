import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Profil.css"; // Senin mevcut CSS dosyanı kullanır

// İkonlar (Lucide kütüphanesi ile güncellendi)
import {
    Menu,           // FaBars
    User,           // FaUser
    BarChart2,      // FaChartBar
    ClipboardList,  // FaClipboardList
    LogOut,         // FaSignOutAlt
    ArrowLeft,      // FaArrowLeft
    Edit2,          // FaEdit
    Save,           // FaSave
    X,              // FaTimes
    Users,          // FaUsers
    PieChart,       // FaPoll
    Mail,           // FaEnvelope
    Phone,          // FaPhone
    Home,           // FaHome
    CreditCard      // FaIdCard
} from "lucide-react";

// Backend URL (Port 4000)
const BASE_API_URL = "http://localhost:4000/api";

function Profil() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);

    // Kullanıcı bilgileri state'i
    const [userData, setUserData] = useState({
        firstName: "",
        lastName: "",
        tcknMasked: "",
        phone: "",
        email: ""
    });

    const [originalData, setOriginalData] = useState({});

    // İstatistikler state'i (Başlangıçta 0)
    const [stats, setStats] = useState({
        totalSurveys: 0,
        totalResponses: 0,
        activeSurveys: 0
    });

    const navigate = useNavigate();

    // --- TÜM VERİLERİ ÇEKME (Kullanıcı + Anketler) ---
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/giris");
                    return;
                }

                const headers = {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                };

                // 1. Kullanıcı Bilgilerini Çek (/auth/me)
                const userResponse = await fetch(`${BASE_API_URL}/auth/me`, {
                    method: "GET",
                    headers: headers
                });

                if (userResponse.ok) {
                    const userDataRes = await userResponse.json();
                    const userState = {
                        firstName: userDataRes.firstName || "",
                        lastName: userDataRes.lastName || "",
                        tcknMasked: userDataRes.tcknMasked || "",
                        phone: userDataRes.phone || "",
                        email: userDataRes.email || ""
                    };
                    setUserData(userState);
                    setOriginalData(userState);
                } else {
                    if (userResponse.status === 401) {
                        handleLogout();
                        return;
                    }
                }

                // 2. Anketleri Çek ve İstatistik Hesapla (/surveys)
                const surveyResponse = await fetch(`${BASE_API_URL}/surveys`, {
                    method: "GET",
                    headers: headers
                });

                if (surveyResponse.ok) {
                    const surveyResData = await surveyResponse.json();

                    // surveys.js'den dönen yapı: { success: true, data: [...] }
                    if (surveyResData.success && Array.isArray(surveyResData.data)) {
                        const surveys = surveyResData.data;

                        // --- İSTATİSTİK HESAPLAMA MANTIĞI ---
                        const total = surveys.length;
                        const active = surveys.filter(s => s.durum === "aktif").length;
                        // Her anketteki 'toplamCevapSayisi' alanını topla
                        const responses = surveys.reduce((acc, curr) => acc + (curr.toplamCevapSayisi || 0), 0);

                        setStats({
                            totalSurveys: total,
                            activeSurveys: active,
                            totalResponses: responses
                        });
                    }
                } else {
                    console.error("Anket verileri çekilemedi.");
                }

            } catch (error) {
                console.error("Sunucu hatası:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [navigate]);

    // Input değişimi
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // --- PROFİL GÜNCELLEME (PUT) ---
    const handleSave = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(`${BASE_API_URL}/auth/me`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    phone: userData.phone,
                    email: userData.email
                })
            });

            const result = await response.json();

            if (response.ok) {
                setOriginalData({
                    ...userData,
                    ...result.user
                });
                setEditMode(false);
                alert("Profil başarıyla güncellendi!");
            } else {
                alert("Hata: " + (result.error || "Güncelleme başarısız."));
            }

        } catch (error) {
            console.error("Güncelleme hatası:", error);
            alert("Sunucuya bağlanılamadı.");
        }
    };

    const handleCancel = () => {
        setUserData(originalData);
        setEditMode(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/giris");
    };

    const handleGeriDon = () => navigate("/");
    const handleAnketOlustur = () => navigate("/anket-olustur");
    const handleProfil = () => setMenuOpen(false);
    const handleSonuclariGor = () => {
        setMenuOpen(false);
        navigate("/anket-sonuclari");
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Yükleniyor...</div>;

    return (
        <div className="panel-container">
            {/* Navbar */}
            <nav className="panel-navbar">
                <div className="nav-left">
                    <Menu className="menu-icon" onClick={() => setMenuOpen(!menuOpen)} />
                    <ArrowLeft className="menu-icon" onClick={handleGeriDon} style={{ marginRight: "15px" }} />
                    <span className="panel-logo">AnketApp</span>
                </div>

                <div className="nav-right">
                    <Link to="/panel" className="nav-link"><Home /> Ana Sayfa</Link>
                    <button className="btn-white" onClick={handleAnketOlustur}>Anket Oluştur</button>
                </div>
            </nav>

            {/* Sidebar */}
            <div className={`sidebar ${menuOpen ? "open" : ""}`}>
                <ul>
                    <li className="active" onClick={handleProfil}>
                        <User size={20} /> Profil
                    </li>
                    <li onClick={handleAnketOlustur}>
                        <ClipboardList size={20} /> Anket Oluştur
                    </li>
                    <li onClick={handleSonuclariGor}>
                        <BarChart2 size={20} /> Sonuçları Gör
                    </li>
                    <li onClick={handleLogout}>
                        <LogOut size={20} /> Çıkış Yap
                    </li>
                </ul>
            </div>

            {/* İçerik */}
            <main className="profil-main">
                <div className="profil-container">
                    {/* Header */}
                    <div className="profil-header">
                        <div className="profil-baslik">
                            <h1>👤 Profilim</h1>
                            <p>Kişisel bilgilerinizi görüntüleyin ve düzenleyin</p>
                        </div>
                        <button
                            className={`profil-duzenle-butonu ${editMode ? "iptal" : "duzenle"}`}
                            onClick={editMode ? handleCancel : () => setEditMode(true)}
                        >
                            {editMode ? <X size={18} /> : <Edit2 size={18} />}
                            {editMode ? " İptal" : " Düzenle"}
                        </button>
                    </div>

                    <div className="profil-icerik">
                        {/* İstatistik Kartları (Dinamik Veriler) */}
                        <div className="profil-istatistikler">
                            <div className="istatistik-kart">
                                <div className="istatistik-ikon yeşil">
                                    <PieChart />
                                </div>
                                <div className="istatistik-bilgi">
                                    <h3>{stats.totalSurveys}</h3>
                                    <p>Toplam Anket</p>
                                </div>
                            </div>

                            <div className="istatistik-kart">
                                <div className="istatistik-ikon mavi">
                                    <Users />
                                </div>
                                <div className="istatistik-bilgi">
                                    <h3>{stats.totalResponses}</h3>
                                    <p>Toplam Yanıt</p>
                                </div>
                            </div>

                            <div className="istatistik-kart">
                                <div className="istatistik-ikon turuncu">
                                    <BarChart2 />
                                </div>
                                <div className="istatistik-bilgi">
                                    <h3>{stats.activeSurveys}</h3>
                                    <p>Aktif Anket</p>
                                </div>
                            </div>
                        </div>

                        {/* Profil Bilgileri Formu */}
                        <div className="profil-bilgileri-kart">
                            <h2>📝 Kişisel Bilgiler</h2>

                            <div className="profil-form">
                                <div className="form-satir">
                                    <div className="form-grup">
                                        <label htmlFor="firstName">
                                            <User className="input-ikon" size={16} />
                                            Ad
                                        </label>
                                        <input
                                            type="text"
                                            id="firstName"
                                            name="firstName"
                                            value={userData.firstName}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            className={editMode ? "edit-mode" : ""}
                                        />
                                    </div>

                                    <div className="form-grup">
                                        <label htmlFor="lastName">
                                            <User className="input-ikon" size={16} />
                                            Soyad
                                        </label>
                                        <input
                                            type="text"
                                            id="lastName"
                                            name="lastName"
                                            value={userData.lastName}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            className={editMode ? "edit-mode" : ""}
                                        />
                                    </div>
                                </div>

                                <div className="form-satir">
                                    <div className="form-grup">
                                        <label htmlFor="tcknMasked">
                                            <CreditCard className="input-ikon" size={16} />
                                            TC Kimlik No
                                        </label>
                                        <input
                                            type="text"
                                            id="tcknMasked"
                                            name="tcknMasked"
                                            value={userData.tcknMasked}
                                            disabled={true}
                                            style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
                                        />
                                    </div>
                                </div>

                                <div className="form-satir">
                                    <div className="form-grup">
                                        <label htmlFor="phone">
                                            <Phone className="input-ikon" size={16} />
                                            Telefon
                                        </label>
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={userData.phone}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            className={editMode ? "edit-mode" : ""}
                                        />
                                    </div>

                                    <div className="form-grup">
                                        <label htmlFor="email">
                                            <Mail className="input-ikon" size={16} />
                                            E-posta
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={userData.email}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            className={editMode ? "edit-mode" : ""}
                                        />
                                    </div>
                                </div>
                            </div>

                            {editMode && (
                                <div className="profil-aksiyonlar">
                                    <button className="kaydet-butonu" onClick={handleSave}>
                                        <Save size={18} />
                                        Değişiklikleri Kaydet
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Ek Bilgiler */}
                        <div className="profil-ek-bilgiler">
                            <div className="ek-bilgi-kart">
                                <h3>ℹ️ Hesap Bilgileri</h3>
                                <div className="ek-bilgi-listesi">
                                    <div className="ek-bilgi-oge">
                                        <span className="bilgi-etiket">Hesap Türü:</span>
                                        <span className="bilgi-deger">Standart</span>
                                    </div>
                                    <div className="ek-bilgi-oge">
                                        <span className="bilgi-etiket">Giriş Durumu:</span>
                                        <span className="bilgi-deger">Aktif</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Profil;