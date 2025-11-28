// anket-backend/routes/surveys.js
const router = require("express").Router();
const Survey = require("../models/Survey");
const SurveyLink = require("../models/SurveyLink");
const auth = require("../middleware/auth");

// ============================================
// ANKET OLUŞTUR (Yeni yapıya göre)
// ============================================
router.post("/", auth(true), async (req, res) => {
  try {
    const { anketBaslik, sorular, hedefKitleKriterleri, aiIleOlusturuldu } = req.body;
    
    const created = await Survey.create({
      kullaniciId: req.user._id,
      anketBaslik,
      sorular,
      hedefKitleKriterleri,
      aiIleOlusturuldu: aiIleOlusturuldu || false,
      durum: "taslak"
    });
    
    res.status(201).json({ success: true, data: created });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// ANKET LİNKİ OLUŞTUR
// ============================================
router.post("/:id/create-link", auth(true), async (req, res) => {
  try {
    const anketId = req.params.id;
    
    // Anket kontrolü
    const anket = await Survey.findById(anketId);
    if (!anket) {
      return res.status(404).json({ success: false, error: "Anket bulunamadı" });
    }
    
    // Kullanıcı kontrolü
    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Yetkiniz yok" });
    }
    
    // Benzersiz link kodu oluştur
    const linkKodu = Math.random().toString(36).substring(2, 10).toUpperCase();
    const tamLink = `http://localhost:3004/anket/${linkKodu}`;
    
    // Link oluştur
    const yeniLink = await SurveyLink.create({
      anketId,
      kullaniciId: req.user._id,
      linkKodu,
      tamLink,
      aktif: true
    });
    
    // Anketi aktif yap
    await Survey.findByIdAndUpdate(anketId, { durum: "aktif" });
    
    res.status(201).json({
      success: true,
      data: {
        linkKodu,
        tamLink,
        linkId: yeniLink._id
      }
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// KULLANICININ ANKETLERİNİ GETİR
// ============================================
router.get("/", auth(true), async (req, res) => {
  try {
    const items = await Survey.find({ kullaniciId: req.user._id })
      .sort({ createdAt: -1 })
      .select("anketBaslik durum toplamCevapSayisi createdAt");
    
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// TEK ANKET GETİR (ID ile)
// ============================================
router.get("/:id", async (req, res) => {
  try {
    const item = await Survey.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: "Bulunamadı" });
    res.json({ success: true, data: item });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// ANKET BİLGİLERİNİ GETİR (Link Kodu ile - Katılımcılar için)
// ============================================
router.get("/by-link/:linkKodu", async (req, res) => {
  try {
    const { linkKodu } = req.params;
    
    // Link'i bul
    const link = await SurveyLink.findOne({ linkKodu, aktif: true });
    
    if (!link) {
      return res.status(404).json({
        success: false,
        error: "Anket bulunamadı veya artık aktif değil"
      });
    }
    
    // Tıklanma sayısını artır
    link.tiklanmaSayisi += 1;
    link.sonTiklanmaTarihi = new Date();
    await link.save();
    
    // Anketi getir
    const anket = await Survey.findById(link.anketId);
    
    if (!anket || anket.durum !== "aktif") {
      return res.status(404).json({
        success: false,
        error: "Anket bulunamadı veya aktif değil"
      });
    }
    
    res.json({
      success: true,
      data: {
        anketId: anket._id,
        anketBaslik: anket.anketBaslik,
        anketAciklama: anket.anketAciklama,
        sorular: anket.sorular,
        hedefKitleKriterleri: anket.hedefKitleKriterleri,
        linkId: link._id
      }
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// ANKET GÜNCELLE
// ============================================
router.patch("/:id", auth(true), async (req, res) => {
  try {
    const anket = await Survey.findById(req.params.id);
    if (!anket) {
      return res.status(404).json({ success: false, error: "Bulunamadı" });
    }
    
    // Kullanıcı kontrolü
    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Yetkiniz yok" });
    }
    
    const updated = await Survey.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// ANKET SİL
// ============================================
router.delete("/:id", auth(true), async (req, res) => {
  try {
    const anket = await Survey.findById(req.params.id);
    if (!anket) {
      return res.status(404).json({ success: false, error: "Bulunamadı" });
    }
    
    // Kullanıcı kontrolü
    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Yetkiniz yok" });
    }
    
    await Survey.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;