// anket-backend/models/Response.js
const mongoose = require("mongoose");

const CevapSchema = new mongoose.Schema({
  soruId: { type: String, required: true },

  // DİKKAT: Metin, Seçenek vs. yerine sadece şifreli veri tutuyoruz.
  // İçinde ne yazdığını (string, array, number) sadece şifreyi çözen bilir.
  sifreliData: { type: String, required: true }, // Cevabın şifrelenmiş hali
  iv: { type: String, required: true }          // Şifre çözücü vektör

}, { _id: false });

const ResponseSchema = new mongoose.Schema({
  anketId: { type: mongoose.Schema.Types.ObjectId, ref: "Survey", required: true },

  // Katılımcı bilgileri de şifrelenebilir ama arama yapmak istiyorsan açık kalabilir
  katilimciBilgileri: {
    ipAdresi: String,
    // Mail, TC gibi hassas veriler de şifreli alana taşınmalı
    hassasVeriSifreli: String,
    hassasVeriIV: String
  },

  cevaplar: [CevapSchema], // Yukarıdaki şifreli şema

  baslamaTarihi: { type: Date, default: Date.now },
  tamamlandi: { type: Boolean, default: false }

}, { timestamps: true });

module.exports = mongoose.model("Response", ResponseSchema);