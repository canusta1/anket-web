import React, { useState } from 'react';
import './KonumuDogrula.css';

const KonumuDogrula = ({ onKonumDogrulandi }) => {
    const [konumAcik, setKonumAcik] = useState(false);
    const [konumYukleniyor, setKonumYukleniyor] = useState(false);
    const [konumAdres, setKonumAdres] = useState('');

    // Adres bileşenleri
    const [adresBilgisi, setAdresBilgisi] = useState({
        mahalle: '',
        sokak: '',
        ilce: '',
        sehir: '',
        tam: '',
        latitude: null,
        longitude: null
    });

    const handleKonumBul = async () => {
        setKonumYukleniyor(true);

        try {
            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;

                        console.log('Konum bilgileri:', { latitude, longitude });

                        try {
                            // Backend üzerinden Google Geocoding API çağrısı
                            const apiUrl = process.env.REACT_APP_API_URL || 'http://192.168.1.28:4000';
                            const geocodeUrl = `${apiUrl}/api/geocode`;

                            console.log('Backend API çağrısı:', geocodeUrl);

                            const response = await fetch(geocodeUrl, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ latitude, longitude })
                            });

                            const data = await response.json();

                            console.log('Backend Yanıtı:', data);

                            if (data.success) {
                                // Adres bileşenlerini parse et
                                const adres = parseAdres(data);
                                // Latitude ve longitude'u ekle
                                setAdresBilgisi({
                                    ...adres,
                                    latitude: latitude,
                                    longitude: longitude
                                });
                                setKonumAdres(data.adres);
                                setKonumYukleniyor(false);

                                alert('✓ Konumunuz başarıyla doğrulandı!');
                            } else {
                                throw new Error(data.error || 'Konum bulunamadı');
                            }
                        } catch (apiErr) {
                            console.error('API Hatası:', apiErr);
                            throw apiErr;
                        }
                    },
                    (err) => {
                        console.error('Geolocation error:', err);
                        setKonumYukleniyor(false);

                        let errorMessage = 'Konumunuza erişilemiyor.';

                        switch (err.code) {
                            case err.PERMISSION_DENIED:
                                errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından izin veriniz.';
                                break;
                            case err.POSITION_UNAVAILABLE:
                                errorMessage = 'Konum bilgisi kullanılamıyor.';
                                break;
                            case err.TIMEOUT:
                                errorMessage = 'Konum bulma işlemi zaman aşımına uğradı. Tekrar deneyin.';
                                break;
                            default:
                                errorMessage = 'Konum alma hatası oluştu.';
                        }

                        alert('Hata: ' + errorMessage);
                    }
                );
            } else {
                alert('Tarayıcınız konum hizmetini desteklemiyor.');
                setKonumYukleniyor(false);
            }
        } catch (err) {
            console.error('Konum doğrulama hatası:', err);
            alert('Hata: ' + err.message);
            setKonumYukleniyor(false);
        }
    };

    // Adres stringini bileşenlere ayır
    const parseAdres = (data) => {
        console.log('ParseAdres girdisi:', data);
        const result = {
            mahalle: data.mahalle || data.neighborhood || '',
            sokak: data.sokak || data.street || '',
            ilce: data.ilce || data.district || '',
            sehir: data.sehir || data.city || '',
            tam: data.adres || data.address || ''
        };
        console.log('ParseAdres çıktısı:', result);
        return result;
    };

    // Adres bileşenini düzenle
    const handleAdresDegis = (field, value) => {
        setAdresBilgisi(prev => {
            const updated = { ...prev, [field]: value };
            // Tam adresi güncelle
            const tamAdres = [
                updated.sokak,
                updated.mahalle,
                updated.ilce,
                updated.sehir
            ].filter(Boolean).join(', ');

            return { ...updated, tam: tamAdres };
        });
    };

    const handleIptal = () => {
        setKonumAcik(false);
        setKonumYukleniyor(false);
    };

    const handleOnayla = () => {
        if (!adresBilgisi.sehir) {
            alert('Lütfen en az şehri doldurunuz');
            return;
        }

        console.log('handleOnayla çağrıldı, gönderilen veri:', {
            tamAdres: adresBilgisi.tam,
            adres: adresBilgisi,
            mahalle: adresBilgisi.mahalle,
            ilce: adresBilgisi.ilce,
            sehir: adresBilgisi.sehir,
            sokak: adresBilgisi.sokak,
            konumLat: adresBilgisi.latitude,
            konumLng: adresBilgisi.longitude
        });

        onKonumDogrulandi({
            tamAdres: adresBilgisi.tam,
            adres: adresBilgisi,
            mahalle: adresBilgisi.mahalle,
            ilce: adresBilgisi.ilce,
            sehir: adresBilgisi.sehir,
            sokak: adresBilgisi.sokak,
            konumLat: adresBilgisi.latitude,
            konumLng: adresBilgisi.longitude
        });

        setKonumAcik(false);
    };

    return (
        <div className="konum-dogrula-wrapper">
            <label className="form-label">Konum *</label>

            <div className="konum-input-wrapper">
                <input
                    type="text"
                    className={`form-input konum-input ${konumAdres ? 'success' : ''}`}
                    value={konumAdres}
                    disabled
                    placeholder="Konumunuzu doğrulamak için butona tıklayınız"
                />
                <button
                    type="button"
                    className={`btn-konum ${konumAcik ? 'active' : ''}`}
                    onClick={() => setKonumAcik(!konumAcik)}
                    disabled={konumYukleniyor}
                    title={konumAdres ? 'Konum doğrulandı' : 'Konum doğrulamak için tıklayınız'}
                >
                    <span className="konum-icon">📍</span>
                    {konumAcik ? 'İptal' : konumAdres ? 'Doğrulandı' : 'Konumu Doğrula'}
                </button>
            </div>

            {konumAcik && (
                <div className="konum-modal-overlay">
                    <div className="konum-modal">
                        <div className="konum-modal-header">
                            <h4>Konumunuzu Doğrulayın</h4>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleIptal}
                                aria-label="Kapat"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="konum-modal-content">
                            {!konumAdres ? (
                                <>
                                    <p className="konum-description">
                                        Aşağıdaki butona tıklayarak konumunuzu bulmamıza izin veriniz.
                                    </p>

                                    <button
                                        type="button"
                                        className="btn-primary btn-konum-bul"
                                        onClick={handleKonumBul}
                                        disabled={konumYukleniyor}
                                    >
                                        {konumYukleniyor ? (
                                            <>
                                                <span className="spinner-small"></span>
                                                Konum Bulunuyor...
                                            </>
                                        ) : (
                                            <>
                                                📍 Konumu Bul
                                            </>
                                        )}
                                    </button>

                                    <div className="konum-info-box">
                                        <p className="konum-info-title">ℹ️ Önemli Bilgi</p>
                                        <ul className="konum-info-list">
                                            <li>Konumunuzu paylaşmak için tarayıcınızda konum izni vermeniz gerekmektedir.</li>
                                            <li>GPS veya ağ konumu kullanılarak bulunacaktır.</li>
                                            <li>Konum bilgisi tamamen gizli olacak ve yalnızca anket amacıyla kullanılacaktır.</li>
                                        </ul>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="konum-success-info">
                                        <p className="konum-success-text">✓ Konum bulundu. Aşağıda düzenleyebilirsiniz:</p>
                                    </div>

                                    <div className="adres-bilesenleri">
                                        <div className="adres-grup">
                                            <label className="adres-label">Sokak</label>
                                            <input
                                                type="text"
                                                className="adres-input"
                                                value={adresBilgisi.sokak}
                                                onChange={(e) => handleAdresDegis('sokak', e.target.value)}
                                                placeholder="Sokak adı"
                                            />
                                        </div>

                                        <div className="adres-grup">
                                            <label className="adres-label">Mahalle</label>
                                            <input
                                                type="text"
                                                className="adres-input"
                                                value={adresBilgisi.mahalle}
                                                onChange={(e) => handleAdresDegis('mahalle', e.target.value)}
                                                placeholder="Mahalle adı"
                                            />
                                        </div>

                                        <div className="adres-grup">
                                            <label className="adres-label">İlçe</label>
                                            <input
                                                type="text"
                                                className="adres-input"
                                                value={adresBilgisi.ilce}
                                                onChange={(e) => handleAdresDegis('ilce', e.target.value)}
                                                placeholder="İlçe adı"
                                            />
                                        </div>

                                        <div className="adres-grup">
                                            <label className="adres-label">Şehir *</label>
                                            <input
                                                type="text"
                                                className="adres-input"
                                                value={adresBilgisi.sehir}
                                                onChange={(e) => handleAdresDegis('sehir', e.target.value)}
                                                placeholder="Şehir adı"
                                            />
                                        </div>

                                        <div className="adres-tam">
                                            <p className="adres-tam-label">Tam Adres Önizlemesi:</p>
                                            <p className="adres-tam-text">
                                                {adresBilgisi.tam || 'Boş'}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="konum-modal-footer">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={handleIptal}
                            >
                                {konumAdres ? 'İptal' : 'Kapat'}
                            </button>
                            {konumAdres && (
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleOnayla}
                                >
                                    ✓ Onayla
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KonumuDogrula;