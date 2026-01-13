const mongoose = require("mongoose");

// secenek semasi
const SecenekSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    metni: { type: String, required: true }
  },
  { _id: true }
);

// soru semasi
const SoruSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    soruMetni: { type: String, required: [true, "Soru metni boş geçilemez"] },
    soruTipi: {
      type: String,
      enum: ["acik-uclu", "coktan-tek", "coktan-coklu", "slider", "coktan-secmeli", "cok-secmeli"],
      default: "acik-uclu"
    },
    secenekler: {
      type: [SecenekSchema],
      default: [],
      validate: {
        validator: function (val) {
          const secenekliTipler = ["coktan-tek", "coktan-coklu", "coktan-secmeli", "cok-secmeli"];
          if (secenekliTipler.includes(this.soruTipi)) {
            return Array.isArray(val) && val.length > 0;
          }
          return true;
        },
        message: "Çoktan seçmeli sorular için en az bir seçenek eklenmelidir."
      }
    },
    siraNo: { type: Number, default: 1 },
    minDegeri: Number,
    maxDegeri: Number,
    minEtiket: String,
    maxEtiket: String,
    gorselUrl: { type: String, default: null }
  },
  { _id: true, timestamps: true }
);

// anket semasi
const SurveySchema = new mongoose.Schema(
  {
    kullaniciId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    anketBaslik: { type: String, required: true },
    anketAciklama: { type: String, default: "" },
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

    // hedef kitle kriterleri
    hedefKitleKriterleri: {
      mail: { type: Boolean, default: false },
      mailUzantisi: { type: String, default: "" },
      tcNo: { type: Boolean, default: false },
      kimlikDogrulama: { type: Boolean, default: false },
      telefonNumarasi: { type: Boolean, default: false },
      konum: { type: Boolean, default: false },

      // konum kisitlamasi
      konumKisitlamasi: {
        tip: {
          type: String,
          enum: ["radius", "mahalle", "ilce", "sehir"],
          default: null
        },
        radiusMetre: { type: Number, default: null },
        anketKoordinatlari: {
          latitude: { type: Number, default: null },
          longitude: { type: Number, default: null }
        },
        adres: { type: String, default: "" },
        mahalle: { type: String, default: "" },
        ilce: { type: String, default: "" },
        sehir: { type: String, default: "" }
      }
    },

    durum: {
      type: String,
      enum: ["aktif", "pasif", "taslak"],
      default: "taslak",
      index: true
    },
    paylasimLinki: { type: String, default: "" },
    aiIleOlusturuldu: { type: Boolean, default: false },
    toplamCevapSayisi: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Survey", SurveySchema);