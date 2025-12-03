// anket-backend/models/SurveyLink.js
const mongoose = require("mongoose");

const SurveyLinkSchema = new mongoose.Schema({
  anketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Survey",
    required: true,
    index: true
  },
  kullaniciId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  linkKodu: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  tamLink: {
    type: String,
    required: true
  },
  aktif: {
    type: Boolean,
    default: true,
    index: true
  },
  sonKullanmaTarihi: {
    type: Date,
    default: null
  },
  maksimumCevapSayisi: {
    type: Number,
    default: null
  },
  suankiCevapSayisi: {
    type: Number,
    default: 0
  },
  tiklanmaSayisi: {
    type: Number,
    default: 0
  },
  tamamlananCevapSayisi: {
    type: Number,
    default: 0
  },
  yarimBirakilanSayisi: {
    type: Number,
    default: 0
  },
  sonTiklanmaTarihi: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model("SurveyLink", SurveyLinkSchema);