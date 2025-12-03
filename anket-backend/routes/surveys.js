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

  return (sorular || []).map((soru, index) => {
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
    const formatlıSecenekler = secenekler
      .map((opt) => {
        if (typeof opt === "object" && opt !== null) {
          // Obje ise metni/metin alanını al
          const metinDegeri = opt.metni || opt.metin || opt.text || '';
          return { metni: metinDegeri };
        } else if (typeof opt === "string") {
          return { metni: opt };
        }
        return { metni: String(opt) };
      })
      .filter((opt) => opt.metni && opt.metni.trim().length > 0); // Boş seçenekleri filtrele

    // Soru tipini normalize et - soruTipi veya tip alanını kontrol et
    let normalizedTipi = soru.soruTipi || soru.tip || "acik-uclu";
    if (tipiHaritas[normalizedTipi]) {
      normalizedTipi = tipiHaritas[normalizedTipi];
    }

    return {
      soruMetni: soru.soruMetni || "",
      soruTipi: normalizedTipi,
      secenekler: formatlıSecenekler,
      siraNo: soru.siraNo || (index + 1),
      zorunlu: soru.zorunlu !== undefined ? soru.zorunlu : true
    };
  });
}

// ============================================
// ⭐ ÖNEMLI: by-link ROUTE'U İLK YAZILMALI ⭐
// ============================================
// 4. ANKETİ KATILIMCIYA GETİR (LİNK KODU İLE) - PUBLIC ROUTE
// ============================================
router.get("/by-link/:linkKodu", async (req, res) => {
  try {
    const { linkKodu } = req.params;

    console.log("🔍 Link kodu aranıyor:", linkKodu);

    // Link kontrol et
    const link = await SurveyLink.findOne({ linkKodu, aktif: true });

    if (!link) {
      console.log("❌ Link bulunamadı");
      return res.status(404).json({
        success: false,
        error: "Geçersiz veya süresi dolmuş anket linki."
      });
    }

    console.log("✅ Link bulundu:", link._id);

    // Tıklanma istatistiğini güncelle
    link.tiklanmaSayisi += 1;
    link.sonTiklanmaTarihi = new Date();
    await link.save();

    // Anketi getir
    const anket = await Survey.findById(link.anketId);

    if (!anket || anket.durum !== "aktif") {
      console.log("❌ Anket bulunamadı veya pasif");
      return res.status(404).json({
        success: false,
        error: "Bu anket yayından kaldırılmış."
      });
    }

    console.log("✅ Anket bulundu, katılımcıya gönderiliyor");

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
    console.error("❌ Link Getirme Hatası:", e);
    res.status(400).json({ success: false, error: "Sunucu hatası" });
  }
});

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

    console.log("📝 Gelen Sorular (Ham):", JSON.stringify(sorular, null, 2));

    // Soruları temizle ve standardize et
    const islenmisSorular = temizleSorular(sorular);

    console.log("✅ İşlenmiş Sorular:", JSON.stringify(islenmisSorular, null, 2));

    // Link kodunu oluştur
    const linkKodu = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Request'in geldikği origin'den URL al (localhost vs IP)
    const requestOrigin = req.get('origin') || req.get('referer') || `http://${req.get('host')}`;
    const baseUrl = requestOrigin.split('/').slice(0, 3).join('/'); // Protocol + Host + Port
    const tamLink = `${baseUrl}/anket-coz/${linkKodu}`;

    console.log("🌐 Request Origin:", requestOrigin);
    console.log("🔗 Oluşturulan Link:", tamLink);

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

    // Her anket için SurveyLink'ten tamLink'i al
    const itemsWithLinks = await Promise.all(
      items.map(async (item) => {
        const link = await SurveyLink.findOne({ anketId: item._id });
        return {
          ...item.toObject(),
          paylasimLinki: link ? link.tamLink : item.paylasimLinki
        };
      })
    );

    res.json({ success: true, data: itemsWithLinks });
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
// 5. CEVAPLARI KAYDET (SUBMIT) - PUBLIC ROUTE
// ============================================
router.post("/submit", async (req, res) => {
  try {
    const { anketId, cevaplar, katilimciBilgileri, dogrulamaBilgileri } = req.body;

    // Katılımcı bilgilerini birleştir
    const birlestirilenBilgiler = {
      ...katilimciBilgileri,
      ...dogrulamaBilgileri
    };

    console.log('[Submit] Gelen katilimciBilgileri:', JSON.stringify(katilimciBilgileri, null, 2));
    console.log('[Submit] Gelen dogrulamaBilgileri:', JSON.stringify(dogrulamaBilgileri, null, 2));
    console.log('[Submit] Birleştirilen bilgiler:', JSON.stringify(birlestirilenBilgiler, null, 2));

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
      katilimciBilgileri: birlestirilenBilgiler,
      cevaplar: cevaplar
    });

    const kaydedilenCevap = await yeniCevap.save();

    // Anketin toplam cevap sayısını artır
    anket.toplamCevapSayisi = (anket.toplamCevapSayisi || 0) + 1;
    await anket.save();

    console.log("✅ Cevaplar Kaydedildi. ID:", kaydedilenCevap._id);
    console.log("[Submit] Kaydedilen katilimciBilgileri:", JSON.stringify(kaydedilenCevap.katilimciBilgileri, null, 2));

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