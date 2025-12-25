const emailjs = require('@emailjs/nodejs');

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
    console.log(`📧 EmailJS ile mail gönderiliyor: ${userEmail}`);

    // EmailJS şablon değişkenleri eşleştirmesi
    const templateParams = {
      email: userEmail,           // Alıcı e-posta -> EmailJS 'email' anahtarı
      passcode: verificationCode, // OTP kodu -> EmailJS 'passcode' anahtarı
      time: '10 dakika',          // Geçerlilik süresi -> EmailJS 'time' anahtarı
    };

    // EmailJS ile e-posta gönderimi
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      {
        publicKey: EMAILJS_CONFIG.publicKey,
        privateKey: EMAILJS_CONFIG.privateKey,
      }
    );

    console.log('✅ Doğrulama kodu başarıyla gönderildi. Status:', response.status, 'Text:', response.text);
    return true;

  } catch (error) {
    console.error('❌ EmailJS Hatası Detayı:', error);
    // Hata mesajını frontend'e düzgün iletmek için fırlatıyoruz
    throw new Error(`Mail gönderilemedi: ${error.text || error.message}`);
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationCode,
};