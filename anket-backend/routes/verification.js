
const router = require("express").Router();
const Survey = require("../models/Survey");
const SurveyResponse = require("../models/SurveyResponse");
const { generateVerificationCode, sendVerificationCode } = require("../services/mailService");
const { generateSMSVerificationCode, sendSMSVerification } = require("../services/smsService");
const { decryptSensitiveFields } = require("../services/encryptionService");


const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { readTCFromIdCard } = require("../services/ocrService");

// gecici dogrulama kodlari
const verificationCodes = new Map();

// uploads klasorunu olustur
const uploadDir = path.join(__dirname, "..", "uploads", "temp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer yapilandirmasi
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

// dosya filtresi
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
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: fileFilter
});

// gecici dosyalari sil
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

// python yuz dogrulama scripti
function runFaceVerification(idCardPath, selfiePath) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, "..", "services", "faceVerify.py");

    const pythonExecutable = path.join(__dirname, "..", "..", ".venv", "Scripts", "python.exe");

    const pythonProcess = spawn(pythonExecutable, [pythonScript, idCardPath, selfiePath]);

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
      console.log("Python stderr:", data.toString().trim());
    });

    pythonProcess.on("close", (code) => {
      console.log(`Python script exit code: ${code}`);
      try {
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

// dogrulama kodu gonder
router.post("/send-code", async (req, res) => {
  try {
    const { surveyId, contactInfo, type } = req.body;

    if (!surveyId || !contactInfo || !type) {
      return res.status(400).json({
        success: false,
        error: "Survey ID, contactInfo ve type gereklidir"
      });
    }

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

    if (type === 'email') {
      const existingResponses = await SurveyResponse.find({ anketId: surveyId });
      for (const response of existingResponses) {
        const decrypted = decryptSensitiveFields(response.katilimciBilgileri || {});
        if (decrypted.mail && decrypted.mail.toLowerCase() === contactInfo.toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: "Bu e-posta adresi ile daha önce bu ankete katılım sağlanmış. Aynı e-posta ile birden fazla kez katılamazsınız."
          });
        }
      }

      const userEmailDomain = contactInfo.substring(contactInfo.lastIndexOf("@") + 1).toLowerCase();
      let allowedDomains = survey.hedefKitleKriterleri?.mailUzantisi || [];

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

      const verificationCode = generateVerificationCode();

      const codeKey = `${surveyId}:${contactInfo}`;
      verificationCodes.set(codeKey, {
        code: verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0
      });

      const surveyTitle = survey.anketBaslik || survey.baslik || 'Anket';
      await sendVerificationCode(contactInfo, verificationCode, surveyTitle);

      res.json({
        success: true,
        message: "Doğrulama kodu e-posta adresinize gönderildi"
      });

    } else if (type === 'sms') {
      if (!/^0\d{10}$/.test(contactInfo)) {
        return res.status(400).json({
          success: false,
          error: "Geçersiz telefon numarası formatı. 0 ile başlayan 11 haneli numara giriniz."
        });
      }

      const existingResponses = await SurveyResponse.find({ anketId: surveyId });
      for (const response of existingResponses) {
        const decrypted = decryptSensitiveFields(response.katilimciBilgileri || {});
        if (decrypted.telefonNumarasi && decrypted.telefonNumarasi === contactInfo) {
          return res.status(403).json({
            success: false,
            error: "Bu telefon numarası ile daha önce bu ankete katılım sağlanmış. Aynı telefon numarası ile birden fazla kez katılamazsınız."
          });
        }
      }

      const verificationCode = generateSMSVerificationCode();

      const codeKey = `${surveyId}:${contactInfo}`;
      verificationCodes.set(codeKey, {
        code: verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0
      });

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

// kod dogrula
router.post("/verify-code", async (req, res) => {
  try {
    const { surveyId, contactInfo, code } = req.body;

    const verificationContact = contactInfo || req.body.email;

    if (!surveyId || !verificationContact || !code) {
      return res.status(400).json({
        success: false,
        error: "Survey ID, contactInfo ve kod gereklidir"
      });
    }

    const codeKey = `${surveyId}:${verificationContact}`;
    const storedData = verificationCodes.get(codeKey);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: "Doğrulama kodunun süresi geçmiş. Yeni bir kod talep edin."
      });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(codeKey);
      return res.status(400).json({
        success: false,
        error: "Doğrulama kodunun süresi geçmiş. Yeni bir kod talep edin."
      });
    }

    if (storedData.attempts >= 5) {
      verificationCodes.delete(codeKey);
      return res.status(429).json({
        success: false,
        error: "Çok fazla yanlış deneme. Yeni bir kod talep edin."
      });
    }

    if (code !== storedData.code) {
      storedData.attempts++;
      return res.status(400).json({
        success: false,
        error: "Hatalı doğrulama kodu",
        remainingAttempts: 5 - storedData.attempts
      });
    }

    verificationCodes.delete(codeKey);

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

// kimlik ve yuz dogrulama
router.post("/verify-identity", upload.fields([
  { name: "idCard", maxCount: 1 },
  { name: "selfie", maxCount: 1 }
]), async (req, res) => {
  // Yüklenen dosya yolları - cleanup için
  const uploadedFiles = [];

  try {
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
    console.log(`  - Kimlik: ${idCardFile.filename} (${(idCardFile.size / 1024).toFixed(2)} KB)`);
    console.log(`  - Selfie: ${selfieFile.filename} (${(selfieFile.size / 1024).toFixed(2)} KB)`);
    console.log(`  - Kimlik boyut: ${idCardFile.mimetype}`);
    console.log(`  - Selfie boyut: ${selfieFile.mimetype}`);

    console.log("Yuz karsilastirmasi yapiliyor...");
    const faceResult = await runFaceVerification(idCardFile.path, selfieFile.path);

    console.log("Yüz karşılaştırma sonucu:", JSON.stringify(faceResult, null, 2));

    if (faceResult.security_checks) {
      console.log("Güvenlik kontrolleri:", JSON.stringify(faceResult.security_checks, null, 2));
    }

    if (!faceResult.match) {
      await cleanupTempFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        error: faceResult.error || "Yüz doğrulaması başarısız. Kimlik fotoğrafı ve selfie aynı kişiye ait değil.",
        details: {
          faceMatch: false,
          faceScore: faceResult.score,
          securityChecks: faceResult.security_checks || null
        }
      });
    }

    console.log("OCR atlaniyor - yuz dogrulama basarili...");

    await cleanupTempFiles(uploadedFiles);

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

    await cleanupTempFiles(uploadedFiles);

    res.status(500).json({
      success: false,
      error: error.message || "Kimlik doğrulama işlemi başarısız"
    });
  }
});

// tc kimlik no ocr dogrulama
router.post("/verify-tc-ocr", upload.single("idCard"), async (req, res) => {
  const uploadedFiles = [];

  try {
    const { tcNo } = req.body;

    if (!tcNo || tcNo.length !== 11) {
      return res.status(400).json({
        success: false,
        error: "Geçerli bir 11 haneli TC Kimlik No gereklidir"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Kimlik kartı fotoğrafı gereklidir"
      });
    }

    uploadedFiles.push(req.file.path);

    console.log("TC OCR doğrulama başlatıldı:");
    console.log(`  - Girilen TC: ${tcNo}`);
    console.log(`  - Kimlik kartı: ${req.file.filename}`);

    console.log("OCR ile TC Kimlik No okunuyor...");
    const ocrResult = await readTCFromIdCard(req.file.path);

    console.log("OCR sonucu:", ocrResult);

    if (!ocrResult.success || !ocrResult.tcKimlikNo) {
      await cleanupTempFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        error: ocrResult.error || "Kimlik kartından TC Kimlik No okunamadı. Lütfen daha net bir fotoğraf yükleyin."
      });
    }

    if (ocrResult.tcKimlikNo !== tcNo) {
      await cleanupTempFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        error: "Girdiğiniz TC Kimlik No ile kimlik kartınızdaki numara eşleşmiyor!"
      });
    }

    await cleanupTempFiles(uploadedFiles);

    const verificationToken = `tc:${tcNo}:${Date.now()}`;

    res.json({
      success: true,
      message: "TC Kimlik No başarıyla doğrulandı",
      data: {
        tcKimlikNo: tcNo,
        verificationToken: verificationToken
      }
    });

  } catch (error) {
    console.error("TC OCR doğrulama hatası:", error);
    await cleanupTempFiles(uploadedFiles);

    res.status(500).json({
      success: false,
      error: error.message || "TC doğrulama işlemi başarısız"
    });
  }
});

// multer hata yonetimi
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

