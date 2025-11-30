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
  secenekler: {
    type: [{ secenekId: String, metin: String }],
    validate: [
      function (val) {
        // 'this' SoruSchema'nın kendisini ifade eder.
        const coktanSecmeliTipler = ["coktan-tek", "coktan-coklu"];
        // Eğer soru tipi çoktan seçmeli ise ve seçenek yoksa veya boşsa, validasyon hatası ver.
        return !(coktanSecmeliTipler.includes(this.soruTipi) && (!val || val.length === 0));
      },
      'Çoktan seçmeli sorular için en az bir seçenek eklenmelidir.'
    ]
  },
  sliderMin: {
    type: Number,
    required: [function () { return this.soruTipi === 'slider'; }, 'Slider tipi sorular için minimum değer zorunludur.']
  },
  sliderMax: {
    type: Number,
    required: [function () { return this.soruTipi === 'slider'; }, 'Slider tipi sorular için maksimum değer zorunludur.']
  }
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

  // ÖNEMLİ KISIM BURASI:
  paylasimLinki: { type: String }, // Link burada tutulacak

  aiIleOlusturuldu: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Survey", SurveySchema);