// anket-backend/models/Survey.js
const mongoose = require("mongoose");

const SoruSchema = new mongoose.Schema({
  soruId: { type: String, required: true },
  soruMetni: { type: String, required: true },
  soruTipi: { 
    type: String, 
    enum: ["acik-uclu", "coktan-tek", "coktan-coklu", "slider"], 
    required: true 
  },
  zorunlu: { type: Boolean, default: true },
  siraNo: { type: Number, required: true },
  
  // Çoktan seçmeli için seçenekler
  secenekler: [{
    secenekId: String,
    metin: String
  }],
  
  // Slider için
  sliderMin: { type: Number, default: null },
  sliderMax: { type: Number, default: null },
  sliderVarsayilan: { type: Number, default: null }
}, { _id: false });

const SurveySchema = new mongoose.Schema({
  kullaniciId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },
  anketBaslik: { type: String, required: true },
  anketAciklama: { type: String, default: "" },
  
  sorular: { type: [SoruSchema], default: [] },
  
  // Hedef kitle kriterleri
  hedefKitleKriterleri: {
    mail: { type: Boolean, default: false },
    mailUzantisi: { type: String, default: "" },
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
  toplamCevapSayisi: { type: Number, default: 0 },
  aiIleOlusturuldu: { type: Boolean, default: false },
  
  // ESKİ ALANLAR (geriye uyumluluk için - silebilirsin)
  title: { type: String },
  description: { type: String },
  questions: { type: Array },
  isPublished: { type: Boolean }
}, { timestamps: true });

// İndeksler
SurveySchema.index({ kullaniciId: 1, createdAt: -1 });
SurveySchema.index({ durum: 1 });

module.exports = mongoose.model("Survey", SurveySchema);