import React, { useState, useEffect, useRef } from "react";
import {
    FaEnvelope,
    FaIdCard,
    FaMapMarkerAlt,
    FaShieldAlt,
    FaMobileAlt,
    FaCheckCircle,
    FaMapMarkedAlt,
    FaSearch
} from "react-icons/fa";
import "./HedefKitleSecimi.css";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "BURAYA_API_KEY_GIRINIZ";

/**
 * HedefKitleSecimi - Reusable Audience Selection Component
 * 
 * Handles audience criteria selection for surveys including:
 * - Biometric identity verification (face recognition)
 * - TC ID verification
 * - Phone verification
 * - Email domain restrictions
 * - Location-based restrictions (city/district/neighborhood/radius)
 */
function HedefKitleSecimi({
    secilenKriterler,
    setSecilenKriterler,
    mailUzantisi,
    setMailUzantisi,
    kayitliKonumKriteri,
    setKayitliKonumKriteri
}) {
    const [konumModalAcik, setKonumModalAcik] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [googleYeri, setGoogleYeri] = useState(null);
    const [kisitlamaTuru, setKisitlamaTuru] = useState("sehir");
    const [radiusDegeri, setRadiusDegeri] = useState("50");
    const [mapSearchInput, setMapSearchInput] = useState("");
    const autoCompleteRef = useRef(null);

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
                    setGoogleYeri({
                        tamAdres: place.formatted_address,
                        il,
                        ilce,
                        mahalle,
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng()
                    });
                    setMapSearchInput(place.formatted_address);
                }
            });
        }
    }, [scriptLoaded, konumModalAcik]);

    const handleKriterToggle = (kriter) => {
        setSecilenKriterler({ ...secilenKriterler, [kriter]: !secilenKriterler[kriter] });
    };

    const handleKonumKaydet = () => {
        if (!googleYeri) {
            alert("Lütfen önce bir konum seçin.");
            return;
        }
        setKayitliKonumKriteri({
            tip: kisitlamaTuru,
            target: googleYeri,
            radius: radiusDegeri,
            label: googleYeri.tamAdres
        });
        setKonumModalAcik(false);
    };

    return (
        <>
            {/* Google Maps Modal */}
            {konumModalAcik && (
                <div className="hks-modal-overlay">
                    <div className="hks-modal">
                        <div className="hks-modal-header">
                            <div className="hks-modal-title">
                                <FaMapMarkedAlt />
                                <h3>Google Maps ile Konum Seç</h3>
                            </div>
                            <button className="hks-modal-close" onClick={() => setKonumModalAcik(false)}>✕</button>
                        </div>
                        <div className="hks-modal-body">
                            <p className="hks-modal-info">
                                Lütfen anketin uygulanacağı bölgeyi aratın (Örn: "Kadıköy", "Ankara", "Bağdat Caddesi")
                            </p>

                            <div className="hks-search-box">
                                <FaSearch className="hks-search-icon" />
                                <input
                                    ref={autoCompleteRef}
                                    type="text"
                                    placeholder="Konum arayın..."
                                    value={mapSearchInput}
                                    onChange={(e) => setMapSearchInput(e.target.value)}
                                    className="hks-search-input"
                                />
                            </div>

                            {googleYeri && (
                                <div className="hks-location-config">
                                    <div className="hks-found-location">
                                        <strong>Bulunan Yer:</strong> {googleYeri.tamAdres}
                                    </div>

                                    <label className="hks-config-label">🎯 Bu konum için kısıtlama türü:</label>

                                    <div className="hks-restriction-buttons">
                                        <button
                                            className={`hks-restriction-btn ${kisitlamaTuru === "sehir" ? "active" : ""}`}
                                            onClick={() => setKisitlamaTuru("sehir")}
                                        >
                                            Şehir Geneli ({googleYeri.il})
                                        </button>
                                        {googleYeri.ilce && (
                                            <button
                                                className={`hks-restriction-btn ${kisitlamaTuru === "ilce" ? "active" : ""}`}
                                                onClick={() => setKisitlamaTuru("ilce")}
                                            >
                                                İlçe Geneli ({googleYeri.ilce})
                                            </button>
                                        )}
                                        {googleYeri.mahalle && (
                                            <button
                                                className={`hks-restriction-btn ${kisitlamaTuru === "mahalle" ? "active" : ""}`}
                                                onClick={() => setKisitlamaTuru("mahalle")}
                                            >
                                                Mahalle ({googleYeri.mahalle})
                                            </button>
                                        )}
                                        <button
                                            className={`hks-restriction-btn radius ${kisitlamaTuru === "radius" ? "active" : ""}`}
                                            onClick={() => setKisitlamaTuru("radius")}
                                        >
                                            📍 Yarıçap (Mesafe)
                                        </button>
                                    </div>

                                    {kisitlamaTuru === "radius" && (
                                        <div className="hks-radius-config">
                                            <label>Merkezden kaç metre uzağa kadar?</label>
                                            <select value={radiusDegeri} onChange={(e) => setRadiusDegeri(e.target.value)}>
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

                            <button
                                className={`hks-save-btn ${!googleYeri ? "disabled" : ""}`}
                                onClick={handleKonumKaydet}
                                disabled={!googleYeri}
                            >
                                ✓ Konum Kriterini Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Audience Selection Grid */}
            <div className="audience-grid">
                {/* Biyometrik Kimlik */}
                <div className={`audience-card ${secilenKriterler.kimlikDogrulama ? 'expanded' : ''}`} onClick={() => handleKriterToggle("kimlikDogrulama")}>
                    <div className={`check-indicator ${secilenKriterler.kimlikDogrulama ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleKriterToggle("kimlikDogrulama") }}><FaCheckCircle /></div>
                    <FaShieldAlt className="card-icon" />
                    <div className="card-content-wrap">
                        <h3>Biyometrik Kimlik & Yüz Doğrulama</h3>
                        <p>AI destekli yüz tanıma ve canlılık testi ile en yüksek güvenlik seviyesini sağlar.</p>
                    </div>
                </div>

                {/* TC Kimlik */}
                <div className={`audience-card ${secilenKriterler.tcNo ? 'expanded' : ''}`} onClick={() => handleKriterToggle("tcNo")}>
                    <div className={`check-indicator ${secilenKriterler.tcNo ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleKriterToggle("tcNo") }}><FaCheckCircle /></div>
                    <FaIdCard className="card-icon" />
                    <div className="card-content-wrap">
                        <h3>TC Kimlik No Doğrulama</h3>
                        <p>Nüfus ve Vatandaşlık İşleri (NVİ) üzerinden kimlik bilgilerinin doğruluğu kontrol edilir.</p>
                    </div>
                </div>

                {/* Telefon */}
                <div className={`audience-card ${secilenKriterler.telefonNumarasi ? 'expanded' : ''}`} onClick={() => handleKriterToggle("telefonNumarasi")}>
                    <div className={`check-indicator ${secilenKriterler.telefonNumarasi ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleKriterToggle("telefonNumarasi") }}><FaCheckCircle /></div>
                    <FaMobileAlt className="card-icon" />
                    <div className="card-content-wrap">
                        <h3>Telefon Doğrulama</h3>
                        <p>Bot saldırılarını engellemek için katılımcıların telefon numarası SMS ile onaylanır.</p>
                    </div>
                </div>

                {/* E-posta */}
                <div className={`audience-card ${secilenKriterler.mail ? 'expanded' : ''}`} onClick={() => handleKriterToggle("mail")}>
                    <div className={`check-indicator ${secilenKriterler.mail ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleKriterToggle("mail") }}><FaCheckCircle /></div>
                    <FaEnvelope className="card-icon" />
                    <div className="card-content-wrap">
                        <h3>E-posta Kısıtlaması</h3>
                        <p>Anketinizi sadece belirli kurumsal veya özel e-posta uzantılarına sahip kişilerle sınırlayın.</p>
                        {secilenKriterler.mail && (
                            <div className="nested-input" onClick={e => e.stopPropagation()}>
                                <input
                                    type="text"
                                    placeholder="kurum.com"
                                    value={mailUzantisi}
                                    onChange={e => setMailUzantisi(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Konum */}
                <div className={`audience-card ${secilenKriterler.konum ? 'expanded' : ''}`} onClick={() => handleKriterToggle("konum")}>
                    <div className={`check-indicator ${secilenKriterler.konum ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleKriterToggle("konum") }}><FaCheckCircle /></div>
                    <FaMapMarkerAlt className="card-icon" />
                    <div className="card-content-wrap">
                        <h3>Bölge Kısıtlaması</h3>
                        <p>Anketin sadece sizin belirlediğiniz il, ilce veya özel bir radius alanı içinden cevaplanmasını sağlar.</p>
                        {secilenKriterler.konum && (
                            <div className="nested-actions">
                                {kayitliKonumKriteri ? (
                                    <span className="location-badge">{kayitliKonumKriteri.label}</span>
                                ) : (
                                    <span className="no-location">Konum seçilmedi</span>
                                )}
                                <button className="select-map-btn" onClick={(e) => { e.stopPropagation(); setKonumModalAcik(true); }}>Haritada Seç</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default HedefKitleSecimi;