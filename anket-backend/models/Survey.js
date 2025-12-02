// anket-backend/models/Survey.js

const mongoose = require("mongoose");

const SecenekSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    },
    metni: {
      type: String,
      required: true
    }
  },
  { _id: true }
);

const SoruSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    },
    soruMetni: {
      type: String,
      required: [true, "Soru metni boş geçilemez"]
    },
    soruTipi: {
      type: String,
      enum: [
        "acik-uclu",        // Açık uçlu (textarea)
        "coktan-tek",       // Çoktan seçmeli - tek seçim (radio)
        "coktan-coklu",     // Çok seçmeli - birden fazla seçim (checkbox)
        "slider",           // Slider (opsiyonel - şimdilik desteklenmez)
        "coktan-secmeli",   // Eski format uyumluluğu için
        "cok-secmeli"       // Eski format uyumluluğu için
      ],
      default: "acik-uclu"
    },
    // Seçenekler - Sadece array şekilde
    secenekler: {
      type: [SecenekSchema],
      default: [],
      validate: {
        validator: function (val) {
          // Seçenekli soru tipleri için seçenek zorunlu
          const secenekliTipler = ["coktan-tek", "coktan-coklu", "coktan-secmeli", "cok-secmeli"];
          if (secenekliTipler.includes(this.soruTipi)) {
            return Array.isArray(val) && val.length > 0;
          }
          return true;
        },
        message: "Çoktan seçmeli sorular için en az bir seçenek eklenmelidir."
      }
    },
const SoruSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      auto: true
    },
    soruMetni: {
      type: String,
      required: [true, "Soru metni boş geçilemez"]
    },
    soruTipi: {
      type: String,
      enum: [
        "acik-uclu",        // Açık uçlu (textarea)
        "coktan-tek",       // Çoktan seçmeli - tek seçim (radio)
        "coktan-coklu",     // Çok seçmeli - birden fazla seçim (checkbox)
        "slider",           // Slider (opsiyonel - şimdilik desteklenmez)
        "coktan-secmeli",   // Eski format uyumluluğu için
        "cok-secmeli"       // Eski format uyumluluğu için
      ],
      default: "acik-uclu"
    },
    // Seçenekler - Sadece array şekilde
    secenekler: {
      type: [SecenekSchema],
      default: [],
      validate: {
        validator: function (val) {
          // Seçenekli soru tipleri için seçenek zorunlu
          const secenekliTipler = ["coktan-tek", "coktan-coklu", "coktan-secmeli", "cok-secmeli"];
          if (secenekliTipler.includes(this.soruTipi)) {
            return Array.isArray(val) && val.length > 0;
          }
          return true;
        },
        message: "Çoktan seçmeli sorular için en az bir seçenek eklenmelidir."
      }
    },
    siraNo: {
      type: Number,
      default: 1
    }
  },
  { _id: true, timestamps: true }
);

const SurveySchema = new mongoose.Schema(
  {
    kullaniciId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    anketBaslik: {
      type: String,
      required: true
    },
    anketAciklama: {
      type: String,
      default: ""
    },
    sorular: {
      type: [SoruSchema],
      default: [],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length > 0;
        },
        message: "Anket oluşturmak için en az bir soru eklenmelidir."
      }
    },
    hedefKitleKriterleri: {
      mail: { type: Boolean, default: false },
      tcNo: { type: Boolean, default: false },
      konum: { type: Boolean, default: false },
      kimlikDogrulama: { type: Boolean, default: false }
    },
    durum: {
      type: String,
      enum: ["aktif", "pasif", "taslak"],
      default: "taslak",
      index: true
    },
    paylasimLinki: {
      type: String,
      default: ""
    },
    aiIleOlusturuldu: {
      type: Boolean,
      default: false
    },
    toplamCevapSayisi: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Survey", SurveySchema);