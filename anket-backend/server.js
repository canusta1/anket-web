// anket-web/anket-backend/server.js
console.log("Booting server...");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middlewares
app.use(express.json());
app.use(
  cors({
    origin:
      (process.env.ALLOWED_ORIGIN &&
        process.env.ALLOWED_ORIGIN.split(",").map((s) => s.trim())) || "*",
  })
);

// DB
mongoose
  .connect(process.env.MONGODB_URI, { autoIndex: true })
  .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
  .catch((err) => {
    console.error("❌ MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  });

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// ROUTES —— BURASI ÖNEMLİ
app.use("/api/auth", require("./routes/auth"));           // kayıt / giriş / me
app.use("/api/surveys", require("./routes/surveys"));     // anket CRUD
app.use("/api/responses", require("./routes/responses")); // yanıt + istatistik

// 404 (opsiyonel)
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Server
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`🚀 Server ${port} portunda`));
