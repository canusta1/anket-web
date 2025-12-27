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
    console.log("🔍 telefonNumarasi değeri:", hedefKitleKriterleri?.telefonNumarasi);

    const islenmisSorular = temizleSorular(sorular);
    const linkKodu = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Request'in geldikği origin'den URL al (localhost vs IP)
    const requestOrigin = req.get('origin') || req.get('referer') || `http://${req.get('host')}`;
    const baseUrl = requestOrigin.split('/').slice(0, 3).join('/'); // Protocol + Host + Port
    const tamLink = `${baseUrl}/anket-coz/${linkKodu}`;

    console.log("🌐 Request Origin:", requestOrigin);
    console.log("🔗 Oluşturulan Link:", tamLink);

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
      telefonNumarasi: hedefKitleKriterleri?.telefonNumarasi || false,
      konum: hedefKitleKriterleri?.konum || false,
      konumKisitlamasi: konumKisitlamasi
    };

    console.log("💾 DB'ye kaydedilecek kriterler:", JSON.stringify(yeniKriterler, null, 2));

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
// 6. ANKET SİL (TAM TEMİZLİK)
// ============================================
router.delete("/:id", auth(true), async (req, res) => {
  try {
    const anketId = req.params.id;
    const anket = await Survey.findById(anketId);
    
    if (!anket) return res.status(404).json({ success: false, error: "Anket bulunamadı." });

    // Yetki kontrolü (sadece kendi anketini silebilir)
    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Bu anketi silme yetkiniz yok." });
    }

    // 1. Ankete bağlı tüm linkleri sil
    await SurveyLink.deleteMany({ anketId });
    
    // 2. Ankete verilmiş tüm cevapları sil
    await SurveyResponse.deleteMany({ anketId });
    
    // 3. Anketin kendisini sil
    await Survey.findByIdAndDelete(anketId);

    console.log(`🗑️ Anket ve tüm verileri silindi: ${anketId}`);

    res.json({ success: true, message: "Anket ve ilişkili tüm veriler başarıyla silindi." });
  } catch (e) {
    console.error("❌ Silme Hatası:", e);
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 6.5 ANKET DURUMUNU GÜNCELLE (AKTİF/PASİF)
// ============================================
router.patch("/:id/status", auth(true), async (req, res) => {
  try {
    const { durum } = req.body;

    // Validasyon
    if (!['aktif', 'pasif'].includes(durum)) {
      return res.status(400).json({
        success: false,
        error: "Geçersiz durum. 'aktif' veya 'pasif' olmalı."
      });
    }

    const anket = await Survey.findById(req.params.id);
    if (!anket) {
      return res.status(404).json({ success: false, error: "Anket bulunamadı" });
    }

    // Yetki kontrolü
    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Bu anketi değiştirme yetkiniz yok" });
    }

    anket.durum = durum;
    await anket.save();

    console.log(`✅ Anket durumu güncellendi: ${anket._id} -> ${durum}`);

    res.json({
      success: true,
      message: `Anket durumu "${durum}" olarak güncellendi.`,
      data: { _id: anket._id, durum: anket.durum }
    });
  } catch (e) {
    console.error("❌ Durum güncelleme hatası:", e);
    res.status(400).json({ success: false, error: e.message });
  }
});

// ============================================
// 7. KONUM DOĞRULAMA KONTROL
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
// ============================================
// 8. ANKET DETAYLI SONUÇLARI (İSTATİSTİKLER + KATILIMCILAR)
// Bu route'u surveys.js dosyasının SONUNA ekle (module.exports'tan ÖNCE)
// ============================================
router.get("/:id/results", auth(true), async (req, res) => {
  try {
    const anketId = req.params.id;

    // Anketi kontrol et - sadece sahibi görebilir
    const anket = await Survey.findById(anketId);
    if (!anket) {
      return res.status(404).json({
        success: false,
        error: "Anket bulunamadı"
      });
    }

    // Güvenlik kontrolü
    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Bu anketin sonuçlarını görüntüleme yetkiniz yok"
      });
    }

    // Bu ankete verilen tüm cevapları getir
    const cevaplar = await SurveyResponse.find({ anketId: anketId })
      .sort({ olusturulmaTarihi: -1 });

    console.log(`📊 Anket: ${anket.anketBaslik} - Toplam ${cevaplar.length} cevap bulundu`);

    // İstatistikleri hesapla
    const istatistikler = {
      toplamKatilimci: cevaplar.length,
      sorular: []
    };

    // Her soru için istatistik oluştur
    anket.sorular.forEach((soru, idx) => {
      const soruId = soru._id.toString();

      console.log(`\n📊 Soru ${idx + 1}: ${soru.soruMetni}`);
      console.log(`   Soru ID: ${soruId}`);
      console.log(`   Soru Tipi: ${soru.soruTipi}`);

      const soruStat = {
        soruId: soruId,
        soruMetni: soru.soruMetni,
        soruTipi: soru.soruTipi,
        secenekler: soru.secenekler || [],
        toplamCevap: 0,
        cevaplar: [] // Açık uçlu sorular için
      };

      // Bu soruya verilen tüm cevapları topla
      const soruCevaplari = [];
      cevaplar.forEach((response, ridx) => {
        const cevap = response.cevaplar[soruId];
        if (cevap !== undefined && cevap !== null && cevap !== "") {
          soruCevaplari.push(cevap);
          if (ridx === 0) console.log(`   ✅ 1. Cevap Format: ${JSON.stringify(cevap)}`);
        }
      });

      console.log(`   📥 Toplam ${soruCevaplari.length} cevap bulundu`);
      soruStat.toplamCevap = soruCevaplari.length;

      // Soru tipine göre istatistik hesapla
      if (["coktan-tek", "coktan-coklu", "coktan-secmeli", "cok-secmeli"].includes(soru.soruTipi)) {
        // Çoktan seçmeli sorular için dağılım
        soruStat.dagilim = {};

        // Her seçenek için sayaç başlat
        soru.secenekler.forEach((secenek) => {
          const secenekId = secenek._id.toString();
          const secenekMetni = typeof secenek === 'string' ? secenek : (secenek.metni || secenek.metin || '');

          soruStat.dagilim[secenekId] = {
            secenekId: secenekId,
            metin: secenekMetni,
            sayi: 0,
            yuzde: 0
          };
        });

        // Cevapları say - Seçenek METNİ ile eşleştir (ID değil)
        soruCevaplari.forEach((cevap) => {
          if (Array.isArray(cevap)) {
            // Çoklu seçim (checkbox) - Her bir metni bul
            cevap.forEach((secenekMetni) => {
              // Seçenek metnine göre ID'sini bul ve artır
              const secenekEntry = Object.values(soruStat.dagilim).find(
                s => s.metin === secenekMetni || s.metin.trim() === String(secenekMetni).trim()
              );
              if (secenekEntry) {
                secenekEntry.sayi++;
              }
            });
          } else {
            // Tek seçim (radio) - Metni eşleştir
            const secenekEntry = Object.values(soruStat.dagilim).find(
              s => s.metin === cevap || s.metin.trim() === String(cevap).trim()
            );
            if (secenekEntry) {
              secenekEntry.sayi++;
            }
          }
        });

        // Yüzdeleri hesapla
        Object.keys(soruStat.dagilim).forEach((secenekId) => {
          if (soruStat.toplamCevap > 0) {
            const yuzde = (soruStat.dagilim[secenekId].sayi / soruStat.toplamCevap) * 100;
            soruStat.dagilim[secenekId].yuzde = parseFloat(yuzde.toFixed(1));
          }
        });

        // Dağılımı array'e çevir (frontend için daha kolay)
        soruStat.dagilimArray = Object.values(soruStat.dagilim);

      } else if (soru.soruTipi === "acik-uclu") {
        // Açık uçlu sorular için tüm cevapları ekle
        soruStat.cevaplar = soruCevaplari.filter(c => c && c.trim().length > 0);
      } else if (soru.soruTipi === "slider") {
        // Slider sorular için sayı dağılımını hesapla
        soruStat.dagilim = {};

        // Tüm cevapları sayıya çevir ve dağılımı oluştur
        soruCevaplari.forEach((cevap) => {
          const sayi = parseInt(cevap) || 0;
          if (!soruStat.dagilim[sayi]) {
            soruStat.dagilim[sayi] = {
              sayi: sayi,
              sayi_cevap: 0,
              yuzde: 0
            };
          }
          soruStat.dagilim[sayi].sayi_cevap++;
        });

        // Yüzdeleri hesapla
        Object.keys(soruStat.dagilim).forEach((key) => {
          if (soruStat.toplamCevap > 0) {
            const yuzde = (soruStat.dagilim[key].sayi_cevap / soruStat.toplamCevap) * 100;
            soruStat.dagilim[key].yuzde = parseFloat(yuzde.toFixed(1));
          }
        });

        // Dağılımı array'e çevir
        soruStat.dagilimArray = Object.values(soruStat.dagilim).sort((a, b) => a.sayi - b.sayi);
      }

      istatistikler.sorular.push(soruStat);
    });

    // Katılımcı listesi
    const katilimcilar = cevaplar.map((response) => ({
      _id: response._id,
      olusturulmaTarihi: response.olusturulmaTarihi,
      katilimciBilgileri: response.katilimciBilgileri || {},
      cevaplar: response.cevaplar
    }));

    // Sonucu döndür
    res.json({
      success: true,
      data: {
        anket: {
          _id: anket._id,
          anketBaslik: anket.anketBaslik,
          anketAciklama: anket.anketAciklama,
          durum: anket.durum,
          olusturulmaTarihi: anket.createdAt,
          sorular: anket.sorular
        },
        istatistikler,
        katilimcilar
      }
    });

  } catch (error) {
    console.error("❌ Anket sonuçları getirme hatası:", error);
    res.status(500).json({
      success: false,
      error: "Sonuçlar getirilirken bir hata oluştu",
      message: error.message
    });
  }
});

// ============================================
// ANKET YANIT ANALİZİ (AI İLE)
// ============================================
router.get("/:id/ai-analysis", auth(true), async (req, res) => {
  try {
    const anketId = req.params.id;

    // Anketi kontrol et
    const anket = await Survey.findById(anketId);
    if (!anket) {
      return res.status(404).json({
        success: false,
        error: "Anket bulunamadı"
      });
    }

    // Güvenlik kontrolü
    if (anket.kullaniciId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Bu anketin analizini görüntüleme yetkiniz yok"
      });
    }

    // Cevapları getir
    const cevaplar = await SurveyResponse.find({ anketId: anketId });

    if (cevaplar.length === 0) {
      return res.json({
        success: true,
        data: {
          analiz: "Henüz cevap yok",
          duygu: "neutral",
          puan: 5,
          ozet: "Anket henüz cevaplandırılmamıştır"
        }
      });
    }

    // Cevapları metin formatına çevir
    const analizedTexts = cevaplar.map((response) => {
      const cevapMetinler = [];

      anket.sorular.forEach((soru) => {
        const cevap = response.cevaplar[soru._id.toString()];
        if (cevap) {
          const soruTipi = soru.soruTipi;
          let cevapText = "";

          if (Array.isArray(cevap)) {
            cevapText = cevap.join(", ");
          } else {
            cevapText = String(cevap);
          }

          cevapMetinler.push(`Soru: ${soru.soruMetni}\nCevap: ${cevapText}`);
        }
      });

      return cevapMetinler.join("\n");
    }).join("\n\n---\n\n");

    // Groq API ile analiz yap
    const aiService = require("../aiService");

    // Soruları ve cevapları organize et - her soru için cevaplar
    let soruCevapAnalizi = {};

    anket.sorular.forEach((soru) => {
      soruCevapAnalizi[soru._id.toString()] = {
        soruMetni: soru.soruMetni,
        soruTipi: soru.soruTipi,
        cevaplar: []
      };
    });

    // Her cevabı organize et
    cevaplar.forEach((response) => {
      Object.keys(response.cevaplar).forEach((soruId) => {
        if (soruCevapAnalizi[soruId]) {
          const cevap = response.cevaplar[soruId];
          let cevapText = "";

          if (Array.isArray(cevap)) {
            cevapText = cevap.join(", ");
          } else {
            cevapText = String(cevap);
          }

          soruCevapAnalizi[soruId].cevaplar.push(cevapText);
        }
      });
    });

    // Format soruları analiz için
    let formattedAnalysis = `ANKET: ${anket.anketBaslik}\nTOPLAM KATILIMCI: ${cevaplar.length}\n\n`;
    formattedAnalysis += `SORULAR VE CEVAPLAR:\n`;
    formattedAnalysis += `${'='.repeat(80)}\n\n`;

    Object.values(soruCevapAnalizi).forEach((soruData, idx) => {
      formattedAnalysis += `SORU ${idx + 1}: ${soruData.soruMetni}\n`;
      formattedAnalysis += `Soru Tipi: ${soruData.soruTipi}\n`;
      formattedAnalysis += `Cevaplar (${soruData.cevaplar.length} kişi):\n`;

      // Cevapları sayı ile göster
      soruData.cevaplar.forEach((cevap, cidx) => {
        formattedAnalysis += `  ${cidx + 1}. ${cevap}\n`;
      });

      formattedAnalysis += `\n`;
    });

    const analysisPrompt = `
Sen bir profesyonel restoran/işletme müşteri memnuniyeti danışmanısın. 

Aşağıda verilen ankete katılımcıların GERÇEK cevaplarını oku ve DETAYLı bir analiz yap.

${formattedAnalysis}

KURALLAR:
1. ÖNEMLİ: Sadece sorularda olanları yorumla. Eğer soruda yemek yoksa yemekten bahsetme!
2. Her sorunun cevaplarını dikkatlice analiz et
3. Tekrarlanan konuları belirle
4. Puanlu sorularda (slider, 1-10) ortalamasını hesapla
5. Olumlu ve olumsuz yönleri dengeli anlat
6. Genel duyguyu belirle (pozitif/negatif/nötr)
7. 1-10 arası puan ver (ortalama puanlara ve olumlu yorumlara göre)

ÖZETİ YAZARKEN:
- Her sorudan bahset eğer önemliyse
- Tekrarlanan problemleri vurgula
- Müşteri beklentilerini karşılayıp karşılamadığını belirle
- 3-4 cümlelik açık ve net bir özet yaz

KESINLIKLE TÜRKÇE VE SADECE ŞÖYLE GÖNDERİ:

{
  "duygu": "pozitif",
  "puan": 8,
  "ozet": "Bu ankete göre yapılan analiz. Her soruyu dikkate alarak yazılmış. Örneğin: X sorusuna katılımcılar böyle cevap verdi, Y sorusunda böyle bulgular çıktı. Genel olarak sonuç şu.",
  "temel_tematiclar": ["Tema1: Açıklama", "Tema2: Açıklama"]
}

Başka hiçbir şey yazma, SADECE bu JSON'u gönder!
    `;

    console.log("📊 AI Analiz Prompt gönderiliyor...");
    const completion = await aiService.analyzeWithGroq(analysisPrompt);

    let analysisData = {
      duygu: "nötr",
      puan: 5,
      ozet: "Analiz yapılamadı",
      temel_tematiclar: []
    };

    try {
      // JSON'u çıkart - daha sağlam bir yöntem
      const cleanText = completion.trim();
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = cleanText.substring(jsonStart, jsonEnd + 1);
        analysisData = JSON.parse(jsonStr);
        console.log("✅ AI Analiz başarılı:", analysisData);
      } else {
        console.warn("⚠️ JSON bulunamadı. Yanıt:", cleanText);
      }
    } catch (parseError) {
      console.error("❌ JSON parse hatası:", parseError.message);
      console.error("Yanıt:", completion);
    }

    res.json({
      success: true,
      data: {
        analiz: analysisData,
        toplam_cevap: cevaplar.length
      }
    });

  } catch (error) {
    console.error("❌ AI analiz hatası:", error);
    res.status(500).json({
      success: false,
      error: "Analiz yapılırken bir hata oluştu",
      message: error.message
    });
  }
});

module.exports = router;