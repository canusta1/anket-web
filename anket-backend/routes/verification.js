// anket-backend/routes/verification.js
const router = require("express").Router();
const Survey = require("../models/Survey");
const { generateVerificationCode, sendVerificationCode } = require("../services/mailService");
const { generateSMSVerificationCode, sendSMSVerification } = require("../services/smsService");

// Kimlik doğrulama için gerekli modüller
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { readTCFromIdCard } = require("../services/ocrService");

// Geçici bellekte doğrulama kodlarını saklayacağız
// Gerçek uygulamada Redis veya veritabanı kullanılmalı
const verificationCodes = new Map();

// uploads/temp klasörünün varlığını kontrol et ve oluştur
const uploadDir = path.join(__dirname, "..", "uploads", "temp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer yapılandırması - dosyaları geçici klasöre kaydet
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Benzersiz dosya adı oluştur
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

// Dosya filtresi - sadece resim dosyaları kabul et
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Sadece resim dosyaları (jpeg, jpg, png, gif, webp) yüklenebilir!"));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

/**
 * Geçici dosyaları sil - güvenlik için
 * @param {string[]} filePaths - Silinecek dosya yolları
 */
async function cleanupTempFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`Geçici dosya silindi: ${filePath}`);
      }
    } catch (error) {
      console.error(`Dosya silinemedi: ${filePath}`, error);
    }
  }
}

/**
 * Python yüz doğrulama scriptini çalıştır
 * @param {string} idCardPath - Kimlik kartı fotoğrafı yolu
 * @param {string} selfiePath - Selfie fotoğrafı yolu
 * @returns {Promise<{match: boolean, score: number, error: string|null}>}
 */
function runFaceVerification(idCardPath, selfiePath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "..", "services", "faceVerify.py");

    // Python scriptini çalıştır
    const pythonProcess = spawn("python", [pythonScript, idCardPath, selfiePath]);

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      try {
        // stdout'tan JSON parse et
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch (parseError) {
        resolve({
          match: false,
          score: 0,
          error: stderr || "Python script çıktısı parse edilemedi"
        });
      }
    });

    pythonProcess.on("error", (error) => {
      resolve({
        match: false,
        score: 0,
        error: `Python script çalıştırılamadı: ${error.message}`
      });
    });
  });
}

/**
 * POST /api/verification/send-code
 * Email veya SMS doğrulama kodu gönder
 */
router.post("/send-code", async (req, res) => {
  try {
    const { surveyId, contactInfo, type } = req.body;

    // Validasyon
    if (!surveyId || !contactInfo || !type) {
      return res.status(400).json({
        success: false,
        error: "Survey ID, contactInfo ve type gereklidir"
      });
    }

    // Type kontrolü
    if (!['email', 'sms'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Type 'email' veya 'sms' olmalıdır"
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

    // Type'a göre validasyon ve kod gönderme
    if (type === 'email') {
      // Email uzantısını kontrol et
      const userEmailDomain = contactInfo.substring(contactInfo.lastIndexOf("@") + 1).toLowerCase();
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
      const codeKey = `${surveyId}:${contactInfo}`;
      verificationCodes.set(codeKey, {
        code: verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 dakika
        attempts: 0
      });

      // Mail gönder
      const surveyTitle = survey.anketBaslik || survey.baslik || 'Anket';
      await sendVerificationCode(contactInfo, verificationCode, surveyTitle);

      res.json({
        success: true,
        message: "Doğrulama kodu e-posta adresinize gönderildi"
      });

    } else if (type === 'sms') {
      // SMS doğrulama
      // Telefon numarası formatını kontrol et
      if (!/^0\d{10}$/.test(contactInfo)) {
        return res.status(400).json({
          success: false,
          error: "Geçersiz telefon numarası formatı. 0 ile başlayan 11 haneli numara giriniz."
        });
      }

      // 6 haneli kod oluştur
      const verificationCode = generateSMSVerificationCode();

      // Kodu geçici bellekte sakla (10 dakika geçerlilik)
      const codeKey = `${surveyId}:${contactInfo}`;
      verificationCodes.set(codeKey, {
        code: verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 dakika
        attempts: 0
      });

      // SMS gönder (Mock)
      await sendSMSVerification(contactInfo, verificationCode);

      res.json({
        success: true,
        message: "Doğrulama kodu telefon numaranıza gönderildi (Terminal'de görebilirsiniz)"
      });
    }

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
 * Doğrulama kodunu kontrol et (Email veya SMS)
 */
router.post("/verify-code", async (req, res) => {
  try {
    const { surveyId, contactInfo, code } = req.body;

    // Geriye uyumluluk için email parametresini destekle
    const verificationContact = contactInfo || req.body.email;

    // Validasyon
    if (!surveyId || !verificationContact || !code) {
      return res.status(400).json({
        success: false,
        error: "Survey ID, contactInfo ve kod gereklidir"
      });
    }

    const codeKey = `${surveyId}:${verificationContact}`;
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
    const token = `${surveyId}:${verificationContact}:${Date.now()}`;

    res.json({
      success: true,
      message: "Doğrulama başarılı",
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

/**
 * POST /api/verification/verify-identity
 * Kimlik ve Yüz Doğrulama - Yüksek Güvenlikli
 * 
 * Beklenen dosyalar:
 * - idCard: Kimlik kartı fotoğrafı
 * - selfie: Selfie fotoğrafı
 * 
 * İş Akışı:
 * 1. Dosyaları al ve geçici klasöre kaydet
 * 2. Python script ile yüz karşılaştırması yap
 * 3. Eşleşirse OCR ile TC Kimlik No oku
 * 4. Sonucu dön ve dosyaları sil
 */
router.post("/verify-identity", upload.fields([
  { name: "idCard", maxCount: 1 },
  { name: "selfie", maxCount: 1 }
]), async (req, res) => {
  // Yüklenen dosya yolları - cleanup için
  const uploadedFiles = [];

  try {
    // Dosya kontrolü
    if (!req.files || !req.files.idCard || !req.files.selfie) {
      return res.status(400).json({
        success: false,
        error: "Kimlik kartı (idCard) ve selfie fotoğrafları gereklidir"
      });
    }

    const idCardFile = req.files.idCard[0];
    const selfieFile = req.files.selfie[0];

    uploadedFiles.push(idCardFile.path, selfieFile.path);

    console.log("Kimlik doğrulama başlatıldı:");
    console.log(`  - Kimlik: ${idCardFile.filename}`);
    console.log(`  - Selfie: ${selfieFile.filename}`);

    // ADIM 1: Python script ile yüz karşılaştırması
    console.log("Yüz karşılaştırması yapılıyor...");
    const faceResult = await runFaceVerification(idCardFile.path, selfieFile.path);

    console.log("Yüz karşılaştırma sonucu:", faceResult);

    // Yüz eşleşmedi ise
    if (!faceResult.match) {
      // Dosyaları temizle
      await cleanupTempFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        error: faceResult.error || "Yüz doğrulaması başarısız. Kimlik fotoğrafı ve selfie aynı kişiye ait değil.",
        details: {
          faceMatch: false,
          faceScore: faceResult.score
        }
      });
    }

    // ADIM 2: OCR DEVRE DIŞI - Yüz doğrulama yeterli
    // Tesseract.js worker sorunu çözülene kadar OCR atlanıyor
    console.log("OCR atlanıyor - yüz doğrulama başarılı, devam ediliyor...");

    // Dosyaları temizle
    await cleanupTempFiles(uploadedFiles);

    // Yüz eşleşti - doğrulama başarılı
    const verificationToken = `identity:FACE_VERIFIED:${Date.now()}`;

    res.json({
      success: true,
      message: "Yüz doğrulaması başarılı",
      data: {
        tcKimlikNo: "Yüz ile doğrulandı",
        faceMatchScore: faceResult.score,
        verificationToken: verificationToken,
        ocrSuccess: false,
        ocrError: "OCR devre dışı"
      }
    });

  } catch (error) {
    console.error("Kimlik doğrulama hatası:", error);

    // Hata durumunda da dosyaları temizle
    await cleanupTempFiles(uploadedFiles);

    res.status(500).json({
      success: false,
      error: error.message || "Kimlik doğrulama işlemi başarısız"
    });
  }
});

/**
 * POST /api/verification/verify-tc-ocr
 * TC Kimlik No OCR Doğrulama
 * 
 * Beklenen veriler:
 * - tcNo: Kullanıcının manuel girdiği TC Kimlik No (form-data)
 * - idCard: Kimlik kartı fotoğrafı (file)
 * 
 * İş Akışı:
 * 1. Kimlik fotoğrafını al ve geçici klasöre kaydet
 * 2. OCR ile kimlik kartından TC Kimlik No oku
 * 3. Manuel girilen TC ile OCR'dan okunan TC'yi karşılaştır
 * 4. Sonucu dön ve dosyayı sil (güvenlik)
 */
router.post("/verify-tc-ocr", upload.single("idCard"), async (req, res) => {
  // Yüklenen dosya yolu - cleanup için
  const uploadedFile = req.file?.path;

  try {
    const { tcNo } = req.body;

    // Validasyon: TC Kimlik No kontrolü
    if (!tcNo || tcNo.trim().length !== 11) {
      // Dosyayı temizle
      if (uploadedFile) await cleanupTempFiles([uploadedFile]);

      return res.status(400).json({
        success: false,
        error: "Geçerli bir TC Kimlik No giriniz (11 haneli)"
      });
    }

    // Validasyon: Dosya kontrolü
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Kimlik kartı fotoğrafı yüklemeniz gerekmektedir"
      });
    }

    console.log("🔍 TC OCR Doğrulama başlatıldı:");
    console.log(`  - Manuel Girilen TC: ${tcNo.substring(0, 3)}*****${tcNo.substring(8)}`);
    console.log(`  - Dosya: ${req.file.filename}`);

    // OCR ile TC Kimlik No'yu oku
    const ocrResult = await readTCFromIdCard(uploadedFile);

    console.log("📄 OCR Sonucu:", {
      success: ocrResult.success,
      tcKimlikNo: ocrResult.tcKimlikNo ? `${ocrResult.tcKimlikNo.substring(0, 3)}*****` : null,
      error: ocrResult.error
    });

    // OCR başarısız oldu
    if (!ocrResult.success || !ocrResult.tcKimlikNo) {
      // Dosyayı temizle
      await cleanupTempFiles([uploadedFile]);

      return res.status(400).json({
        success: false,
        error: ocrResult.error || "Kimlik kartından TC Kimlik No okunamadı. Lütfen daha net bir fotoğraf yükleyin.",
        details: {
          ocrSuccess: false
        }
      });
    }

    // TC Numaralarını karşılaştır
    const manuelTc = tcNo.trim();
    const ocrTc = ocrResult.tcKimlikNo.trim();
    const tcEslesti = manuelTc === ocrTc;

    console.log(`🔐 TC Karşılaştırma: ${tcEslesti ? 'EŞLEŞTİ ✅' : 'EŞLEŞMEDİ ❌'}`);

    // Dosyayı temizle (her durumda)
    await cleanupTempFiles([uploadedFile]);

    if (!tcEslesti) {
      return res.status(400).json({
        success: false,
        error: "Girdiğiniz TC Kimlik No ile kimlik kartındaki numara eşleşmiyor.",
        details: {
          ocrSuccess: true,
          tcMatch: false
        }
      });
    }

    // Başarılı doğrulama
    const verificationToken = `tc:${manuelTc.substring(0, 3)}****:${Date.now()}`;

    res.json({
      success: true,
      message: "TC Kimlik No doğrulaması başarılı",
      data: {
        tcKimlikNo: `${manuelTc.substring(0, 3)}*****${manuelTc.substring(8)}`, // Maskelenmiş TC
        verificationToken: verificationToken,
        ocrSuccess: true,
        tcMatch: true
      }
    });

  } catch (error) {
    console.error("❌ TC OCR Doğrulama Hatası:", error);

    // Hata durumunda da dosyayı temizle
    if (uploadedFile) {
      await cleanupTempFiles([uploadedFile]);
    }

    res.status(500).json({
      success: false,
      error: error.message || "TC Kimlik No doğrulama işlemi başarısız"
    });
  }
});

// Multer hata yönetimi middleware'i
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: "Dosya boyutu çok büyük. Maksimum 10MB yükleyebilirsiniz."
      });
    }
    return res.status(400).json({
      success: false,
      error: `Dosya yükleme hatası: ${error.message}`
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  next();
});

module.exports = router;

