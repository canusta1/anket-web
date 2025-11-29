// anket-backend/routes/surveys.js

const router = require("express").Router();
const Survey = require("../models/Survey");
const SurveyLink = require("../models/SurveyLink"); // İstatistik tutmak için
const auth = require("../middleware/auth");

// Frontend'in çalıştığı adres.
// Linkler katılımcılara gönderileceği için bu adres FRONTEND adresi olmalıdır.
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:51900";

// ============================================
// 1. ANKET OLUŞTUR (OTOMATİK LİNK ÜRETİMİ İLE)
// ============================================
router.post("/", auth(true), async (req, res) => {
  try {
    const {
      anketBaslik,
      anketAciklama,
      sorular,
      hedefKitleKriterleri,
      aiIleOlusturuldu
    } = req.body;

    // 1. Rastgele Link Kodu Üret (Örn: X7A9B2)
    const linkKodu = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 2. Tam Linki Oluştur
    // Örn: http://localhost:3000/anket-coz/X7A9B2 (React tarafındaki route ile uyumlu olmalı)
    const tamLink = `${CLIENT_URL}/anket-coz/${linkKodu}`;

    // 3. Anketi Hazırla (paylasimLinki alanını BURADA dolduruyoruz)
    const newSurvey = new Survey({
      kullaniciId: req.user._id,
      anketBaslik,
      anketAciklama,
      sorular,
      hedefKitleKriterleri,
      aiIleOlusturuldu: aiIleOlusturuldu || false,
      durum: "aktif",
      paylasimLinki: tamLink // <--- İŞTE BURASI ÖNEMLİ, DB'ye YAZILACAK
    });

    // 4. İstatistikler için SurveyLink tablosuna da kayıt atıyoruz
    await SurveyLink.create({
      anketId: newSurvey._id,
      kullaniciId: req.user._id,
      linkKodu: linkKodu,
      tamLink: tamLink,
      aktif: true
    });

    // 5. Anketi Kaydet
    const savedSurvey = await newSurvey.save();

    console.log("✅ Anket Oluşturuldu. Link:", tamLink);

    // 6. Frontend'e Cevap Dön
    res.status(201).json({
      success: true,
      message: "Anket başarıyla oluşturuldu.",
      data: savedSurvey // Frontend buradan paylasimLinki'ni alacak
    });

  } catch (e) {
    console.error("❌ Anket Oluşturma Hatası:", e);
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 2. KULLANICININ ANKETLERİNİ LİSTELE
// ============================================
router.get("/", auth(true), async (req, res) => {
  try {
    const items = await Survey.find({ kullaniciId: req.user._id })
      .sort({ createdAt: -1 })
      .select("anketBaslik durum toplamCevapSayisi createdAt paylasimLinki");

    res.json({ success: true, data: items });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 3. TEK ANKET DETAYI (YÖNETİCİ İÇİN)
// ============================================
router.get("/:id", auth(true), async (req, res) => {
  try {
    const item = await Survey.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: "Anket bulunamadı" });

    // Güvenlik kontrolü: Sadece sahibi görebilir
    if (item.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Bu anketi görüntüleme yetkiniz yok" });
    }

    res.json({ success: true, data: item });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 4. ANKETİ KATILIMCIYA GETİR (LİNK KODU İLE)
// ============================================
// Bu route Public'tir (Auth middleware yok), giriş yapmadan çalışır.
router.get("/by-link/:linkKodu", async (req, res) => {
  try {
    const { linkKodu } = req.params;

    // A) Link tablosundan kodu kontrol et
    const link = await SurveyLink.findOne({ linkKodu, aktif: true });

    if (!link) {
      return res.status(404).json({
        success: false,
        error: "Geçersiz veya süresi dolmuş anket linki."
      });
    }

    // B) İstatistik: Tıklanma sayısını artır
    link.tiklanmaSayisi += 1;
    link.sonTiklanmaTarihi = new Date();
    await link.save();

    // C) Asıl anketi bul
    const anket = await Survey.findById(link.anketId);

    if (!anket || anket.durum !== "aktif") {
      return res.status(404).json({
        success: false,
        error: "Bu anket yayından kaldırılmış."
      });
    }

    // D) Katılımcıya dönülecek veriyi hazırla
    res.json({
      success: true,
      data: {
        _id: anket._id,
        anketBaslik: anket.anketBaslik,
        anketAciklama: anket.anketAciklama,
        sorular: anket.sorular,
        hedefKitleKriterleri: anket.hedefKitleKriterleri,
        paylasimLinki: link.tamLink
      }
    });

  } catch (e) {
    console.error("Link Getirme Hatası:", e);
    res.status(400).json({ success: false, error: "Sunucu hatası" });
  }
});

// ============================================
// 5. CEVAPLARI KAYDET (SUBMIT)
// ============================================
// Katılımcı "Gönder" butonuna bastığında burası çalışır
router.post("/submit", async (req, res) => {
  try {
    const { anketId, cevaplar, katilimciBilgileri } = req.body;

    // Anketi bul
    const anket = await Survey.findById(anketId);
    if (!anket) return res.status(404).json({ error: "Anket bulunamadı" });

    // Basitçe toplam cevap sayısını artırıyoruz
    // İleride detaylı cevapları "SurveyResponse" modeline kaydedeceğiz.
    anket.toplamCevapSayisi = (anket.toplamCevapSayisi || 0) + 1;
    await anket.save();

    res.json({ success: true, message: "Cevaplarınız başarıyla kaydedildi." });
  } catch (e) {
    console.error("Cevap Kayıt Hatası:", e);
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 6. ANKET SİL
// ============================================
router.delete("/:id", auth(true), async (req, res) => {
  try {
    const anket = await Survey.findById(req.params.id);
    if (!anket) return res.status(404).json({ success: false, error: "Bulunamadı" });

    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Yetkiniz yok" });
    }

    // Ankete bağlı linkleri de temizle
    await SurveyLink.deleteMany({ anketId: req.params.id });

    // Anketi sil
    await Survey.findByIdAndDelete(req.params.id);

    res.status(204).end();
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;