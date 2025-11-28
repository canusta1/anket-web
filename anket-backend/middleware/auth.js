// anket-web/anket-backend/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = (required = true) => (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: "Sunucu yapılandırma hatası (JWT_SECRET eksik)" });
  }

  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;

  if (!token) return required ? res.status(401).json({ error: "Yetkisiz" }) : next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Geçersiz token" });
  }
};
