// anket-backend/routes/surveys.js

const router = require("express").Router();
const Survey = require("../models/Survey");
const SurveyLink = require("../models/SurveyLink");
const SurveyResponse = require("../models/SurveyResponse");
const auth = require("../middleware/auth");

// Frontend'in çalıştığı adres
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:51900";

// ============================================
// VERİ TEMIZLEME FONKSİYONU
// ============================================
function temizleSorular(sorular) {
  // Soru tipi haritası - Frontend formatından Backend formatına
  const tipiHaritas = {
    "acik-uclu": "acik-uclu",
    "coktan-tek": "coktan-tek",
    "coktan-coklu": "coktan-coklu",
    "slider": "slider",
    "açık-uçlu": "acik-uclu",
    "çoktan-seçmeli": "coktan-tek",
    "çok-seçmeli": "coktan-coklu"
  };

  return (sorular || []).map((soru) => {
    let secenekler = soru.secenekler || [];

    // Eğer seçenekler string ise (virgülü ayırılmış), diziye çevir
    if (typeof secenekler === "string") {
      secenekler = secenekler
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }

    // Eğer dizi değilse, boş array yap
    if (!Array.isArray(secenekler)) {
      secenekler = [];
    }

    // Seçenekleri standart formata çevir { metni: string }
    const formatlıSecenekler = secenekler.map((opt) => {
      if (typeof opt === "object" && opt !== null && opt.metni) {
        // Zaten doğru formatta
        return { metni: opt.metni };
      } else if (typeof opt === "string") {
        // String ise objeye çevir
        return { metni: opt };
      }
      return { metni: String(opt) };
    });

    // Soru tipini normalize et
    let normalizedTipi = soru.soruTipi || "acik-uclu";
    if (tipiHaritas[normalizedTipi]) {
      normalizedTipi = tipiHaritas[normalizedTipi];
    }

    return {
      soruMetni: soru.soruMetni || "",
      soruTipi: normalizedTipi,
      secenekler: formatlıSecenekler,
      siraNo: soru.siraNo || 1
    };
  });
}

// ============================================
// 1. ANKET OLUŞTUR
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

    // Soruları temizle ve standardize et
    const islenmisSorular = temizleSorular(sorular);

    // Link kodunu oluştur
    const linkKodu = Math.random().toString(36).substring(2, 10).toUpperCase();
    const tamLink = `${CLIENT_URL}/anket-coz/${linkKodu}`;

    // Anketi oluştur
    const newSurvey = new Survey({
      kullaniciId: req.user._id,
      anketBaslik,
      anketAciklama,
      sorular: islenmisSorular,
      hedefKitleKriterleri,
      aiIleOlusturuldu: aiIleOlusturuldu || false,
      durum: "aktif",
      paylasimLinki: tamLink
    });

    // SurveyLink kaydı oluştur
    await SurveyLink.create({
      anketId: newSurvey._id,
      kullaniciId: req.user._id,
      linkKodu: linkKodu,
      tamLink: tamLink,
      aktif: true,
      tiklanmaSayisi: 0
    });

    // Anketi kaydet
    const savedSurvey = await newSurvey.save();

    console.log("✅ Anket Oluşturuldu. Link:", tamLink);

    res.status(201).json({
      success: true,
      message: "Anket başarıyla oluşturuldu.",
      data: savedSurvey
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
      .select(
        "anketBaslik anketAciklama sorular durum toplamCevapSayisi createdAt paylasimLinki aiIleOlusturuldu"
      );

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
    if (!item)
      return res.status(404).json({ success: false, error: "Anket bulunamadı" });

    // Güvenlik kontrolü
    if (item.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Bu anketi görüntüleme yetkiniz yok"
      });
    }

    res.json({ success: true, data: item });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 4. ANKETİ KATILIMCIYA GETİR (LİNK KODU İLE)
// ============================================
// PUBLIC ROUTE - Auth gerekli DEĞİL
router.get("/by-link/:linkKodu", async (req, res) => {
  try {
    const { linkKodu } = req.params;

    // Link kontrol et
    const link = await SurveyLink.findOne({ linkKodu, aktif: true });

    if (!link) {
      return res.status(404).json({
        success: false,
        error: "Geçersiz veya süresi dolmuş anket linki."
      });
    }

    // Tıklanma istatistiğini güncelle
    link.tiklanmaSayisi += 1;
    link.sonTiklanmaTarihi = new Date();
    await link.save();

    // Anketi getir
    const anket = await Survey.findById(link.anketId);

    if (!anket || anket.durum !== "aktif") {
      return res.status(404).json({
        success: false,
        error: "Bu anket yayından kaldırılmış."
      });
    }

    // Katılımcıya döndür
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
// PUBLIC ROUTE - Auth gerekli DEĞİL
router.post("/submit", async (req, res) => {
  try {
    const { anketId, cevaplar, katilimciBilgileri } = req.body;

    if (!anketId || !cevaplar) {
      return res.status(400).json({
        success: false,
        error: "anketId ve cevaplar zorunludur"
      });
    }

    // Anketi bul
    const anket = await Survey.findById(anketId);
    if (!anket) {
      return res.status(404).json({
        success: false,
        error: "Anket bulunamadı"
      });
    }

    // Yeni cevabı kaydet
    const yeniCevap = new SurveyResponse({
      anketId: anketId,
      katilimciBilgileri: katilimciBilgileri || {},
      cevaplar: cevaplar
    });

    const kaydedilenCevap = await yeniCevap.save();

    // Anketin toplam cevap sayısını artır
    anket.toplamCevapSayisi = (anket.toplamCevapSayisi || 0) + 1;
    await anket.save();

    console.log("✅ Cevaplar Kaydedildi. ID:", kaydedilenCevap._id);

    res.status(201).json({
      success: true,
      message: "Cevaplarınız başarıyla kaydedildi.",
      data: kaydedilenCevap
    });
  } catch (e) {
    console.error("❌ Cevap Kayıt Hatası:", e);
    res.status(400).json({
      success: false,
      error: e.message
    });
  }
});

// ============================================
// 6. ANKET SİL
// ============================================
router.delete("/:id", auth(true), async (req, res) => {
  try {
    const anket = await Survey.findById(req.params.id);
    if (!anket)
      return res.status(404).json({ success: false, error: "Bulunamadı" });

    // Güvenlik kontrolü
    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Yetkiniz yok" });
    }

    // İlişkili linkleri sil
    await SurveyLink.deleteMany({ anketId: req.params.id });

    // Anketi sil
    await Survey.findByIdAndDelete(req.params.id);

    res.status(204).end();
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 7. CEVAPLARI GÖRÜNTÜLE (YÖNETİCİ İÇİN)
// ============================================
router.get("/:id/responses", auth(true), async (req, res) => {
  try {
    // Güvenlik kontrolü
    const anket = await Survey.findById(req.params.id);
    if (!anket) {
      return res.status(404).json({
        success: false,
        error: "Anket bulunamadı"
      });
    }

    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Bu anketi görüntüleme yetkiniz yok"
      });
    }

    // Cevapları getir
    const cevaplar = await SurveyResponse.find({ anketId: req.params.id })
      .sort({ olusturulmaTarihi: -1 });

    res.json({
      success: true,
      data: cevaplar,
      toplam: cevaplar.length
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message
    });
  }
});

module.exports = router;