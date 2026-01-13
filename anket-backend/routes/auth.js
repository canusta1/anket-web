const router = require("express").Router();
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { generateVerificationCode, sendVerificationCode } = require("../services/mailService");


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const verificationCodes = new Map();
const CODE_EXPIRY = 10 * 60 * 1000;

function sign(u) {
  return jwt.sign(
    { _id: u._id, email: u.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}

// dogrulama kodu gonder
router.post("/send-code", async (req, res) => {
  try {
    const { email, firstName } = req.body;

    if (!email) throw new Error("E-posta adresi gerekli");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Geçersiz e-posta");


    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Bu e-posta adresi zaten kayıtlı");
    }


    const code = generateVerificationCode();


    verificationCodes.set(email, {
      code,
      expiry: Date.now() + CODE_EXPIRY,
      attempts: 0
    });


    await sendVerificationCode(email, code, firstName || 'Kullanıcı');

    console.log(`✅ Doğrulama kodu gönderildi: ${email}`);
    res.json({ message: "Doğrulama kodu gönderildi", expiresIn: CODE_EXPIRY / 1000 });

  } catch (e) {
    console.error("❌ Kod gönderme hatası:", e.message);
    res.status(400).json({ error: e.message });
  }
});

// kayit
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, verificationCode } = req.body;


    if (!firstName || !lastName || !email || !password)
      throw new Error("Zorunlu alanlar eksik");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Geçersiz e-posta");
    if (password.length < 6) throw new Error("Şifre min 6 karakter");


    if (phone) {

      if (!/^0\d{10}$/.test(phone)) {
        throw new Error("Geçersiz telefon numarası formatı. 0 ile başlayan 11 haneli numara giriniz.");
      }

      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        throw new Error("Bu telefon numarası zaten kayıtlı");
      }
    }


    if (!verificationCode) {
      throw new Error("Doğrulama kodu gerekli");
    }

    const storedData = verificationCodes.get(email);
    if (!storedData) {
      throw new Error("Doğrulama kodu bulunamadı. Lütfen önce kod isteyin.");
    }


    if (Date.now() > storedData.expiry) {
      verificationCodes.delete(email);
      throw new Error("Doğrulama kodunun süresi doldu. Lütfen yeni kod isteyin.");
    }


    if (storedData.attempts >= 5) {
      verificationCodes.delete(email);
      throw new Error("Çok fazla yanlış deneme. Lütfen yeni kod isteyin.");
    }


    if (storedData.code !== verificationCode) {
      storedData.attempts++;
      throw new Error("Doğrulama kodu hatalı");
    }


    verificationCodes.delete(email);


    const u = new User({ firstName, lastName, email, phone, password });
    await u.save();

    const token = sign(u);
    console.log(`✅ Yeni kullanıcı kayıt oldu: ${email}`);
    res.status(201).json({ token, user: u.safeJSON() });

  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const u = await User.findOne({ email });
  if (!u || !(await u.checkPassword(password)))
    return res.status(401).json({ error: "E-posta veya şifre hatalı" });

  const token = sign(u);
  res.json({ token, user: u.safeJSON() });
});

// google ile giris
router.post("/google", async (req, res) => {
  try {
    const { email, given_name, family_name, picture, sub } = req.body;

    if (!email) {
      return res.status(400).json({ error: "E-posta bilgisi gerekli" });
    }

    const googleId = sub;


    let user = await User.findOne({ email });

    if (!user) {

      user = new User({
        firstName: given_name || "Google",
        lastName: family_name || "Kullanıcı",
        email,
        googleId,
        profilePicture: picture,
        password: Math.random().toString(36).slice(-12) + "Aa1!",
        isGoogleUser: true
      });
      await user.save();
      console.log(`✅ Yeni Google kullanıcısı kayıt oldu: ${email}`);
    } else {

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


router.get("/me", auth(true), async (req, res) => {
  const u = await User.findById(req.user._id);
  if (!u) return res.status(404).json({ error: "Kullanıcı yok" });
  res.json(u.safeJSON());
});

router.put("/me", auth(true), async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;


    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (phone) updates.phone = phone;
    if (email) updates.email = email;


    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

    res.json({ message: "Güncellendi", user: updatedUser.safeJSON() });

  } catch (e) {

    if (e.code === 11000) {
      return res.status(400).json({ error: "Bu e-posta veya telefon numarası zaten kullanımda." });
    }
    res.status(400).json({ error: e.message });
  }
});

// sifremi unuttum


const resetCodes = new Map();
const RESET_CODE_EXPIRY = 10 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 3;

// sifre sifirlama kodu gonder
router.post("/forgot-password/send-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) throw new Error("E-posta adresi gerekli");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Geçersiz e-posta");


    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı");
    }


    const code = generateVerificationCode();


    resetCodes.set(email, {
      code,
      expiry: Date.now() + RESET_CODE_EXPIRY,
      attempts: 0
    });


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

// kod dogrula
router.post("/forgot-password/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) throw new Error("E-posta ve kod gerekli");

    const storedData = resetCodes.get(email);
    if (!storedData) {
      throw new Error("Doğrulama kodu bulunamadı. Lütfen yeni kod isteyin.");
    }


    if (Date.now() > storedData.expiry) {
      resetCodes.delete(email);
      throw new Error("Doğrulama kodunun süresi doldu. Lütfen yeni kod isteyin.");
    }


    if (storedData.attempts >= MAX_RESET_ATTEMPTS) {
      resetCodes.delete(email);
      throw new Error("3 yanlış deneme hakkınızı kullandınız. Lütfen yeni kod isteyin.");
    }


    if (storedData.code !== code) {
      storedData.attempts++;
      const remaining = MAX_RESET_ATTEMPTS - storedData.attempts;
      if (remaining <= 0) {
        resetCodes.delete(email);
        throw new Error("3 yanlış deneme hakkınızı kullandınız. Lütfen yeni kod isteyin.");
      }
      throw new Error(`Doğrulama kodu hatalı. Kalan hak: ${remaining}`);
    }


    storedData.verified = true;

    console.log(`✅ Şifre sıfırlama kodu doğrulandı: ${email}`);
    res.json({ message: "Kod doğrulandı. Şimdi yeni şifrenizi belirleyebilirsiniz." });

  } catch (e) {
    console.error("❌ Kod doğrulama hatası:", e.message);
    res.status(400).json({ error: e.message });
  }
});

// sifre guncelle
router.post("/forgot-password/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      throw new Error("Tüm alanlar gerekli");
    }


    if (newPassword.length < 6) {
      throw new Error("Şifre en az 6 karakter olmalı");
    }

    const storedData = resetCodes.get(email);
    if (!storedData) {
      throw new Error("Geçersiz istek. Lütfen işlemi baştan başlatın.");
    }


    if (!storedData.verified || storedData.code !== code) {
      throw new Error("Kod doğrulanmamış. Lütfen önce kodu doğrulayın.");
    }


    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }

    user.password = newPassword;
    await user.save();


    resetCodes.delete(email);

    console.log(`✅ Şifre başarıyla güncellendi: ${email}`);
    res.json({ message: "Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz." });

  } catch (e) {
    console.error("❌ Şifre güncelleme hatası:", e.message);
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;