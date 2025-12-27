const emailjs = require('@emailjs/nodejs');

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

// EmailJS Konfigürasyonu (.env dosyasından)
const EMAILJS_CONFIG = {
  serviceId: process.env.EMAILJS_SERVICE_ID,
  templateId: process.env.EMAILJS_TEMPLATE_ID,
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
};

/**
 * 6 haneli rastgele doğrulama kodu oluştur
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Doğrulama kodunu kullanıcının mailine gönder
 * EmailJS kullanarak e-posta gönderimi yapar
 * 
 * @param {string} userEmail - Alıcı e-posta adresi (EmailJS şablonunda: email)
 * @param {string} verificationCode - OTP kodu (EmailJS şablonunda: passcode)
 * @param {string} surveyTitle - Anket başlığı (opsiyonel bilgi)
 * @returns {Promise<boolean>} - Başarılı ise true döner
 */
async function sendVerificationCode(userEmail, verificationCode, surveyTitle) {
  try {
    // Hata ayıklama için bu satırı ekleyin:
    console.log("Kullanılan Public Key:", process.env.EMAILJS_PUBLIC_KEY);

    const templateParams = {
      email: userEmail,
      passcode: verificationCode,
      time: '10 dakika',
    };

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID, // Doğrudan env'den okuyun
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Başarılı:', response.status);
    return true;
  } catch (error) {
    // Hata mesajını daha detaylı loglayalım
    console.error('❌ Hata:', error);
    throw new Error(`Mail gönderilemedi: ${error.message || 'Bilinmeyen Hata'}`);
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationCode,
};