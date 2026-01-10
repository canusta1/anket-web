// Test script for encryption service
require('dotenv').config();
const { encryptSensitiveFields, decryptSensitiveFields } = require('./services/encryptionService');

const testData = {
  tcNo: '12345678901',
  adres: 'Cami Mah. Ata Sok. No:5 Kadikoy/Istanbul',
  email: 'test@example.com', // bu şifrelenmeyecek
  isim: 'Ahmet Yılmaz' // bu da şifrelenmeyecek
};

console.log('=== ŞİFRELEME TESTİ ===\n');
console.log('1. Orijinal Veri:');
console.log(JSON.stringify(testData, null, 2));

console.log('\n2. Şifrelenmiş Veri:');
const encrypted = encryptSensitiveFields(testData);
console.log(JSON.stringify(encrypted, null, 2));

console.log('\n3. Çözülmüş Veri:');
const decrypted = decryptSensitiveFields(encrypted);
console.log(JSON.stringify(decrypted, null, 2));

console.log('\n4. Doğrulama:');
console.log('tcNo eşleşiyor:', testData.tcNo === decrypted.tcNo ? '✅' : '❌');
console.log('adres eşleşiyor:', testData.adres === decrypted.adres ? '✅' : '❌');
console.log('email değişmedi:', testData.email === decrypted.email ? '✅' : '❌');
console.log('isim değişmedi:', testData.isim === decrypted.isim ? '✅' : '❌');
