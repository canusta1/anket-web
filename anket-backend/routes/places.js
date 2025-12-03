const express = require('express');
const router = express.Router();
const axios = require('axios');

// GET /api/places/autocomplete
// Kullanıcı harf girdikçe önerileri getirir
router.get('/autocomplete', async (req, res) => {
    try {
        const { input } = req.query;

        if (!input) {
            return res.status(400).json({ error: 'Input parametresi zorunludur' });
        }

        const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!googleApiKey) {
            return res.status(500).json({ error: 'API Key yapılandırılmamış' });
        }

        // Google Places Autocomplete API
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`;

        const response = await axios.get(url, {
            params: {
                input: input,
                key: googleApiKey,
                language: 'tr',
                components: 'country:tr', // Sadece Türkiye içi sonuçlar
                types: 'geocode' // Sadece coğrafi yerler (işletmeleri filtrele)
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error('[Places Autocomplete] Hata:', error.message);
        res.status(500).json({ error: 'Google API hatası' });
    }
});

// GET /api/places/details
// Seçilen önerinin (place_id) detaylarını (koordinat, il, ilçe vb.) getirir
router.get('/details', async (req, res) => {
    try {
        const { placeId } = req.query;

        if (!placeId) {
            return res.status(400).json({ error: 'PlaceId parametresi zorunludur' });
        }

        const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

        // Google Places Details API
        const url = `https://maps.googleapis.com/maps/api/place/details/json`;

        const response = await axios.get(url, {
            params: {
                place_id: placeId,
                key: googleApiKey,
                language: 'tr',
                // Sadece ihtiyacımız olan alanları istiyoruz (Maliyet tasarrufu için önemli)
                fields: 'address_components,geometry,formatted_address'
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error('[Places Details] Hata:', error.message);
        res.status(500).json({ error: 'Google API hatası' });
    }
});

module.exports = router;