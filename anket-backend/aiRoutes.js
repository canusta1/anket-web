// backend/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { generateSurveyQuestions, analyzeSurveyResponses } = require('./aiService');

/**
 * POST /api/ai/generate-survey
 * AI ile anket soruları oluşturur
 * Body: { topic: string, questionCount: number }
 */
router.post('/generate-survey', async (req, res) => {
    try {
        const { topic, questionCount } = req.body;

        // Validasyon
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

        // AI servisini çağır
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

/**
 * POST /api/ai/analyze-survey
 * Anket cevaplarını analiz eder
 * Body: { anketId: string } (veya direkt anket ve cevap verileri)
 */
router.post('/analyze-survey', async (req, res) => {
    try {
        const { anketData, cevaplar } = req.body;

        // Validasyon
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

        // AI servisini çağır
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

/**
 * GET /api/ai/health
 * AI servisinin durumunu kontrol eder
 */
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