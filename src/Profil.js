import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    FaBars,
    FaUser,
    FaChartBar,
    FaClipboardList,
    FaSignOutAlt,
    FaArrowLeft,
    FaEdit,
    FaSave,
    FaTimes,
    FaUsers,
    FaPoll,
    FaEnvelope,
    FaPhone,
    FaIdCard
} from "react-icons/fa";
import "./Profil.css";

function Profil() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [userData, setUserData] = useState({
        name: "",
        surname: "",
        tcKimlik: "",
        phone: "",
        email: ""
    });
    const [originalData, setOriginalData] = useState({});
    const navigate = useNavigate();


    const handleLogout = () => navigate("/giris");
    const handleGeriDon = () => navigate("/");
    const handleAnketOlustur = () => navigate("/anket-olustur");
    // paketler/analiz/yükselt handlers removed per request

    // Sidebar menü işlevleri
    const handleProfil = () => {
        setMenuOpen(false);
    };

    const handleSonuclariGor = () => {
        console.log("Sonuçları Gör sayfasına yönlendirilecek");
        setMenuOpen(false);
    };

    const [stats, setStats] = useState({
        totalSurveys: 0,
        totalResponses: 0,
        activeSurveys: 0
    });

    useEffect(() => {
        //db den kullanıcı bilgileri çekilecek şuan bi temp
        const mockUserData = {
            name: "Ahmet",
            surname: "Yılmaz",
            tcKimlik: "12345678901",
            phone: "+90 555 123 4567",
            email: "ahmet.yilmaz@example.com"
        };

        const mockStats = {
            totalSurveys: 12,
            totalResponses: 345,
            activeSurveys: 3
        };

        setUserData(mockUserData);
        setOriginalData(mockUserData);
        setStats(mockStats);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = () => {
        // db de güncellenecek
        console.log("Kullanıcı verileri kaydedildi:", userData);
        setOriginalData(userData);
        setEditMode(false);
        alert("Profil bilgileriniz başarıyla güncellendi!");
    };

    const handleCancel = () => {
        setUserData(originalData);
        setEditMode(false);
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
                    <li className="active" onClick={handleProfil}>
                        <FaUser className="icon" /> Profil
                    </li>
                    <li onClick={handleAnketOlustur}>
                        <FaClipboardList className="icon" /> Anket Oluştur
                    </li>
                    <li onClick={handleSonuclariGor}>
                        <FaChartBar className="icon" /> Sonuçları Gör
                    </li>
                    <li onClick={handleLogout}>
                        <FaSignOutAlt className="icon" /> Çıkış Yap
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
                            {editMode ? <FaTimes /> : <FaEdit />}
                            {editMode ? " İptal" : " Düzenle"}
                        </button>
                    </div>

                    <div className="profil-icerik">
                        {/* istatistik kartları */}
                        <div className="profil-istatistikler">
                            <div className="istatistik-kart">
                                <div className="istatistik-ikon yeşil">
                                    <FaPoll />
                                </div>
                                <div className="istatistik-bilgi">
                                    <h3>{stats.totalSurveys}</h3>
                                    <p>Toplam Anket</p>
                                </div>
                            </div>

                            <div className="istatistik-kart">
                                <div className="istatistik-ikon mavi">
                                    <FaUsers />
                                </div>
                                <div className="istatistik-bilgi">
                                    <h3>{stats.totalResponses}</h3>
                                    <p>Toplam Yanıt</p>
                                </div>
                            </div>

                            <div className="istatistik-kart">
                                <div className="istatistik-ikon turuncu">
                                    <FaChartBar />
                                </div>
                                <div className="istatistik-bilgi">
                                    <h3>{stats.activeSurveys}</h3>
                                    <p>Aktif Anket</p>
                                </div>
                            </div>
                        </div>

                        {/* profil bilgileri */}
                        <div className="profil-bilgileri-kart">
                            <h2>📝 Kişisel Bilgiler</h2>

                            <div className="profil-form">
                                <div className="form-satir">
                                    <div className="form-grup">
                                        <label htmlFor="name">
                                            <FaUser className="input-ikon" />
                                            Ad
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={userData.name}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            className={editMode ? "edit-mode" : ""}
                                        />
                                    </div>

                                    <div className="form-grup">
                                        <label htmlFor="surname">
                                            <FaUser className="input-ikon" />
                                            Soyad
                                        </label>
                                        <input
                                            type="text"
                                            id="surname"
                                            name="surname"
                                            value={userData.surname}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            className={editMode ? "edit-mode" : ""}
                                        />
                                    </div>
                                </div>

                                <div className="form-satir">
                                    <div className="form-grup">
                                        <label htmlFor="tcKimlik">
                                            <FaIdCard className="input-ikon" />
                                            TC Kimlik No
                                        </label>
                                        <input
                                            type="text"
                                            id="tcKimlik"
                                            name="tcKimlik"
                                            value={userData.tcKimlik}
                                            onChange={handleInputChange}
                                            disabled={!editMode}
                                            className={editMode ? "edit-mode" : ""}
                                            maxLength="11"
                                        />
                                    </div>
                                </div>

                                <div className="form-satir">
                                    <div className="form-grup">
                                        <label htmlFor="phone">
                                            <FaPhone className="input-ikon" />
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
                                            <FaEnvelope className="input-ikon" />
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
                                        <FaSave style={{ marginRight: "8px" }} />
                                        Değişiklikleri Kaydet
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ek bilgiler */}
                        <div className="profil-ek-bilgiler">
                            <div className="ek-bilgi-kart">
                                <h3>ℹ️ Hesap Bilgileri</h3>
                                <div className="ek-bilgi-listesi">
                                    <div className="ek-bilgi-oge">
                                        <span className="bilgi-etiket">Hesap Türü:</span>
                                        <span className="bilgi-deger">Standart</span>
                                    </div>
                                    <div className="ek-bilgi-oge">
                                        <span className="bilgi-etiket">Üyelik Tarihi:</span>
                                        <span className="bilgi-deger">15 Ocak 2024</span>
                                    </div>
                                    <div className="ek-bilgi-oge">
                                        <span className="bilgi-etiket">Son Giriş:</span>
                                        <span className="bilgi-deger">Bugün, 14:30</span>
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