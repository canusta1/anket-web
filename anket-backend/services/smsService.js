// sms dogrulama kodu olustur
function generateSMSVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// sms dogrulama kodu gonder (mock)
async function sendSMSVerification(phoneNumber, code) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('\n' + '='.repeat(60));
      console.log('SMS DOGRULAMA KODU (MOCK)');
      console.log('='.repeat(60));
      console.log(`Telefon Numarasi: ${phoneNumber}`);
      console.log(`Dogrulama Kodu: ${code}`);
      console.log(`Gecerlilik Suresi: 10 dakika`);
      console.log('='.repeat(60) + '\n');

      resolve(true);
    }, 1000);
  });
}

module.exports = {
  generateSMSVerificationCode,
  sendSMSVerification
};
