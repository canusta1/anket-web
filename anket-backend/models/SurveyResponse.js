// anket-backend/models/SurveyResponse.js

const mongoose = require("mongoose");

const SurveyResponseSchema = new mongoose.Schema(
  {
    // Hangi ankete verilen cevap
    anketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
      index: true
    },

    // Katılımcı bilgileri (ad, soyad, doğrulama kriterleri)
    katilimciBilgileri: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Her sorunun kendine ait cevapları
    // Örnek: { soruId1: "cevap1", soruId2: ["secenek1", "secenek2"] }
    cevaplar: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // Cevap gönderme tarihi
    olusturulmaTarihi: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SurveyResponse", SurveyResponseSchema);