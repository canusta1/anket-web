const nodemailer = require('nodemailer');

// Gmail transporter konfigürasyonu (Uygulama Şifresi ile)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Gmail Uygulama Şifresi
  }
});

/**
 * 6 haneli rastgele doğrulama kodu oluştur
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Doğrulama kodunu kullanıcının mailine gönder
 */
async function sendVerificationCode(userEmail, verificationCode, surveyTitle) {
  try {
    console.log(`📧 Mail gönderiliyor: ${userEmail}`);
    
    const mailOptions = {
      from: process.env.EMAIL_USER, // Gönderen
      to: userEmail,
      subject: `Anket Doğrulama Kodu - ${surveyTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #134e42; padding: 20px; text-align: center;">
             <h2 style="color: white; margin: 0;">Doğrulama Kodu</h2>
          </div>
          <div style="padding: 20px;">
             <p style="font-size: 16px; color: #333;">Merhaba,</p>
             <p>"<strong>${surveyTitle}</strong>" anketine giriş yapmak için aşağıdaki kodu kullanın:</p>
             
             <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px; border: 1px dashed #134e42;">
               <span style="font-size: 32px; font-weight: bold; color: #134e42; letter-spacing: 5px;">
                 ${verificationCode}
               </span>
             </div>
             
             <p style="color: #666; font-size: 14px;">Bu kod 10 dakika süreyle geçerlidir.</p>
          </div>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #999;">
             Bu maili siz talep etmediyseniz dikkate almayınız.
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Doğrulama kodu başarıyla gönderildi. ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Mail Hatası Detayı:');
    console.error(error);
    throw new Error(`Mail gönderilemedi: ${error.message}`);
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationCode,
};