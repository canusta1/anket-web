// anket-backend/models/Response.js
const mongoose = require("mongoose");

const CevapSchema = new mongoose.Schema({
  soruId: { type: String, required: true },
  soruMetni: { type: String, required: true },
  soruTipi: {
    type: String,
    enum: ["acik-uclu", "coktan-tek", "coktan-coklu", "slider"],
    required: true
  },
  
  // Çoktan seçmeli TEK cevap için
  secilenSecenekId: { type: String, default: null },
  secilenSecenekMetni: { type: String, default: null },
  
  // Çoktan seçmeli ÇOKLU cevap için
  secilenSecenekler: [{
    secenekId: String,
    metin: String
  }],
  
  // Açık uçlu cevap için
  acikUcluCevap: { type: String, default: null },
  
  // Slider cevap için
  sliderDegeri: { type: Number, default: null },
  
  // ESKİ ALANLAR (geriye uyumluluk için)
  questionIndex: { type: Number },
  value: mongoose.Schema.Types.Mixed
}, { _id: false });

const ResponseSchema = new mongoose.Schema({
  anketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Survey",
    required: true,
    index: true
  },
  linkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SurveyLink"
  },
  
  // Katılımcı bilgileri (hedef kitle kriterlerine göre)
  katilimciBilgileri: {
    email: { type: String, default: null },
    tcKimlikNo: { type: String, default: null },
    konum: { type: String, default: null },
    kimlikBelgesiUrl: { type: String, default: null },
    ipAdresi: { type: String },
    tarayici: { type: String },
    cihazTipi: { type: String }
  },
  
  cevaplar: { type: [CevapSchema], default: [] },
  
  baslamaTarihi: { type: Date, required: true },
  bitirmeTarihi: { type: Date },
  tamamlanmaSuresi: { type: Number, default: null }, // Saniye cinsinden
  tamamlandi: { type: Boolean, default: false, index: true },
  
  // ESKİ ALANLAR (geriye uyumluluk için)
  surveyId: { type: mongoose.Schema.Types.ObjectId, ref: "Survey" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  answers: { type: Array }
}, { timestamps: true });

// İndeksler
ResponseSchema.index({ anketId: 1, createdAt: -1 });
ResponseSchema.index({ linkId: 1 });
ResponseSchema.index({ tamamlandi: 1 });
ResponseSchema.index({ surveyId: 1, createdAt: -1 }); // ESKİ alan için

module.exports = mongoose.model("Response", ResponseSchema);