const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { generateVerificationCode, sendVerificationCode } = require("../services/mailService");

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Geçici doğrulama kodları (Memory'de - production'da Redis kullanılmalı)
const verificationCodes = new Map();
const CODE_EXPIRY = 10 * 60 * 1000; // 10 dakika

function sign(u) {
  return jwt.sign(
    { _id: u._id, email: u.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}

// Doğrulama kodu gönder
router.post("/send-code", async (req, res) => {
  try {
    const { email, firstName } = req.body;

    if (!email) throw new Error("E-posta adresi gerekli");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Geçersiz e-posta");

    // E-posta zaten kayıtlı mı kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Bu e-posta adresi zaten kayıtlı");
    }

    // Doğrulama kodu oluştur
    const code = generateVerificationCode();
    
    // Kodu memory'de sakla (email -> {code, expiry, attempts})
    verificationCodes.set(email, {
      code,
      expiry: Date.now() + CODE_EXPIRY,
      attempts: 0
    });

    // E-posta gönder
    await sendVerificationCode(email, code, firstName || 'Kullanıcı');

    console.log(`✅ Doğrulama kodu gönderildi: ${email}`);
    res.json({ message: "Doğrulama kodu gönderildi", expiresIn: CODE_EXPIRY / 1000 });

  } catch (e) {
    console.error("❌ Kod gönderme hatası:", e.message);
    res.status(400).json({ error: e.message });
  }
});

// Kayıt (doğrulama kodu ile)
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, verificationCode } = req.body;

    // Basit doğrulamalar
    if (!firstName || !lastName || !email || !password)
      throw new Error("Zorunlu alanlar eksik");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Geçersiz e-posta");
    if (password.length < 6) throw new Error("Şifre min 6 karakter");

    // Telefon numarası kontrolü
    if (phone) {
      // Telefon formatı kontrolü (0 ile başlayan 11 haneli numara)
      if (!/^0\d{10}$/.test(phone)) {
        throw new Error("Geçersiz telefon numarası formatı. 0 ile başlayan 11 haneli numara giriniz.");
      }
      // Aynı telefon numarası ile kayıtlı kullanıcı var mı?
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        throw new Error("Bu telefon numarası zaten kayıtlı");
      }
    }

    // Doğrulama kodu kontrolü
    if (!verificationCode) {
      throw new Error("Doğrulama kodu gerekli");
    }

    const storedData = verificationCodes.get(email);
    if (!storedData) {
      throw new Error("Doğrulama kodu bulunamadı. Lütfen önce kod isteyin.");
    }

    // Süre kontrolü
    if (Date.now() > storedData.expiry) {
      verificationCodes.delete(email);
      throw new Error("Doğrulama kodunun süresi doldu. Lütfen yeni kod isteyin.");
    }

    // Deneme sayısı kontrolü (max 5)
    if (storedData.attempts >= 5) {
      verificationCodes.delete(email);
      throw new Error("Çok fazla yanlış deneme. Lütfen yeni kod isteyin.");
    }

    // Kod kontrolü
    if (storedData.code !== verificationCode) {
      storedData.attempts++;
      throw new Error("Doğrulama kodu hatalı");
    }

    // Kod doğru - temizle
    verificationCodes.delete(email);

    // Kullanıcıyı oluştur
    const u = new User({ firstName, lastName, email, phone, password });
    await u.save();

    const token = sign(u);
    console.log(`✅ Yeni kullanıcı kayıt oldu: ${email}`);
    res.status(201).json({ token, user: u.safeJSON() });

  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Giriş
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email });
  if (!u || !(await u.checkPassword(password)))
    return res.status(401).json({ error: "E-posta veya şifre hatalı" });

  const token = sign(u);
  res.json({ token, user: u.safeJSON() });
});

// Google OAuth Giriş
router.post("/google", async (req, res) => {
  try {
    const { email, given_name, family_name, picture, sub } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "E-posta bilgisi gerekli" });
    }

    const googleId = sub;

    // Kullanıcıyı bul veya oluştur
    let user = await User.findOne({ email });
    
    if (!user) {
      // Yeni kullanıcı oluştur (Google ile kayıt)
      user = new User({
        firstName: given_name || "Google",
        lastName: family_name || "Kullanıcı",
        email,
        googleId,
        profilePicture: picture,
        password: Math.random().toString(36).slice(-12) + "Aa1!", // Rastgele güçlü şifre
        isGoogleUser: true
      });
      await user.save();
      console.log(`✅ Yeni Google kullanıcısı kayıt oldu: ${email}`);
    } else {
      // Mevcut kullanıcının Google bilgilerini güncelle
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        user.isGoogleUser = true;
      }
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
      }
      await user.save();
      console.log(`✅ Google ile giriş yapıldı: ${email}`);
    }

    const token = sign(user);
    res.json({ token, user: user.safeJSON() });

  } catch (err) {
    console.error("❌ Google OAuth hatası:", err.message);
    res.status(401).json({ error: "Google kimlik doğrulama başarısız: " + err.message });
  }
});

// Oturum sahibi bilgilerini GETİR (Mevcut kodun)
router.get("/me", auth(true), async (req, res) => {
  const u = await User.findById(req.user._id);
  if (!u) return res.status(404).json({ error: "Kullanıcı yok" });
  res.json(u.safeJSON());
});

// --- YENİ EKLENEN KISIM: Oturum sahibi bilgilerini GÜNCELLE ---
router.put("/me", auth(true), async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    
    // Güncellenecek alanları belirle (TCKN ve Şifre buradan güncellenmez)
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;

    // MongoDB güncelleme işlemi
    // new: true -> güncellenmiş veriyi döndürür
    // runValidators: true -> modeldeki zorunlulukları (örn email formatı) kontrol eder
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    res.json({ message: "Güncellendi", user: updatedUser.safeJSON() });

  } catch (e) {
    // E-posta veya telefon başkasında varsa hata verir (duplicate key error)
    if (e.code === 11000) {
      return res.status(400).json({ error: "Bu e-posta veya telefon numarası zaten kullanımda." });
    }
    res.status(400).json({ error: e.message });
  }
});

// --- ŞİFREMİ UNUTTUM ---

// Şifre sıfırlama kodları (Memory'de)
const resetCodes = new Map();
const RESET_CODE_EXPIRY = 10 * 60 * 1000; // 10 dakika
const MAX_RESET_ATTEMPTS = 3;

// 1. Şifre sıfırlama kodu gönder
router.post("/forgot-password/send-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) throw new Error("E-posta adresi gerekli");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Geçersiz e-posta");

    // Bu e-posta kayıtlı mı?
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı");
    }

    // Doğrulama kodu oluştur
    const code = generateVerificationCode();
    
    // Kodu memory'de sakla
    resetCodes.set(email, {
      code,
      expiry: Date.now() + RESET_CODE_EXPIRY,
      attempts: 0
    });

    // E-posta gönder
    await sendVerificationCode(email, code, user.firstName || 'Kullanıcı');

    console.log(`✅ Şifre sıfırlama kodu gönderildi: ${email}`);
    res.json({ 
      message: "Şifre sıfırlama kodu e-posta adresinize gönderildi",
      expiresIn: RESET_CODE_EXPIRY / 1000 
    });

  } catch (e) {
    console.error("❌ Şifre sıfırlama kodu gönderme hatası:", e.message);
    res.status(400).json({ error: e.message });
  }
});

// 2. Kod doğrula
router.post("/forgot-password/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) throw new Error("E-posta ve kod gerekli");

    const storedData = resetCodes.get(email);
    if (!storedData) {
      throw new Error("Doğrulama kodu bulunamadı. Lütfen yeni kod isteyin.");
    }

    // Süre kontrolü
    if (Date.now() > storedData.expiry) {
      resetCodes.delete(email);
      throw new Error("Doğrulama kodunun süresi doldu. Lütfen yeni kod isteyin.");
    }

    // Deneme sayısı kontrolü
    if (storedData.attempts >= MAX_RESET_ATTEMPTS) {
      resetCodes.delete(email);
      throw new Error("3 yanlış deneme hakkınızı kullandınız. Lütfen yeni kod isteyin.");
    }

    // Kod kontrolü
    if (storedData.code !== code) {
      storedData.attempts++;
      const remaining = MAX_RESET_ATTEMPTS - storedData.attempts;
      if (remaining <= 0) {
        resetCodes.delete(email);
        throw new Error("3 yanlış deneme hakkınızı kullandınız. Lütfen yeni kod isteyin.");
      }
      throw new Error(`Doğrulama kodu hatalı. Kalan hak: ${remaining}`);
    }

    // Kod doğru - kodun onaylandığını işaretle (şifre değiştirme için)
    storedData.verified = true;
    
    console.log(`✅ Şifre sıfırlama kodu doğrulandı: ${email}`);
    res.json({ message: "Kod doğrulandı. Şimdi yeni şifrenizi belirleyebilirsiniz." });

  } catch (e) {
    console.error("❌ Kod doğrulama hatası:", e.message);
    res.status(400).json({ error: e.message });
  }
});

// 3. Şifre güncelle
router.post("/forgot-password/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      throw new Error("Tüm alanlar gerekli");
    }

    // Şifre kriteri kontrolü
    if (newPassword.length < 6) {
      throw new Error("Şifre en az 6 karakter olmalı");
    }

    const storedData = resetCodes.get(email);
    if (!storedData) {
      throw new Error("Geçersiz istek. Lütfen işlemi baştan başlatın.");
    }

    // Kod doğrulanmış mı?
    if (!storedData.verified || storedData.code !== code) {
      throw new Error("Kod doğrulanmamış. Lütfen önce kodu doğrulayın.");
    }

    // Kullanıcıyı bul ve şifreyi güncelle
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }

    user.password = newPassword; // Model'deki pre-save hook otomatik hash'leyecek
    await user.save();

    // Kodu temizle
    resetCodes.delete(email);

    console.log(`✅ Şifre başarıyla güncellendi: ${email}`);
    res.json({ message: "Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz." });

  } catch (e) {
    console.error("❌ Şifre güncelleme hatası:", e.message);
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;