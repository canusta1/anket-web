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
app.use("/api/ai", aiRoutes);                             // AI anket oluşturma

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Port Ayarı
const port = process.env.PORT || 4000;

const server = app.listen(port, function () {
  console.log(`🚀 Server ${port} portunda başladı`);
}).on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});