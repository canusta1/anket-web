// anket-web/anket-backend/routes/auth.js
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

function sign(u) {
  return jwt.sign(
    { _id: u._id, email: u.email, roles: u.roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "7d" }
  );
}

// Kayıt
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, tckn, password } = req.body;

    // basit doğrulamalar
    if (!firstName || !lastName || !email || !password)
      throw new Error("Zorunlu alanlar eksik");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Geçersiz e-posta");
    if (tckn && !/^\d{11}$/.test(tckn)) throw new Error("TCKN 11 haneli olmalı");
    if (password.length < 6) throw new Error("Şifre min 6 karakter");

    const u = new User({ firstName, lastName, email, phone, password });
    if (tckn) u.tckn = tckn; // sanal setter şifreler
    await u.save();

    const token = sign(u);
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

// Oturum sahibi
router.get("/me", auth(true), async (req, res) => {
  const u = await User.findById(req.user._id);
  if (!u) return res.status(404).json({ error: "Kullanıcı yok" });
  res.json(u.safeJSON());
});

module.exports = router;
