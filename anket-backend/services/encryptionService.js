const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const PII_SECRET = process.env.PII_SECRET;
const SALT = 'survai-pii-encryption-salt-v1';
let SECRET_KEY = null;

function getDerivedKey() {
  if (SECRET_KEY) return SECRET_KEY;
  if (!PII_SECRET) {
    throw new Error('PII_SECRET ortam değişkeni tanımlanmamış!');
  }
  SECRET_KEY = crypto.pbkdf2Sync(PII_SECRET, SALT, 100000, 32, 'sha256');
  return SECRET_KEY;
}

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;



// sifrele
function encrypt(plainText) {
  if (!plainText || typeof plainText !== 'string') {
    return plainText;
  }


  try {
    const key = getDerivedKey();

    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(
      ALGORITHM,
      key,
      iv
    );

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Şifreleme hatası:', error.message);
    throw new Error('Veri şifrelenemedi');
  }
}

// sifre coz
function decrypt(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    return encryptedData;
  }

  if (!encryptedData.includes(':')) {
    // Eski format veya şifrelenmemiş veri - olduğu gibi döndür
    return encryptedData;
  }


  try {
    const key = getDerivedKey();
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      return encryptedData;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Şifre çözme hatası:', error.message);
    return encryptedData;
  }
}

// hassas alanlari sifrele
function encryptSensitiveFields(katilimciBilgileri) {
  if (!katilimciBilgileri || typeof katilimciBilgileri !== 'object') {
    return katilimciBilgileri;
  }

  const encrypted = { ...katilimciBilgileri };

  const sensitiveFields = ['tcNo', 'tcKimlikNo', 'adres', 'acikAdres', 'telefonNo', 'telefon'];

  sensitiveFields.forEach(field => {
    if (encrypted[field] && typeof encrypted[field] === 'string' && encrypted[field].length > 0) {
      if (!encrypted[field].includes(':')) {
        encrypted[field] = encrypt(encrypted[field]);
      }
    }
  });

  return encrypted;
}

// sifrelenmis alanlari coz
function decryptSensitiveFields(katilimciBilgileri) {
  if (!katilimciBilgileri || typeof katilimciBilgileri !== 'object') {
    return katilimciBilgileri;
  }

  const decrypted = { ...katilimciBilgileri };

  const sensitiveFields = ['tcNo', 'tcKimlikNo', 'adres', 'acikAdres', 'telefonNo', 'telefon'];

  sensitiveFields.forEach(field => {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      decrypted[field] = decrypt(decrypted[field]);
    }
  });

  return decrypted;
}

// yeni sifreleme anahtari olustur
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
