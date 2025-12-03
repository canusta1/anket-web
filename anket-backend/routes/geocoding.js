// routes/geocoding.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// POST /api/geocode - Reverse Geocoding
router.post('/geocode', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        // Parametreleri doğrula
        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Latitude ve longitude parametreleri zorunludur'
            });
        }

        // Google API Key'i çevre değişkeninden al
        const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!googleApiKey) {
            console.error('GOOGLE_MAPS_API_KEY tanımlanmamış');
            return res.status(500).json({
                error: 'Sunucu yapılandırması hatası'
            });
        }

        // Google Geocoding API URL'sini oluştur
        const latlngParam = `${parseFloat(latitude).toFixed(8)},${parseFloat(longitude).toFixed(8)}`;
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlngParam}&key=${googleApiKey}&language=tr`;

        console.log('[Geocoding] Konum sorgusu:', { latitude, longitude });

        // Google API'ye istek at
        const response = await axios.get(geocodeUrl, {
            timeout: 10000 // 10 saniye timeout
        });

        const data = response.data;

        console.log('[Geocoding] API Yanıtı Status:', data.status);

        // Google API yanıtını kontrol et
        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const adres = data.results[0].formatted_address;
            const components = data.results[0].address_components;

            console.log('[Geocoding] Tüm address_components:');
            components.forEach(c => {
                console.log(`  - ${c.long_name} (${c.short_name}): ${c.types.join(', ')}`);
            });

            // Ek bilgileri çıkar
            let sehir = '';
            let ilce = '';
            let mahalle = '';
            let sokak = '';
            let postaKodu = '';

            components.forEach(component => {
                // Sokak adresi
                if (component.types.includes('route')) {
                    sokak = component.long_name;
                }
                // Mahalle (neighborhood)
                if (component.types.includes('neighborhood')) {
                    mahalle = component.long_name;
                }
                // Administrative_area_level_4 - Türkiye'de bu mahalle olabilir
                if (component.types.includes('administrative_area_level_4') && !mahalle) {
                    mahalle = component.long_name;
                }
                // İlçe - level_2 veya level_3
                if (component.types.includes('administrative_area_level_3')) {
                    ilce = component.long_name;
                }
                if (component.types.includes('administrative_area_level_2') && !ilce) {
                    ilce = component.long_name;
                }
                // İl/Şehir - level_1
                if (component.types.includes('administrative_area_level_1')) {
                    sehir = component.long_name;
                }
                // Fallback: locality = şehir veya ilçe
                if (component.types.includes('locality')) {
                    if (!sehir && !ilce) {
                        sehir = component.long_name;
                    } else if (!ilce) {
                        ilce = component.long_name;
                    }
                }
                // Posta kodu
                if (component.types.includes('postal_code')) {
                    postaKodu = component.long_name;
                }
            });

            const sonuc = {
                success: true,
                adres: adres,
                sehir: sehir,
                ilce: ilce,
                mahalle: mahalle,
                sokak: sokak,
                postaKodu: postaKodu,
                latitude: latitude,
                longitude: longitude
            };

            console.log('[Geocoding] Başarılı:', sonuc);
            return res.json(sonuc);
        } else if (data.status === 'ZERO_RESULTS') {
            return res.status(404).json({
                error: 'Bu konum için adres bulunamadı',
                status: data.status
            });
        } else if (data.status === 'REQUEST_DENIED') {
            console.error('[Geocoding] REQUEST_DENIED - API Key problemi');
            return res.status(403).json({
                error: 'API anahtarı geçersiz veya erişim reddedildi',
                status: data.status,
                errorMessage: data.error_message
            });
        } else if (data.status === 'INVALID_REQUEST') {
            return res.status(400).json({
                error: 'Geçersiz istek parametreleri',
                status: data.status,
                errorMessage: data.error_message
            });
        } else {
            return res.status(500).json({
                error: `API Hatası: ${data.status}`,
                status: data.status,
                errorMessage: data.error_message
            });
        }
    } catch (error) {
        console.error('[Geocoding] Hata:', error.message);

        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                error: 'Konum sorgusu zaman aşımına uğradı'
            });
        }

        return res.status(500).json({
            error: 'Konum sorgulama hatası: ' + error.message
        });
    }
});

module.exports = router;