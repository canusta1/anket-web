const { Resend } = require('resend');

// Resend'i başlat (API Key'i .env dosyasından alacak)
const resend = new Resend(process.env.RESEND_API_KEY);

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
    console.log(`📧 Resend ile mail gönderiliyor: ${userEmail}`);

    // Resend ile gönderim işlemi
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // DİKKAT: Domain doğrulaması yapana kadar burası böyle kalmalı
      to: userEmail,                 // Test aşamasında sadece kendi mailine gönderebilirsin
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
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Doğrulama kodu başarıyla gönderildi. ID:', data.id);
    return true;

  } catch (error) {
    console.error('❌ Mail Hatası Detayı:', error);
    // Hata mesajını frontend'e düzgün iletmek için fırlatıyoruz
    throw new Error(`Mail gönderilemedi: ${error.message}`);
  }
}

module.exports = {
  generateVerificationCode,
  sendVerificationCode,
};