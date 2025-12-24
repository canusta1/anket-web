// anket-backend/services/ocrService.js
// Tesseract.js ile OCR servisi - Kimlik kartından TC Kimlik No okuma

const { createWorker } = require('tesseract.js');

/**
 * Resim dosyasından metin oku
 * @param {string} imagePath - Resim dosyasının yolu
 * @returns {Promise<string>} - Okunan metin
 */
async function extractTextFromImage(imagePath) {
    let worker = null;
    try {
        // Worker oluştur
        worker = await createWorker('tur', 1, {
            logger: (m) => {
                // Progress loglama (opsiyonel)
                // console.log(`OCR: ${m.status} ${Math.round((m.progress || 0) * 100)}%`);
            },
            errorHandler: (err) => {
                console.error('Tesseract Worker Error:', err);
            }
        });

        // Metni tanı
        const { data: { text } } = await worker.recognize(imagePath);

        return text;
    } catch (error) {
        console.error('OCR Hatası:', error);
        throw new Error(`OCR işlemi başarısız: ${error.message}`);
    } finally {
        // Worker'ı kapat
        if (worker) {
            try {
                await worker.terminate();
            } catch (e) {
                // Ignore termination errors
            }
        }
    }
}

/**
 * TC Kimlik Numarasını regex ile ayıkla
 * TC Kimlik No: 11 haneli, ilk hane 0 olamaz
 * @param {string} text - OCR ile okunan metin
 * @returns {string|null} - Bulunan TC Kimlik No veya null
 */
function extractTCKimlikNo(text) {
    if (!text || typeof text !== 'string') {
        return null;
    }

    // Metinden boşlukları ve özel karakterleri temizle (sayı gruplarını bul)
    // TC Kimlik No: 11 haneli, ilk rakam 1-9 arası olmalı
    const tcRegex = /\b([1-9][0-9]{10})\b/g;

    const matches = text.match(tcRegex);

    if (matches && matches.length > 0) {
        // TC Kimlik No algoritma kontrolü
        for (const potentialTC of matches) {
            if (isValidTCKimlikNo(potentialTC)) {
                return potentialTC;
            }
        }
        // Algoritma geçerli değilse ilk eşleşeni dön
        return matches[0];
    }

    return null;
}

/**
 * TC Kimlik No algoritma kontrolü
 * @param {string} tc - 11 haneli TC Kimlik No
 * @returns {boolean} - Geçerli mi?
 */
function isValidTCKimlikNo(tc) {
    if (!tc || tc.length !== 11) return false;
    if (tc[0] === '0') return false;

    const digits = tc.split('').map(Number);

    // 1, 3, 5, 7, 9. hanelerin toplamının 7 katından
    // 2, 4, 6, 8. hanelerin toplamı çıkarılır, 10'a bölümünden kalan 10. haneyi verir
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const check10 = ((oddSum * 7) - evenSum) % 10;

    if (check10 !== digits[9]) return false;

    // İlk 10 hanenin toplamının 10'a bölümünden kalan 11. haneyi verir
    const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    const check11 = sumFirst10 % 10;

    if (check11 !== digits[10]) return false;

    return true;
}

/**
 * Kimlik kartı resminden TC Kimlik No oku
 * @param {string} imagePath - Kimlik kartı resminin yolu
 * @returns {Promise<{success: boolean, tcKimlikNo: string|null, rawText: string, error: string|null}>}
 */
async function readTCFromIdCard(imagePath) {
    const result = {
        success: false,
        tcKimlikNo: null,
        rawText: '',
        error: null
    };

    try {
        // OCR ile metni oku
        const rawText = await extractTextFromImage(imagePath);
        result.rawText = rawText;

        // TC Kimlik No'yu ayıkla
        const tcKimlikNo = extractTCKimlikNo(rawText);

        if (tcKimlikNo) {
            result.success = true;
            result.tcKimlikNo = tcKimlikNo;
        } else {
            result.error = 'Kimlik kartında TC Kimlik Numarası bulunamadı';
        }

        return result;
    } catch (error) {
        result.error = error.message;
        return result;
    }
}

module.exports = {
    extractTextFromImage,
    extractTCKimlikNo,
    isValidTCKimlikNo,
    readTCFromIdCard
};
