// anket-backend/routes/verification.js
const router = require("express").Router();
const Survey = require("../models/Survey");
const { generateVerificationCode, sendVerificationCode } = require("../services/mailService");

// Geçici bellekte doğrulama kodlarını saklayacağız
// Gerçek uygulamada Redis veya veritabanı kullanılmalı
const verificationCodes = new Map();

/**
 * POST /api/verification/send-code
 * Email uzantısı kontrol et ve doğrulama kodu gönder
 */
router.post("/send-code", async (req, res) => {
  try {
    const { surveyId, email } = req.body;

    // Validasyon
    if (!surveyId || !email) {
      return res.status(400).json({
        success: false,
        error: "Survey ID ve email gereklidir"
      });
    }

    // Anketi bul
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({
        success: false,
        error: "Anket bulunamadı"
      });
    }

    // Email uzantısını kontrol et
    const userEmailDomain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();
    let allowedDomains = survey.hedefKitleKriterleri?.mailUzantisi || [];
    
    // mailUzantisi string ise array'e çevir ve @ işaretini kaldır
    if (typeof allowedDomains === 'string' && allowedDomains.length > 0) {
      allowedDomains = allowedDomains
        .split(',')
        .map(d => d.trim().replace(/^@/, '').toLowerCase());
    } else if (Array.isArray(allowedDomains)) {
      allowedDomains = allowedDomains
        .map(d => (typeof d === 'string' ? d.replace(/^@/, '').toLowerCase() : ''));
    } else {
      allowedDomains = [];
    }

    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => 
        userEmailDomain === domain.toLowerCase()
      );

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          error: `Bu ankete sadece ${allowedDomains.map(d => '@' + d).join(", ")} e-posta adreslerinden katılabilirsiniz.`
        });
      }
    }

    // 6 haneli kod oluştur
    const verificationCode = generateVerificationCode();
    
    // Kodu geçici bellekte sakla (10 dakika geçerlilik)
    const codeKey = `${surveyId}:${email}`;
    verificationCodes.set(codeKey, {
      code: verificationCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 dakika
      attempts: 0
    });

    // Mail gönder
    const surveyTitle = survey.anketBaslik || survey.baslik || 'Anket';
    await sendVerificationCode(email, verificationCode, surveyTitle);

    res.json({
      success: true,
      message: "Doğrulama kodu mailine gönderildi"
    });
  } catch (error) {
    console.error("Doğrulama kodu gönderme hatası:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Doğrulama kodu gönderilemedi"
    });
  }
});

/**
 * POST /api/verification/verify-code
 * Doğrulama kodunu kontrol et
 */
router.post("/verify-code", async (req, res) => {
  try {
    const { surveyId, email, code } = req.body;

    // Validasyon
    if (!surveyId || !email || !code) {
      return res.status(400).json({
        success: false,
        error: "Survey ID, email ve kod gereklidir"
      });
    }

    const codeKey = `${surveyId}:${email}`;
    const storedData = verificationCodes.get(codeKey);

    // Kod yoksa veya süresi geçmişse
    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: "Doğrulama kodunun süresi geçmiş. Yeni bir kod talep edin."
      });
    }

    // Süresi kontrol et
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(codeKey);
      return res.status(400).json({
        success: false,
        error: "Doğrulama kodunun süresi geçmiş. Yeni bir kod talep edin."
      });
    }

    // Deneme sayısını kontrol et (max 5 deneme)
    if (storedData.attempts >= 5) {
      verificationCodes.delete(codeKey);
      return res.status(429).json({
        success: false,
        error: "Çok fazla yanlış deneme. Yeni bir kod talep edin."
      });
    }

    // Kodu kontrol et
    if (code !== storedData.code) {
      storedData.attempts++;
      return res.status(400).json({
        success: false,
        error: "Hatalı doğrulama kodu",
        remainingAttempts: 5 - storedData.attempts
      });
    }

    // Başarılı doğrulama
    verificationCodes.delete(codeKey);

    // Token oluştur (anket çözme için)
    const token = `${surveyId}:${email}:${Date.now()}`;

    res.json({
      success: true,
      message: "E-posta doğrulandı",
      verificationToken: token
    });
  } catch (error) {
    console.error("Kod doğrulama hatası:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Kod doğrulanamadı"
    });
  }
});

module.exports = router;
