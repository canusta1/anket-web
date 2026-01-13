console.log("Booting server...");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const aiRoutes = require('./aiRoutes');
const http = require("http");

const app = express();

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Çok fazla istek gönderildi, lütfen sonra tekrar deneyin." }
});
app.use("/api", limiter);

const corsOptions = {
  origin: function (origin, callback) {
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

mongoose
  .connect(process.env.MONGODB_URI, { autoIndex: true })
  .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
  .catch((err) => {
    console.error("❌ MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  });

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/surveys", require("./routes/surveys"));
app.use("/api/responses", require("./routes/responses"));
app.use("/api/verification", require("./routes/verification"));
app.use("/api", require("./routes/geocoding"));
app.use("/api/places", require("./routes/places"));
app.use("/api/ai", aiRoutes);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Server hatasi"
  });
});

const port = process.env.PORT || 4000;
const host = process.env.HOST || '0.0.0.0';

const server = http.createServer({
  maxHeaderSize: 32768
}, app);

server.listen(port, host, function () {
  console.log(`🚀 Server ${host}:${port} portunda başladı`);
  console.log(`📱 Mobil erişim için: http://192.168.1.28:${port}`);
  console.log(`🌐 Geocoding API: http://192.168.1.28:${port}/api/geocode`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});