const mongoose = require("mongoose");

// anket cevaplari semasi
const SurveyResponseSchema = new mongoose.Schema(
  {
    anketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
      required: true,
      index: true
    },

    // katilimci bilgileri
    katilimciBilgileri: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // soru cevaplari
    cevaplar: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    olusturulmaTarihi: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SurveyResponse", SurveyResponseSchema);