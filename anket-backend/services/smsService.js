// SMS Doğrulama Servisi (Mock - Geliştirme İçin)
// Gerçek SMS göndermez, sadece terminale yazar

/**
 * 6 haneli rastgele doğrulama kodu üretir
 */
function generateSMSVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * SMS doğrulama kodu gönderir (Mock)
 * @param {string} phoneNumber - Telefon numarası (0XXXXXXXXXX formatında)
 * @param {string} code - 6 haneli doğrulama kodu
 * @returns {Promise<boolean>} - Başarılı ise true
 */
async function sendSMSVerification(phoneNumber, code) {
  return new Promise((resolve) => {
    // Yapay gecikme (gerçek SMS servisi gibi)
    setTimeout(() => {
      console.log('\n' + '='.repeat(60));
      console.log('📱 SMS DOĞRULAMA KODU (MOCK - GELİŞTİRME MODU)');
      console.log('='.repeat(60));
      console.log(`📞 Telefon Numarası: ${phoneNumber}`);
      console.log(`🔐 Doğrulama Kodu: ${code}`);
      console.log(`⏰ Geçerlilik Süresi: 10 dakika`);
      console.log('='.repeat(60) + '\n');
      
      resolve(true);
    }, 1000); // 1 saniye yapay gecikme
  });
}

module.exports = {
  generateSMSVerificationCode,
  sendSMSVerification
};
