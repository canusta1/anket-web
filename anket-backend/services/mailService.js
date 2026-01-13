const emailjs = require('@emailjs/nodejs');

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

const EMAILJS_CONFIG = {
  serviceId: process.env.EMAILJS_SERVICE_ID,
  templateId: process.env.EMAILJS_TEMPLATE_ID,
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
};

// dogrulama kodu olustur
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// dogrulama kodu gonder
async function sendVerificationCode(userEmail, verificationCode, surveyTitle) {
  try {
    console.log("Kullanılan Public Key:", process.env.EMAILJS_PUBLIC_KEY);

    const templateParams = {
      email: userEmail,
      passcode: verificationCode,
      time: '10 dakika',
    };

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('Basarili:', response.status);
    return true;
  } catch (error) {
    console.error('Hata:', error);
    throw new Error(`Mail gonderilemedi: ${error.message || 'Bilinmeyen Hata'}`);
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationCode,
};