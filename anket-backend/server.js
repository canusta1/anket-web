console.log("Booting server...");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const aiRoutes = require('./aiRoutes');

const app = express();

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// --- 0. Güvenlik Middleware'leri ---
app.use(helmet()); // HTTP başlıklarını güvenli hale getir

// Rate Limiting (DoS koruması)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP başına limit
  message: { error: "Çok fazla istek gönderildi, lütfen sonra tekrar deneyin." }
});
// Tüm API'lere uygula
app.use("/api", limiter);

// --- 1. CORS Ayarları (Mobil + Localhost için) ---
const corsOptions = {
  origin: function (origin, callback) {
    // origin undefined ise (postman, curl) veya izin verilen kaynaklardan biriyse
    const allowedOrigins = [
      'http://localhost:3000',
      'http://192.168.1.28:3000',
      'http://127.0.0.1:3000'
    ];

    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://192.168.')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// --- 2. JSON Parser ---
app.use(express.json());

// DB Bağlantısı
mongoose
  .connect(process.env.MONGODB_URI, { autoIndex: true })
  .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
  .catch((err) => {
    console.error("❌ MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  });

// Health Check
app.get("/health", (_req, res) => res.json({ ok: true }));

// ROUTES
app.use("/api/auth", require("./routes/auth"));           // kayıt / giriş / me
app.use("/api/surveys", require("./routes/surveys"));     // anket CRUD
app.use("/api/responses", require("./routes/responses")); // yanıt + istatistik
app.use("/api/verification", require("./routes/verification")); // Email doğrulama
app.use("/api", require("./routes/geocoding"));           // Geocoding API (Mevcut)

// --- YENİ EKLENEN ---
app.use("/api/places", require("./routes/places"));       // Google Places API (Autocomplete için)
// --------------------

app.use("/api/ai", aiRoutes);                             // AI anket oluşturma

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Error Handler (Global)
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Server hatası"
  });
});

// Port Ayarı
const port = process.env.PORT || 4000;
const host = process.env.HOST || '0.0.0.0';

const server = app.listen(port, host, function () {
  console.log(`🚀 Server ${host}:${port} portunda başladı`);
  console.log(`📱 Mobil erişim için: http://192.168.1.28:${port}`);
  console.log(`🌐 Geocoding API: http://192.168.1.28:${port}/api/geocode`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});