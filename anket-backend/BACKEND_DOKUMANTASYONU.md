# 📁 ANKET-BACKEND DOKÜMANTASYONU

Bu dosya, anket-backend projesinin tamamını anlatan kapsamlı bir dokümantasyondur.
Sunumunuz için bu dosyayı okuyarak tüm backend yapısını anlayabilirsiniz.

---

## 📂 DOSYA YAPISI

```
anket-backend/
├── server.js              # Ana giriş noktası (Express server)
├── aiRoutes.js            # AI ile anket oluşturma route'ları
├── aiService.js           # Groq AI servisi (LLM)
├── .env                   # Ortam değişkenleri (API KEY'ler vb.)
│
├── middleware/
│   └── auth.js            # JWT kimlik doğrulama middleware
│
├── models/                # MongoDB şemaları (Mongoose)
│   ├── Survey.js          # Anket modeli
│   ├── SurveyLink.js      # Paylaşım linki modeli
│   ├── SurveyResponse.js  # Anket cevapları modeli
│   └── User.js            # Kullanıcı modeli
│
├── routes/                # API endpoint'leri
│   ├── auth.js            # Kullanıcı kayıt/giriş/şifre sıfırlama
│   ├── surveys.js         # Anket CRUD + cevap kaydetme
│   ├── responses.js       # Tek cevap detayı/silme
│   ├── verification.js    # Email/SMS/Kimlik doğrulama
│   ├── geocoding.js       # Konum -> Adres çevirisi
│   └── places.js          # Google Places Autocomplete
│
├── services/              # İş mantığı servisleri
│   ├── encryptionService.js  # AES-256 şifreleme (KVKK)
│   ├── mailService.js        # EmailJS ile mail gönderimi
│   ├── smsService.js         # SMS mock servisi
│   ├── ocrService.js         # Tesseract.js ile TC OCR
│   └── faceVerify.py         # Python yüz karşılaştırma
│
└── uploads/temp/          # Geçici dosya yüklemeleri
```

---

## 🚀 1. SERVER.JS - Ana Sunucu Dosyası

### 📌 İşlevi
Express.js tabanlı HTTP sunucusunu başlatır ve tüm route'ları bağlar.

### 🔑 Önemli Kısımlar

```javascript
// GÜVENLİK MIDDLEWARE'LERİ
app.use(helmet());              // HTTP başlıklarını güvenli hale getirir
app.use(rateLimit({             // DoS koruması
  windowMs: 15 * 60 * 1000,     // 15 dakika
  max: 100                       // IP başına 100 istek
}));

// CORS - Mobil + Web erişimi
const corsOptions = {
  origin: ['http://localhost:3000', 'http://192.168.1.28:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

// JSON Parser - Büyük görseller için 50MB limit
app.use(express.json({ limit: '50mb' }));

// MONGODB BAĞLANTISI
mongoose.connect(process.env.MONGODB_URI);

// ROUTE'LAR
app.use("/api/auth", require("./routes/auth"));           // Kullanıcı işlemleri
app.use("/api/surveys", require("./routes/surveys"));     // Anket CRUD
app.use("/api/responses", require("./routes/responses")); // Cevap işlemleri
app.use("/api/verification", require("./routes/verification")); // Doğrulama
app.use("/api", require("./routes/geocoding"));           // Konum servisi
app.use("/api/places", require("./routes/places"));       // Yer arama
app.use("/api/ai", aiRoutes);                             // AI anket oluşturma
```

---

## 🔐 2. MIDDLEWARE/AUTH.JS - JWT Kimlik Doğrulama

### 📌 İşlevi
Bearer token kontrolü yaparak kullanıcının kimliğini doğrular.

### 🔑 Önemli Kısımlar

```javascript
module.exports = (required = true) => (req, res, next) => {
  // Token'ı header'dan al: "Bearer <token>"
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;

  // Token yoksa ve zorunluysa 401 döndür
  if (!token) return required ? res.status(401).json({ error: "Yetkisiz" }) : next();

  // Token'ı doğrula ve user bilgisini req'e ekle
  req.user = jwt.verify(token, process.env.JWT_SECRET);
  next();
};
```

### 💡 Kullanım
```javascript
router.get("/me", auth(true), ...);   // Token ZORUNLU
router.get("/public", auth(false), ...); // Token opsiyonel
```

---

## 📊 3. MODELS - Veritabanı Şemaları

### 3.1 USER.JS - Kullanıcı Modeli

```javascript
const UserSchema = new mongoose.Schema({
  firstName: String,          // Ad
  lastName: String,           // Soyad
  email: String,              // E-posta (benzersiz)
  password: String,           // Şifre (bcrypt hash)
  phone: String,              // Telefon (opsiyonel, benzersiz)
  googleId: String,           // Google OAuth ID
  profilePicture: String,     // Profil resmi URL
  isGoogleUser: Boolean       // Google ile kayıt oldu mu?
});

// Şifre kaydedilmeden önce otomatik hash'lenir
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Şifre kontrolü
UserSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};
```

---

### 3.2 SURVEY.JS - Anket Modeli

```javascript
const SurveySchema = new mongoose.Schema({
  kullaniciId: ObjectId,       // Anketi oluşturan kullanıcı
  anketBaslik: String,         // Anket başlığı
  anketAciklama: String,       // Anket açıklaması
  
  // SORULAR DİZİSİ
  sorular: [{
    soruMetni: String,         // Soru metni
    soruTipi: {                // Soru tipi
      type: String,
      enum: ["acik-uclu", "coktan-tek", "coktan-coklu", "slider"]
    },
    secenekler: [{             // Çoktan seçmeli için seçenekler
      metni: String
    }],
    siraNo: Number,            // Soru sırası
    minDegeri: Number,         // Slider için min
    maxDegeri: Number,         // Slider için max
    gorselUrl: String          // Soru görseli (base64)
  }],
  
  // HEDEF KİTLE KRİTERLERİ
  hedefKitleKriterleri: {
    mail: Boolean,             // Email doğrulama gerekli mi?
    mailUzantisi: String,      // Kabul edilen email uzantısı (@itu.edu.tr)
    tcNo: Boolean,             // TC No gerekli mi?
    kimlikDogrulama: Boolean,  // Yüz doğrulama gerekli mi?
    telefonNumarasi: Boolean,  // Telefon doğrulama gerekli mi?
    konum: Boolean,            // Konum doğrulama gerekli mi?
    
    // Konum kısıtlaması detayları
    konumKisitlamasi: {
      tip: ["radius", "mahalle", "ilce", "sehir"],
      radiusMetre: Number,     // Yarıçap (metre)
      anketKoordinatlari: {    // Merkez nokta
        latitude: Number,
        longitude: Number
      },
      mahalle: String,
      ilce: String,
      sehir: String
    }
  },
  
  durum: ["aktif", "pasif", "taslak"],  // Anket durumu
  paylasimLinki: String,       // Paylaşım linki
  aiIleOlusturuldu: Boolean,   // AI ile mi oluşturuldu?
  toplamCevapSayisi: Number    // Toplam cevap sayısı
});
```

---

### 3.3 SURVEYLINK.JS - Paylaşım Linki Modeli

```javascript
const SurveyLinkSchema = new mongoose.Schema({
  anketId: ObjectId,           // İlişkili anket
  kullaniciId: ObjectId,       // Linki oluşturan kullanıcı
  linkKodu: String,            // 8 karakterlik benzersiz kod (örn: "X7K9M2PQ")
  tamLink: String,             // Tam URL (örn: "http://localhost:3000/anket-coz/X7K9M2PQ")
  aktif: Boolean,              // Link aktif mi?
  sonKullanmaTarihi: Date,     // Opsiyonel son kullanma tarihi
  maksimumCevapSayisi: Number, // Maksimum cevap limiti
  suankiCevapSayisi: Number,   // Mevcut cevap sayısı
  tiklanmaSayisi: Number,      // Kaç kez tıklandı
  tamamlananCevapSayisi: Number,
  yarimBirakilanSayisi: Number
});
```

---

### 3.4 SURVEYRESPONSE.JS - Anket Cevapları Modeli

```javascript
const SurveyResponseSchema = new mongoose.Schema({
  anketId: ObjectId,           // Hangi ankete verilen cevap
  
  // Katılımcı bilgileri (şifrelenmiş)
  katilimciBilgileri: {
    type: Mixed,               // TC No, email, telefon vb. (AES-256 şifreli)
    default: {}
  },
  
  // Soru cevapları
  cevaplar: {
    type: Mixed,               // { soruId: "cevap" } formatında
    default: {}
  },
  
  olusturulmaTarihi: Date      // Cevap tarihi
});
```

---

## 🛤️ 4. ROUTES - API Endpoint'leri

### 4.1 AUTH.JS - Kullanıcı İşlemleri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/auth/send-code` | POST | Kayıt için doğrulama kodu gönder |
| `/api/auth/register` | POST | Yeni kullanıcı kaydı (kod doğrulamalı) |
| `/api/auth/login` | POST | Email + şifre ile giriş |
| `/api/auth/google` | POST | Google OAuth ile giriş/kayıt |
| `/api/auth/me` | GET | Oturum sahibi bilgilerini getir |
| `/api/auth/me` | PUT | Oturum sahibi bilgilerini güncelle |
| `/api/auth/forgot-password/send-code` | POST | Şifre sıfırlama kodu gönder |
| `/api/auth/forgot-password/verify-code` | POST | Sıfırlama kodunu doğrula |
| `/api/auth/forgot-password/reset-password` | POST | Yeni şifre belirle |

### 🔑 Önemli Kısımlar - Kayıt İşlemi

```javascript
router.post("/register", async (req, res) => {
  // 1. Doğrulama kodunu kontrol et
  const storedData = verificationCodes.get(email);
  if (storedData.code !== verificationCode) {
    throw new Error("Doğrulama kodu hatalı");
  }
  
  // 2. Kullanıcıyı oluştur
  const u = new User({ firstName, lastName, email, phone, password });
  await u.save();
  
  // 3. JWT token oluştur ve döndür
  const token = jwt.sign({ _id: u._id, email: u.email }, JWT_SECRET);
  res.json({ token, user: u.safeJSON() });
});
```

---

### 4.2 SURVEYS.JS - Anket İşlemleri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/surveys` | POST | Yeni anket oluştur |
| `/api/surveys` | GET | Kullanıcının anketlerini listele |
| `/api/surveys/:id` | GET | Tek anket detayı |
| `/api/surveys/:id` | DELETE | Anket sil |
| `/api/surveys/:id/status` | PATCH | Anket durumunu güncelle (aktif/pasif) |
| `/api/surveys/by-link/:linkKodu` | GET | Link kodu ile anketi getir |
| `/api/surveys/submit` | POST | Anket cevabı kaydet |
| `/api/surveys/check-location/:anketId` | POST | Konum doğrulama kontrolü |
| `/api/surveys/:id/responses` | GET | Ankete verilen cevapları getir |
| `/api/surveys/:id/results` | GET | Anket sonuçları + istatistikler |

### 🔑 Önemli Kısımlar - Cevap Kaydetme

```javascript
router.post("/submit", async (req, res) => {
  const { anketId, cevaplar, katilimciBilgileri, dogrulamaBilgileri } = req.body;
  
  // KONUM FİLTRESİ KONTROLÜ
  if (kriterler.konum) {
    // Haversine formülü ile mesafe hesapla
    const mesafe = haversineDistance(userLat, userLng, anketLat, anketLng);
    if (mesafe > maxMesafe) {
      return res.status(403).json({ error: "Konumunuz bu anketin hedef bölgesinde değil" });
    }
  }
  
  // Hassas verileri şifrele (KVKK uyumu)
  const sifrelenmisBilgiler = encryptSensitiveFields(birlestirilenBilgiler);
  
  // Cevabı kaydet
  const yeniCevap = new SurveyResponse({
    anketId,
    katilimciBilgileri: sifrelenmisBilgiler,
    cevaplar
  });
  await yeniCevap.save();
});
```

### 🔑 Önemli Kısımlar - Haversine Mesafe Formülü

```javascript
// İki koordinat arasındaki mesafeyi METRE cinsinden hesaplar
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Dünya yarıçapı (metre)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Mesafe (metre)
}
```

---

### 4.3 VERIFICATION.JS - Doğrulama İşlemleri

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/verification/send-code` | POST | Email/SMS doğrulama kodu gönder |
| `/api/verification/verify-code` | POST | Kodu doğrula |
| `/api/verification/verify-identity` | POST | Kimlik + Yüz doğrulama |
| `/api/verification/verify-tc-ocr` | POST | TC Kimlik No OCR doğrulama |

### 🔑 Önemli Kısımlar - Email Doğrulama

```javascript
router.post("/send-code", async (req, res) => {
  const { surveyId, contactInfo, type } = req.body;
  
  // MÜKERRER KONTROL - Aynı email ile daha önce cevap verilmiş mi?
  const existingResponses = await SurveyResponse.find({ anketId: surveyId });
  for (const response of existingResponses) {
    const decrypted = decryptSensitiveFields(response.katilimciBilgileri);
    if (decrypted.mail === contactInfo) {
      return res.status(403).json({ error: "Bu email ile daha önce katıldınız" });
    }
  }
  
  // Email uzantısı kontrolü
  const userDomain = contactInfo.split("@")[1];
  if (!allowedDomains.includes(userDomain)) {
    return res.status(403).json({ error: `Sadece ${allowedDomains} kabul edilir` });
  }
  
  // Kod gönder
  const code = generateVerificationCode();
  await sendVerificationCode(contactInfo, code);
});
```

### 🔑 Önemli Kısımlar - Yüz Doğrulama

```javascript
router.post("/verify-identity", upload.fields([
  { name: "idCard", maxCount: 1 },   // Kimlik kartı
  { name: "selfie", maxCount: 1 }    // Selfie
]), async (req, res) => {
  
  // Python script ile yüz karşılaştırması
  const faceResult = await runFaceVerification(idCardFile.path, selfieFile.path);
  
  if (!faceResult.match) {
    return res.status(400).json({
      error: "Yüz doğrulaması başarısız. Kimlik ve selfie aynı kişiye ait değil."
    });
  }
  
  // Başarılı
  res.json({
    success: true,
    message: "Yüz doğrulaması başarılı",
    data: { faceMatchScore: faceResult.score }
  });
});
```

---

### 4.4 GEOCODING.JS - Konum Servisi

```javascript
// POST /api/geocode
// Koordinatları adrese çevirir (Reverse Geocoding)
router.post('/geocode', async (req, res) => {
  const { latitude, longitude } = req.body;
  
  // Google Geocoding API'ye istek
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`;
  
  const response = await axios.get(url);
  
  // Adres bileşenlerini çıkar
  res.json({
    adres: "Tam adres...",
    sehir: "İstanbul",
    ilce: "Kadıköy",
    mahalle: "Caferağa",
    sokak: "...",
    postaKodu: "34710"
  });
});
```

---

### 4.5 PLACES.JS - Yer Arama Servisi

```javascript
// GET /api/places/autocomplete
// Kullanıcı yazarken yer önerileri getirir
router.get('/autocomplete', async (req, res) => {
  const { input } = req.query; // Örn: "Kadıköy"
  
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`;
  const response = await axios.get(url, {
    params: {
      input: input,
      key: GOOGLE_API_KEY,
      language: 'tr',
      components: 'country:tr' // Sadece Türkiye
    }
  });
  
  res.json(response.data); // Öneri listesi
});

// GET /api/places/details
// Seçilen yerin detaylarını (koordinat, adres) getirir
router.get('/details', async (req, res) => {
  const { placeId } = req.query;
  // Google Place Details API'ye istek...
});
```

---

## 🤖 5. AI SERVİSİ - Yapay Zeka ile Anket Oluşturma

### 5.1 aiRoutes.js

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/ai/generate-survey` | POST | AI ile anket soruları oluştur |
| `/api/ai/analyze-survey` | POST | Anket cevaplarını analiz et |
| `/api/ai/health` | GET | AI servisi durumu |

### 5.2 aiService.js

```javascript
// Groq AI SDK kullanılıyor (LLaMA 3.1 modeli)
const Groq = require("groq-sdk");
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function generateSurveyQuestions(topic, questionCount) {
  const prompt = `"${topic}" konusunda ${questionCount} soruluk anket oluştur...`;
  
  const resp = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 3500,
    temperature: 0.4
  });
  
  // JSON parse et ve normalize et
  const parsedData = JSON.parse(resp.choices[0].message.content);
  
  // Soru tiplerini Türkçe'ye çevir
  // single_select -> coktan-tek
  // multi_select -> coktan-coklu
  // rating -> slider
  // text -> acik-uclu
  
  return { anketBaslik: parsedData.surveyTitle, sorular: [...] };
}
```

---

## 🔒 6. SERVICES - İş Mantığı Servisleri

### 6.1 encryptionService.js - AES-256 Şifreleme

```javascript
// KVKK uyumu için hassas verileri şifreler
const crypto = require('crypto');
const ALGORITHM = 'aes-256-gcm';

// Şifreleme
function encrypt(plainText) {
  const key = crypto.pbkdf2Sync(PII_SECRET, SALT, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

// Şifre çözme
function decrypt(encryptedData) {
  const [iv, authTag, encrypted] = encryptedData.split(':');
  // ... tersine işlem
}

// Hassas alanları şifrele
function encryptSensitiveFields(katilimciBilgileri) {
  const sensitiveFields = ['tcNo', 'adres', 'telefonNo'];
  sensitiveFields.forEach(field => {
    if (katilimciBilgileri[field]) {
      katilimciBilgileri[field] = encrypt(katilimciBilgileri[field]);
    }
  });
  return katilimciBilgileri;
}
```

---

### 6.2 mailService.js - Email Gönderimi

```javascript
const emailjs = require('@emailjs/nodejs');

// 6 haneli kod oluştur
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// EmailJS ile mail gönder
async function sendVerificationCode(userEmail, code, surveyTitle) {
  const templateParams = {
    email: userEmail,
    passcode: code,
    time: '10 dakika'
  };
  
  await emailjs.send(
    process.env.EMAILJS_SERVICE_ID,
    process.env.EMAILJS_TEMPLATE_ID,
    templateParams
  );
}
```

---

### 6.3 smsService.js - SMS Servisi (Mock)

```javascript
// Geliştirme için mock SMS - gerçek SMS göndermez, terminale yazar
async function sendSMSVerification(phoneNumber, code) {
  console.log('📱 SMS DOĞRULAMA KODU (MOCK)');
  console.log(`📞 Telefon: ${phoneNumber}`);
  console.log(`🔐 Kod: ${code}`);
  return true;
}
```

---

### 6.4 ocrService.js - TC Kimlik OCR

```javascript
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

// Çoklu görüntü işleme stratejileri
const STRATEGIES = [
  { name: 'light-threshold', threshold: 100 },
  { name: 'high-contrast', threshold: 128 },
  { name: 'dark-threshold', threshold: 160 },
  { name: 'inverted', negate: true },
  // ...
];

// TC Kimlik No algoritma doğrulaması
function isValidTCKimlikNo(tc) {
  if (tc.length !== 11 || tc[0] === '0') return false;
  
  const digits = tc.split('').map(Number);
  
  // 10. hane kontrolü
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const check10 = ((oddSum * 7) - evenSum) % 10;
  if (check10 !== digits[9]) return false;
  
  // 11. hane kontrolü
  const sum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sum % 10 !== digits[10]) return false;
  
  return true;
}

// Ana fonksiyon
async function readTCFromIdCard(imagePath) {
  // Her stratejiyi dene
  for (const strategy of STRATEGIES) {
    // Görüntüyü işle
    const processedImage = await preprocessImage(imagePath, strategy);
    
    // OCR çalıştır
    const text = await runOCR(processedImage);
    
    // TC numaralarını bul
    const candidates = extractPotentialTCs(text);
    
    // Geçerli TC varsa döndür
    for (const tc of candidates) {
      if (isValidTCKimlikNo(tc)) {
        return { success: true, tcKimlikNo: tc };
      }
    }
  }
  
  return { success: false, error: "TC bulunamadı" };
}
```

---

### 6.5 faceVerify.py - Yüz Doğrulama

```python
import face_recognition
import cv2

def verify_faces(id_card_path, selfie_path):
    # GÜVENLİK KONTROLÜ 1: Aynı dosya mı?
    if hash(id_card) == hash(selfie):
        return {"match": False, "error": "Aynı dosya yüklendi!"}
    
    # GÜVENLİK KONTROLÜ 2: Kimlik kartı formatı mı?
    id_face_ratio = get_face_ratio(id_card_path)
    if id_face_ratio > 0.50:  # Yüz %50'den büyükse selfie
        return {"match": False, "error": "Bu kimlik kartı değil, selfie!"}
    
    # GÜVENLİK KONTROLÜ 3: Selfie formatı mı?
    selfie_face_ratio = get_face_ratio(selfie_path)
    if selfie_face_ratio < 0.10:  # Yüz %10'dan küçükse kimlik
        return {"match": False, "error": "Yakın çekilmiş selfie olmalı!"}
    
    # Yüzleri karşılaştır
    id_encoding = face_recognition.face_encodings(id_card_image)[0]
    selfie_encoding = face_recognition.face_encodings(selfie_image)[0]
    
    distance = face_recognition.face_distance([id_encoding], selfie_encoding)[0]
    score = 1 - distance  # 0-1 arası benzerlik skoru
    
    matches = face_recognition.compare_faces([id_encoding], selfie_encoding, tolerance=0.5)
    
    return {
        "match": matches[0],
        "score": score,
        "security_checks": {...}
    }
```

---

## 📡 7. API KULLANIM ÖRNEKLERİ

### 7.1 Kullanıcı Kaydı

```http
POST /api/auth/send-code
Content-Type: application/json

{
  "email": "user@example.com",
  "firstName": "Ahmet"
}

---

POST /api/auth/register
Content-Type: application/json

{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "email": "user@example.com",
  "password": "güçlüşifre123",
  "verificationCode": "123456"
}
```

### 7.2 Anket Oluşturma

```http
POST /api/surveys
Authorization: Bearer <token>
Content-Type: application/json

{
  "anketBaslik": "Müşteri Memnuniyeti",
  "anketAciklama": "Hizmetlerimizi değerlendirin",
  "sorular": [
    {
      "soruMetni": "Hizmetimizden memnun musunuz?",
      "soruTipi": "coktan-tek",
      "secenekler": [
        { "metni": "Çok Memnunum" },
        { "metni": "Memnunum" },
        { "metni": "Memnun Değilim" }
      ]
    }
  ],
  "hedefKitleKriterleri": {
    "mail": true,
    "mailUzantisi": "@sirket.com"
  }
}
```

### 7.3 AI ile Anket Oluşturma

```http
POST /api/ai/generate-survey
Content-Type: application/json

{
  "topic": "Uzaktan çalışma deneyimi",
  "questionCount": 5
}

YANIT:
{
  "success": true,
  "data": {
    "anketBaslik": "Uzaktan Çalışma Deneyimi Anketi",
    "sorular": [
      { "metin": "Evden çalışırken ne kadar verimli olduğunuzu düşünüyorsunuz?", "tip": "slider", ... },
      { "metin": "Uzaktan çalışmanın en büyük avantajı nedir?", "tip": "coktan-tek", ... }
    ]
  }
}
```

---

## 🔐 8. GÜVENLİK ÖZETİ

| Özellik | Açıklama |
|---------|----------|
| **JWT Kimlik Doğrulama** | 7 gün geçerli token |
| **Bcrypt Şifreleme** | Şifreler 10 round hash |
| **AES-256-GCM** | TC No, adres gibi hassas veriler |
| **Rate Limiting** | 15 dakikada 100 istek |
| **Helmet.js** | HTTP başlık güvenliği |
| **CORS** | İzinli origin'ler |
| **Mükerrer Kontrol** | Aynı email/telefon ile tekrar katılım engeli |
| **Yüz Doğrulama** | Kimlik + Selfie karşılaştırma |
| **Konum Doğrulama** | Haversine mesafe kontrolü |

---

## 📊 9. TEKNOLOJİ STACK

| Katman | Teknoloji |
|--------|-----------|
| **Backend** | Node.js, Express.js |
| **Veritabanı** | MongoDB, Mongoose ODM |
| **Kimlik Doğrulama** | JWT, Bcrypt |
| **Şifreleme** | Node.js Crypto (AES-256-GCM) |
| **Email** | EmailJS |
| **SMS** | Mock (geliştirme için) |
| **Konum** | Google Maps Geocoding API |
| **Yer Arama** | Google Places API |
| **OCR** | Tesseract.js, Sharp |
| **Yüz Tanıma** | Python face_recognition, OpenCV |
| **AI** | Groq SDK (LLaMA 3.1) |

---

## 🎯 10. ÖZET

Bu backend sistemi şu özelliklere sahiptir:

1. **Kullanıcı Yönetimi**: Kayıt, giriş, Google OAuth, şifre sıfırlama
2. **Anket Yönetimi**: CRUD işlemleri, durum kontrolü, paylaşım linkleri
3. **Doğrulama Kriterleri**: Email, SMS, TC No, Kimlik+Yüz, Konum
4. **Veri Güvenliği**: KVKK uyumlu AES-256 şifreleme
5. **AI Entegrasyonu**: Groq/LLaMA ile otomatik anket oluşturma
6. **Coğrafi Hedefleme**: Yarıçap, mahalle, ilçe, şehir bazlı kısıtlamalar
7. **İstatistik ve Analiz**: Detaylı cevap istatistikleri

---

*Bu dosya sunumunuz için hazırlanmıştır. Başarılar! 🚀*
