const express = require('express');
const router = express.Router();
const { generateSurveyQuestions, analyzeSurveyResponses } = require('./aiService');

// ai ile anket olustur
router.post('/generate-survey', async (req, res) => {
    try {
        const { topic, questionCount } = req.body;

        if (!topic || !topic.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Anket konusu boş olamaz'
            });
        }

        if (!questionCount || questionCount < 1 || questionCount > 50) {
            return res.status(400).json({
                success: false,
                error: 'Soru sayısı 1-50 arasında olmalıdır'
            });
        }

        console.log(`AI anket oluşturuluyor: ${topic} (${questionCount} soru)`);

        const result = await generateSurveyQuestions(topic, questionCount);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('AI Anket Oluşturma Hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Anket oluşturulurken bir hata oluştu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// anket cevaplarini analiz et
router.post('/analyze-survey', async (req, res) => {
    try {
        const { anketData, cevaplar } = req.body;

        if (!anketData || !cevaplar) {
            return res.status(400).json({
                success: false,
                error: 'Anket verisi ve cevaplar gerekli'
            });
        }

        if (!Array.isArray(cevaplar) || cevaplar.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'En az bir cevap olmalı'
            });
        }

        console.log(`Anket analiz ediliyor: ${cevaplar.length} cevap`);

        const analiz = await analyzeSurveyResponses(anketData, cevaplar);

        res.json({
            success: true,
            data: analiz
        });

    } catch (error) {
        console.error('Analiz Hatası:', error);
        res.status(500).json({
            success: false,
            error: 'Analiz yapılırken bir hata oluştu',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ai servis durumu
router.get('/health', (req, res) => {
    const hasApiKey = !!process.env.GROQ_API_KEY;

    res.json({
        success: true,
        status: hasApiKey ? 'ready' : 'no-api-key',
        message: hasApiKey
            ? 'AI servisi hazır'
            : 'GROQ_API_KEY environment variable tanımlanmamış'
    });
});

module.exports = router;