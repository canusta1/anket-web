// Bu dosyayı anket-backend klasörünün ana dizinine (server.js yanına) koy.
// Çalıştırmak için terminalde: node test-db.js

require('dotenv').config();
const mongoose = require('mongoose');

const runTest = async () => {
    console.log("1. Bağlantı başlatılıyor...");

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB'ye bağlanıldı.");
    } catch (err) {
        console.error("❌ Bağlantı Hatası:", err.message);
        return;
    }

    // Geçici bir test şeması oluştur (Mevcut modellerden bağımsız)
    const TestSchema = new mongoose.Schema({
        mesaj: String,
        tarih: { type: Date, default: Date.now }
    });

    // Eğer veritabanında 'tests' diye bir koleksiyon yoksa oluşturur
    const TestModel = mongoose.model('Test', TestSchema);

    console.log("2. Veri yazma deneniyor...");

    try {
        const yeniVeri = await TestModel.create({ mesaj: "Merhaba MongoDB! Bu bir test verisidir." });
        console.log("✅ BAŞARILI! Veri veritabanına kaydedildi.");
        console.log("Kaydedilen Veri ID:", yeniVeri._id);

        // Temizlik: Test verisini sil (İstersen bu satırı yorum satırı yapıp Atlas'tan kontrol edebilirsin)
        await TestModel.findByIdAndDelete(yeniVeri._id);
        console.log("3. Test verisi temizlendi.");

    } catch (err) {
        console.error("❌ YAZMA HATASI:", err.message);
        console.log("İpucu: MongoDB Atlas 'Network Access' ayarlarında IP izni (0.0.0.0/0) verdiğinden emin ol.");
    } finally {
        await mongoose.connection.close();
        console.log("4. Bağlantı kapatıldı.");
    }
};

runTest();