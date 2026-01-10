// anket-backend/services/encryptionService.js
// TC Kimlik No ve Adres gibi hassas verileri şifrelemek için AES-256-GCM

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
// .env dosyasından PII_SECRET kullanarak key türet
const PII_SECRET = process.env.PII_SECRET;
// PBKDF2 ile sabit bir salt kullanarak 32 byte'lık key türet
const SALT = 'survai-pii-encryption-salt-v1';
// Key'i cache'le (her seferinde hesaplamamak için)
let SECRET_KEY = null;

function getDerivedKey() {
  if (SECRET_KEY) return SECRET_KEY;
  if (!PII_SECRET) {
    throw new Error('PII_SECRET ortam değişkeni tanımlanmamış!');
  }
  // PBKDF2 ile 32 byte key türet
  SECRET_KEY = crypto.pbkdf2Sync(PII_SECRET, SALT, 100000, 32, 'sha256');
  return SECRET_KEY;
}

// IV uzunluğu (12 byte GCM için önerilen)
const IV_LENGTH = 12;
// Auth tag uzunluğu
const AUTH_TAG_LENGTH = 16;



/**
 * Metni AES-256-GCM ile şifrele
 * @param {string} plainText - Şifrelenecek düz metin
 * @returns {string} - Şifrelenmiş veri (iv:authTag:encryptedData formatında)
 */
function encrypt(plainText) {
  if (!plainText || typeof plainText !== 'string') {
    return plainText;
  }


  try {
    const key = getDerivedKey();
    
    // Rastgele IV oluştur
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Cipher oluştur
    const cipher = crypto.createCipheriv(
      ALGORITHM, 
      key, 
      iv
    );
    
    // Şifrele
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Auth tag'i al (bütünlük kontrolü için)
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Şifreleme hatası:', error.message);
    throw new Error('Veri şifrelenemedi');
  }
}

/**
 * Şifrelenmiş metni çöz
 * @param {string} encryptedData - Şifrelenmiş veri (iv:authTag:encryptedData formatında)
 * @returns {string} - Çözülmüş düz metin
 */
function decrypt(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    return encryptedData;
  }

  // Şifreli veri formatını kontrol et
  if (!encryptedData.includes(':')) {
    // Eski format veya şifrelenmemiş veri - olduğu gibi döndür
    return encryptedData;
  }


  try {
    const key = getDerivedKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      // Geçersiz format - olduğu gibi döndür (geriye uyumluluk)
      return encryptedData;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    // Decipher oluştur
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      key, 
      iv
    );
    
    // Auth tag'i ayarla
    decipher.setAuthTag(authTag);
    
    // Çöz
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Şifre çözme hatası:', error.message);
    // Hata durumunda orijinal veriyi döndür (geriye uyumluluk)
    return encryptedData;
  }
}

/**
 * Katılımcı bilgilerindeki hassas alanları şifrele
 * @param {Object} katilimciBilgileri - Katılımcı bilgileri objesi
 * @returns {Object} - Hassas alanları şifrelenmiş obje
 */
function encryptSensitiveFields(katilimciBilgileri) {
  if (!katilimciBilgileri || typeof katilimciBilgileri !== 'object') {
    return katilimciBilgileri;
  }

  const encrypted = { ...katilimciBilgileri };
  
  // Şifrelenecek hassas alanlar
  const sensitiveFields = ['tcNo', 'tcKimlikNo', 'adres', 'acikAdres', 'telefonNo', 'telefon'];
  
  sensitiveFields.forEach(field => {
    if (encrypted[field] && typeof encrypted[field] === 'string' && encrypted[field].length > 0) {
      // Zaten şifrelenmiş mi kontrol et
      if (!encrypted[field].includes(':')) {
        encrypted[field] = encrypt(encrypted[field]);
      }
    }
  });

  return encrypted;
}

/**
 * Katılımcı bilgilerindeki şifrelenmiş alanları çöz
 * @param {Object} katilimciBilgileri - Şifrelenmiş katılımcı bilgileri objesi
 * @returns {Object} - Çözülmüş obje
 */
function decryptSensitiveFields(katilimciBilgileri) {
  if (!katilimciBilgileri || typeof katilimciBilgileri !== 'object') {
    return katilimciBilgileri;
  }

  const decrypted = { ...katilimciBilgileri };
  
  // Çözülecek hassas alanlar
  const sensitiveFields = ['tcNo', 'tcKimlikNo', 'adres', 'acikAdres', 'telefonNo', 'telefon'];
  
  sensitiveFields.forEach(field => {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field]);
    }
  });

  return decrypted;
}

/**
 * 32 byte'lık yeni bir şifreleme anahtarı oluştur
 * @returns {string} - 64 hex karakterlik anahtar
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  encryptSensitiveFields,
  decryptSensitiveFields,
  generateEncryptionKey
};
