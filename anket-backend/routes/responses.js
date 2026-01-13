const router = require("express").Router();
const SurveyResponse = require("../models/SurveyResponse");
const Survey = require("../models/Survey");
const auth = require("../middleware/auth");

// tek bir cevap detayi
router.get("/:responseId", auth(true), async (req, res) => {
  try {
    const cevap = await SurveyResponse.findById(req.params.responseId);
    if (!cevap) {
      return res.status(404).json({
        success: false,
        error: "Cevap bulunamadı"
      });
    }

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

// cevap sil
router.delete("/:responseId", auth(true), async (req, res) => {
  try {
    const cevap = await SurveyResponse.findById(req.params.responseId);
    if (!cevap) {
      return res.status(404).json({
        success: false,
        error: "Cevap bulunamadı"
      });
    }

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

    anket.toplamCevapSayisi = Math.max(0, (anket.toplamCevapSayisi || 1) - 1);
    await anket.save();

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