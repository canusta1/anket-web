// anket-backend/routes/responses.js

const router = require("express").Router();
const SurveyResponse = require("../models/SurveyResponse");
const Survey = require("../models/Survey");
const auth = require("../middleware/auth");

// ============================================
// 1. TEK BİR CEVAP DETAYI
// ============================================
router.get("/:responseId", auth(true), async (req, res) => {
  try {
    const cevap = await SurveyResponse.findById(req.params.responseId);
    if (!cevap) {
      return res.status(404).json({
        success: false,
        error: "Cevap bulunamadı"
      });
    }

    // Güvenlik: Sadece sahibi görebilir
    const anket = await Survey.findById(cevap.anketId);
    if (!anket) {
      return res.status(404).json({
        success: false,
        error: "İlişkili anket bulunamadı"
      });
    }

    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Bu cevabı görüntüleme yetkiniz yok"
      });
    }

    res.json({
      success: true,
      data: cevap
    });
  } catch (e) {
    console.error("Cevap Detay Hatası:", e);
    res.status(400).json({
      success: false,
      error: e.message
    });
  }
});

// ============================================
// 2. CEVAP SİL (ANKET SAHİBİ İÇİN)
// ============================================
router.delete("/:responseId", auth(true), async (req, res) => {
  try {
    const cevap = await SurveyResponse.findById(req.params.responseId);
    if (!cevap) {
      return res.status(404).json({
        success: false,
        error: "Cevap bulunamadı"
      });
    }

    // Güvenlik: Sadece sahibi silebilir
    const anket = await Survey.findById(cevap.anketId);
    if (!anket) {
      return res.status(404).json({
        success: false,
        error: "İlişkili anket bulunamadı"
      });
    }

    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Bu cevabı silme yetkiniz yok"
      });
    }

    // Toplam cevap sayısını azalt
    anket.toplamCevapSayisi = Math.max(0, (anket.toplamCevapSayisi || 1) - 1);
    await anket.save();

    // Cevabı sil
    await SurveyResponse.findByIdAndDelete(req.params.responseId);

    res.status(204).end();
  } catch (e) {
    console.error("Cevap Silme Hatası:", e);
    res.status(400).json({
      success: false,
      error: e.message
    });
  }
});

module.exports = router;