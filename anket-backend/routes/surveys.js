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

    if (typeof secenekler === "string") {
      secenekler = secenekler.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    }
    if (!Array.isArray(secenekler)) {
      secenekler = [];
    }

    const formatlıSecenekler = secenekler
      .map((opt) => {
        if (typeof opt === "object" && opt !== null) {
          return { metni: opt.metni || opt.metin || opt.text || '' };
        }
        return { metni: String(opt) };
      })
      .filter((opt) => opt.metni && opt.metni.trim().length > 0);

    let normalizedTipi = soru.soruTipi || soru.tip || "acik-uclu";
    if (tipiHaritas[normalizedTipi]) {
      normalizedTipi = tipiHaritas[normalizedTipi];
    }

    return {
      soruMetni: soru.soruMetni || "",
      soruTipi: normalizedTipi,
      secenekler: formatlıSecenekler,
      siraNo: soru.siraNo || (index + 1),
      minDegeri: soru.minDegeri,
      maxDegeri: soru.maxDegeri,
      minEtiket: soru.minEtiket,
      maxEtiket: soru.maxEtiket,
      zorunlu: soru.zorunlu !== undefined ? soru.zorunlu : true
    };
  });
}

// ============================================
// HAVERSINE MESAFE FORMÜLÜ (METRE CİNSİNDEN)
// ============================================
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Dünya yarıçapı (metre)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================
// 1. ANKETİ KATILIMCIYA GETİR (LİNK KODU İLE)
// ============================================
router.get("/by-link/:linkKodu", async (req, res) => {
  try {
    const { linkKodu } = req.params;
    console.log("🔍 Link kodu aranıyor:", linkKodu);

    const link = await SurveyLink.findOne({ linkKodu, aktif: true });
    if (!link) {
      console.log("❌ Link bulunamadı");
      return res.status(404).json({ success: false, error: "Geçersiz veya süresi dolmuş anket linki." });
    }

    link.tiklanmaSayisi += 1;
    link.sonTiklanmaTarihi = new Date();
    await link.save();

    const anket = await Survey.findById(link.anketId);
    if (!anket || anket.durum !== "aktif") {
      return res.status(404).json({ success: false, error: "Bu anket yayından kaldırılmış." });
    }

    res.json({
      success: true,
      data: {
        _id: anket._id,
        anketBaslik: anket.anketBaslik,
        anketAciklama: anket.anketAciklama,
        sorular: anket.sorular,
        hedefKitleKriterleri: anket.hedefKitleKriterleri, // KonumHedefi burada frontende gider
        paylasimLinki: link.tamLink
      }
    });
  } catch (e) {
    console.error("❌ Link Getirme Hatası:", e);
    res.status(400).json({ success: false, error: "Sunucu hatası" });
  }
});

// ============================================
// 2. ANKET OLUŞTUR (POST /)
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

    console.log("📝 Gelen Hedef Kitle Kriterleri:", JSON.stringify(hedefKitleKriterleri, null, 2));

    const islenmisSorular = temizleSorular(sorular);
    const linkKodu = Math.random().toString(36).substring(2, 10).toUpperCase();
    const requestOrigin = req.get('origin') || req.get('referer') || `http://${req.get('host')}`;
    const baseUrl = requestOrigin.split('/').slice(0, 3).join('/');
    const tamLink = `${baseUrl}/anket-coz/${linkKodu}`;

    // --- KONUM KISITLAMASı ENTEGRASYONU ---
    const konumKisitlamasi = (hedefKitleKriterleri?.konum && hedefKitleKriterleri?.konumHedefi)
      ? {
        tip: hedefKitleKriterleri.konumHedefi.tip || null,
        radiusMetre: hedefKitleKriterleri.konumHedefi.radius || null,
        anketKoordinatlari: {
          latitude: hedefKitleKriterleri.konumHedefi.hedef?.lat || null,
          longitude: hedefKitleKriterleri.konumHedefi.hedef?.lng || null
        },
        adres: hedefKitleKriterleri.konumHedefi.aciklama || "",
        mahalle: hedefKitleKriterleri.konumHedefi.hedef?.mahalle || "",
        ilce: hedefKitleKriterleri.konumHedefi.hedef?.ilce || "",
        sehir: hedefKitleKriterleri.konumHedefi.hedef?.il || ""
      }
      : {
        tip: null,
        radiusMetre: null,
        anketKoordinatlari: { latitude: null, longitude: null },
        adres: "",
        mahalle: "",
        ilce: "",
        sehir: ""
      };

    console.log("📍 Konum Kısıtlaması Mapping:", JSON.stringify(konumKisitlamasi, null, 2));

    const yeniKriterler = {
      mail: hedefKitleKriterleri?.mail || false,
      mailUzantisi: hedefKitleKriterleri?.mailUzantisi || "",
      tcNo: hedefKitleKriterleri?.tcNo || false,
      kimlikDogrulama: hedefKitleKriterleri?.kimlikDogrulama || false,
      konum: hedefKitleKriterleri?.konum || false,
      konumKisitlamasi: konumKisitlamasi
    };

    const newSurvey = new Survey({
      kullaniciId: req.user._id,
      anketBaslik,
      anketAciklama,
      sorular: islenmisSorular,
      hedefKitleKriterleri: yeniKriterler,
      aiIleOlusturuldu: aiIleOlusturuldu || false,
      durum: "aktif",
      paylasimLinki: tamLink
    });

    await SurveyLink.create({
      anketId: newSurvey._id,
      kullaniciId: req.user._id,
      linkKodu: linkKodu,
      tamLink: tamLink,
      aktif: true,
      tiklanmaSayisi: 0
    });

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
// 3. KULLANICININ ANKETLERİNİ LİSTELE
// ============================================
router.get("/", auth(true), async (req, res) => {
  try {
    const items = await Survey.find({ kullaniciId: req.user._id })
      .sort({ createdAt: -1 })
      .select("anketBaslik anketAciklama sorular durum toplamCevapSayisi createdAt paylasimLinki aiIleOlusturuldu");

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
// 4. TEK ANKET DETAYI
// ============================================
router.get("/:id", auth(true), async (req, res) => {
  try {
    const item = await Survey.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: "Anket bulunamadı" });

    if (item.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Bu anketi görüntüleme yetkiniz yok" });
    }

    res.json({ success: true, data: item });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 5. CEVAPLARI KAYDET (SUBMIT) - GEOFENCING KONTROLÜ
// ============================================
router.post("/submit", async (req, res) => {
  try {
    const { anketId, cevaplar, katilimciBilgileri, dogrulamaBilgileri } = req.body;
    const birlestirilenBilgiler = { ...katilimciBilgileri, ...dogrulamaBilgileri };

    if (!anketId || !cevaplar) {
      return res.status(400).json({ success: false, error: "anketId ve cevaplar zorunludur" });
    }

    const anket = await Survey.findById(anketId);
    if (!anket) {
      return res.status(404).json({ success: false, error: "Anket bulunamadı" });
    }

    // --- KONUM FİLTRESİ KONTROLÜ (YENİ) ---
    const kriterler = anket.hedefKitleKriterleri;

    // Eğer konum kriteri aktifse ve bir hedef tanımlanmışsa kontrol et
    if (kriterler.konum && kriterler.konumHedefi && kriterler.konumHedefi.tip) {

      const hedef = kriterler.konumHedefi; // DB'deki hedef { tip: 'radius', hedef: { lat... } }
      const kullanici = dogrulamaBilgileri; // Kullanıcıdan gelen { konumLat, konumLng, il, ilce... }

      let filtreGecti = false;
      console.log(`[Submit] Konum Kontrolü: Tip=${hedef.tip}`);

      // 1. Radius (Mesafe) Kontrolü
      if (hedef.tip === "radius") {
        if (hedef.hedef?.lat && hedef.hedef?.lng && kullanici?.konumLat && kullanici?.konumLng) {
          const mesafe = haversineDistance(
            kullanici.konumLat,
            kullanici.konumLng,
            hedef.hedef.lat,
            hedef.hedef.lng
          );

          const maxMesafe = hedef.radius || 50;
          filtreGecti = mesafe <= maxMesafe;
          console.log(`[Submit] Mesafe: ${Math.round(mesafe)}m, Limit: ${maxMesafe}m -> ${filtreGecti ? 'GEÇTİ' : 'KALDI'}`);
        } else {
          console.log('[Submit] Radius kontrolü için gerekli koordinatlar eksik.');
        }
      }

      // 2. Bölge Kontrolü (String Karşılaştırma)
      else if (hedef.tip === "sehir") {
        const hedefSehir = hedef.hedef?.il?.toLowerCase().trim();
        const kulSehir = kullanici?.sehir?.toLowerCase().trim();
        filtreGecti = hedefSehir && kulSehir && kulSehir.includes(hedefSehir);
      }
      else if (hedef.tip === "ilce") {
        const hedefIlce = hedef.hedef?.ilce?.toLowerCase().trim();
        const kulIlce = kullanici?.ilce?.toLowerCase().trim();
        filtreGecti = hedefIlce && kulIlce && kulIlce.includes(hedefIlce);
      }
      else if (hedef.tip === "mahalle") {
        const hedefMah = hedef.hedef?.mahalle?.toLowerCase().trim();
        const kulMah = kullanici?.mahalle?.toLowerCase().trim();

        // Mahalle isimlerinde "Mahallesi" eki farklılık gösterebilir
        if (hedefMah && kulMah) {
          const temizHedef = hedefMah.replace(' mahallesi', '').replace(' mah.', '').trim();
          filtreGecti = kulMah.includes(temizHedef);
        }
      }

      if (!filtreGecti) {
        return res.status(403).json({
          success: false,
          error: `Konumunuz bu anketin hedef bölgesinde (${hedef.aciklama}) bulunmamaktadır.`
        });
      }
    }

    // Cevabı Kaydet
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

    res.status(201).json({
      success: true,
      message: "Cevabınız başarıyla kaydedildi.",
      data: kaydedilenCevap
    });
  } catch (e) {
    console.error("❌ Cevap Kayıt Hatası:", e);
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

    await SurveyLink.deleteMany({ anketId: req.params.id });
    await Survey.findByIdAndDelete(req.params.id);

    res.status(204).end();
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 6. KONUM DOĞRULAMA KONTROL
// ============================================
router.post("/check-location/:anketId", async (req, res) => {
  try {
    const { anketId } = req.params;
    const { latitude, longitude, mahalle, ilce, sehir } = req.body;

    // Anketi bul
    const anket = await Survey.findById(anketId);
    if (!anket) {
      return res.status(404).json({ success: false, error: "Anket bulunamadı" });
    }

    // Konum kriteri var mı kontrol et
    if (!anket.hedefKitleKriterleri?.konum) {
      return res.json({ success: true, passed: true, message: "Bu anket için konum kriteri yok" });
    }

    const konumKisitlamasi = anket.hedefKitleKriterleri.konumKisitlamasi;
    if (!konumKisitlamasi || !konumKisitlamasi.tip) {
      return res.json({ success: true, passed: true, message: "Konum kriteri tanımlanmamış" });
    }

    console.log("[Konum Doğrulama] Anket Konum Kriteri:", konumKisitlamasi.tip);
    console.log("[Konum Doğrulama] Kullanıcı Koordinatları:", { latitude, longitude });
    console.log("[Konum Doğrulama] Anket Koordinatları:", konumKisitlamasi.anketKoordinatlari);

    let passed = false;

    // Radius kontrol
    if (konumKisitlamasi.tip === "radius") {
      if (!latitude || !longitude || !konumKisitlamasi.anketKoordinatlari.latitude || !konumKisitlamasi.anketKoordinatlari.longitude) {
        return res.status(400).json({
          success: false,
          error: "Konum bilgileri eksik. Lütfen konumunuzu doğrulayınız.",
          passed: false
        });
      }

      const mesafeMetre = haversineDistance(
        latitude,
        longitude,
        konumKisitlamasi.anketKoordinatlari.latitude,
        konumKisitlamasi.anketKoordinatlari.longitude
      );

      passed = mesafeMetre <= konumKisitlamasi.radiusMetre;

      console.log(`[Konum Doğrulama] Radius: ${Math.round(mesafeMetre)}m <= ${konumKisitlamasi.radiusMetre}m = ${passed}`);

      if (!passed) {
        return res.json({
          success: true,
          passed: false,
          error: `Konumunuz bu anketin hedef bölgesinde değildir. (${Math.round(mesafeMetre)}m uzaklık, izin verilen: ${konumKisitlamasi.radiusMetre}m)`
        });
      }
    }
    // Mahalle kontrol
    else if (konumKisitlamasi.tip === "mahalle") {
      const userMahalle = mahalle?.toLowerCase()?.trim();
      const targetMahalle = konumKisitlamasi.mahalle?.toLowerCase()?.trim();
      passed = userMahalle === targetMahalle;

      console.log(`[Konum Doğrulama] Mahalle: "${userMahalle}" === "${targetMahalle}" = ${passed}`);

      if (!passed) {
        return res.json({
          success: true,
          passed: false,
          error: `Sadece ${konumKisitlamasi.mahalle} mahallesindeki katılımcılar bu ankete katılabilir.`
        });
      }
    }
    // İlçe kontrol
    else if (konumKisitlamasi.tip === "ilce") {
      const userIlce = ilce?.toLowerCase()?.trim();
      const targetIlce = konumKisitlamasi.ilce?.toLowerCase()?.trim();
      passed = userIlce === targetIlce;

      console.log(`[Konum Doğrulama] İlçe: "${userIlce}" === "${targetIlce}" = ${passed}`);

      if (!passed) {
        return res.json({
          success: true,
          passed: false,
          error: `Sadece ${konumKisitlamasi.ilce} ilçesindeki katılımcılar bu ankete katılabilir.`
        });
      }
    }
    // Şehir kontrol
    else if (konumKisitlamasi.tip === "sehir") {
      const userSehir = sehir?.toLowerCase()?.trim();
      const targetSehir = konumKisitlamasi.sehir?.toLowerCase()?.trim();
      passed = userSehir === targetSehir;

      console.log(`[Konum Doğrulama] Şehir: "${userSehir}" === "${targetSehir}" = ${passed}`);

      if (!passed) {
        return res.json({
          success: true,
          passed: false,
          error: `Sadece ${konumKisitlamasi.sehir} şehrindeki katılımcılar bu ankete katılabilir.`
        });
      }
    }

    return res.json({ success: true, passed: true, message: "Konum kriteri sağlandı" });

  } catch (e) {
    console.error("❌ Konum Doğrulama Hatası:", e);
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 7. CEVAPLARI GÖRÜNTÜLE
// ============================================
router.get("/:id/responses", auth(true), async (req, res) => {
  try {
    const anket = await Survey.findById(req.params.id);
    if (!anket) return res.status(404).json({ success: false, error: "Anket bulunamadı" });

    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Bu anketi görüntüleme yetkiniz yok" });
    }

    const cevaplar = await SurveyResponse.find({ anketId: req.params.id })
      .sort({ olusturulmaTarihi: -1 });

    res.json({
      success: true,
      data: cevaplar,
      toplam: cevaplar.length
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;