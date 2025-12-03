console.log("Booting server...");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const aiRoutes = require('./aiRoutes');

const app = express();

// --- 1. CORS Ayarları ---
app.use(cors());

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