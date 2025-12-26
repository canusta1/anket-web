// anket-backend/services/ocrService.js
// Tesseract.js ile OCR servisi - Gelişmiş Görüntü Ön İşleme
// Çoklu strateji ile TC Kimlik No okuma

const { createWorker } = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Çoklu ön işleme stratejileri - Her biri farklı koşullar için optimize edilmiş
 */
const PREPROCESSING_STRATEGIES = [
    {
        name: 'high-contrast',
        description: 'Yüksek kontrast, standart threshold',
        process: async (buffer) => {
            return sharp(buffer)
                .grayscale()
                .normalize()
                .sharpen({ sigma: 2 })
                .resize({ width: 2400, height: 1600, fit: 'inside', withoutEnlargement: false })
                .threshold(128)
                .toBuffer();
        }
    },
    {
        name: 'light-threshold',
        description: 'Açık arka planlar için düşük threshold',
        process: async (buffer) => {
            return sharp(buffer)
                .grayscale()
                .normalize()
                .sharpen({ sigma: 1.5 })
                .resize({ width: 2400, height: 1600, fit: 'inside', withoutEnlargement: false })
                .threshold(100)
                .toBuffer();
        }
    },
    {
        name: 'dark-threshold',
        description: 'Koyu arka planlar için yüksek threshold',
        process: async (buffer) => {
            return sharp(buffer)
                .grayscale()
                .normalize()
                .sharpen({ sigma: 1.5 })
                .resize({ width: 2400, height: 1600, fit: 'inside', withoutEnlargement: false })
                .threshold(160)
                .toBuffer();
        }
    },
    {
        name: 'inverted',
        description: 'Ters çevrilmiş (koyu yazılar için)',
        process: async (buffer) => {
            return sharp(buffer)
                .grayscale()
                .normalize()
                .negate()
                .sharpen({ sigma: 2 })
                .resize({ width: 2400, height: 1600, fit: 'inside', withoutEnlargement: false })
                .threshold(128)
                .toBuffer();
        }
    },
    {
        name: 'enhanced-detail',
        description: 'Detay artırma - küçük yazılar için',
        process: async (buffer) => {
            return sharp(buffer)
                .grayscale()
                .modulate({ brightness: 1.1 })
                .sharpen({ sigma: 3, m1: 1, m2: 2 })
                .resize({ width: 3000, height: 2000, fit: 'inside', withoutEnlargement: false })
                .normalize()
                .threshold(135)
                .toBuffer();
        }
    },
    {
        name: 'no-threshold',
        description: 'Threshold olmadan - doğal görüntü',
        process: async (buffer) => {
            return sharp(buffer)
                .grayscale()
                .normalize()
                .sharpen({ sigma: 2 })
                .resize({ width: 2400, height: 1600, fit: 'inside', withoutEnlargement: false })
                .toBuffer();
        }
    }
];

/**
 * Görüntüyü belirtilen strateji ile işle
 */
async function processWithStrategy(imagePath, strategy) {
    try {
        const inputBuffer = await fs.promises.readFile(imagePath);
        const processedBuffer = await strategy.process(inputBuffer);
        const outputPath = imagePath.replace(/\.[^/.]+$/, `_${strategy.name}.png`);
        await fs.promises.writeFile(outputPath, processedBuffer);
        return outputPath;
    } catch (error) {
        console.error(`Strateji işleme hatası (${strategy.name}):`, error.message);
        return null;
    }
}

/**
 * İşlenmiş dosyaları temizle
 */
async function cleanupProcessedFiles(filePaths) {
    for (const filePath of filePaths) {
        if (filePath && fs.existsSync(filePath)) {
            try {
                await fs.promises.unlink(filePath);
            } catch (e) {
                // Ignore
            }
        }
    }
}

/**
 * OCR ile metin çıkar - optimize edilmiş ayarlarla
 */
async function runOCR(imagePath) {
    let worker = null;
    try {
        worker = await createWorker(['tur', 'eng'], 1, {
            errorHandler: (err) => console.error('Tesseract Error:', err)
        });

        // Sadece rakam modunda çalış
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789',
            tessedit_pageseg_mode: '6'
        });

        const { data: { text } } = await worker.recognize(imagePath);
        return text;
    } finally {
        if (worker) {
            try { await worker.terminate(); } catch (e) { }
        }
    }
}

/**
 * Metinden tüm potansiyel TC numaralarını çıkar
 */
function extractAllPotentialTCs(text) {
    if (!text || typeof text !== 'string') return [];

    // Tüm boşluk ve özel karakterleri kaldır
    const cleanText = text.replace(/[\s\-\.,:;\/\\|_]/g, '');

    // 11 haneli sayıları bul (ilk hane 0 olamaz)
    const matches = cleanText.match(/[1-9][0-9]{10}/g) || [];

    return [...new Set(matches)]; // Eşsiz değerler
}

/**
 * TC Kimlik No algoritma doğrulaması
 */
function isValidTCKimlikNo(tc) {
    if (!tc || tc.length !== 11) return false;
    if (tc[0] === '0') return false;

    const digits = tc.split('').map(Number);

    // 10. hane kontrolü
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    let check10 = ((oddSum * 7) - evenSum) % 10;
    if (check10 < 0) check10 += 10;
    if (check10 !== digits[9]) return false;

    // 11. hane kontrolü
    const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    if ((sumFirst10 % 10) !== digits[10]) return false;

    return true;
}

/**
 * ANA FONKSİYON: Kimlik kartından TC oku
 * Çoklu strateji ile deneyerek en iyi sonucu bulur
 */
async function readTCFromIdCard(imagePath) {
    const result = {
        success: false,
        tcKimlikNo: null,
        rawText: '',
        error: null,
        strategy: null
    };

    const processedFiles = [];

    try {
        console.log('🔍 TC OCR başlatılıyor (Çoklu Strateji):', imagePath);

        // Her stratejiyi dene
        for (const strategy of PREPROCESSING_STRATEGIES) {
            console.log(`\n📷 Strateji deneniyor: ${strategy.name} - ${strategy.description}`);

            // Görüntüyü işle
            const processedPath = await processWithStrategy(imagePath, strategy);
            if (!processedPath) continue;

            processedFiles.push(processedPath);

            // OCR çalıştır
            const ocrText = await runOCR(processedPath);
            console.log(`   📝 OCR çıktısı: "${ocrText.replace(/\s+/g, ' ').trim().substring(0, 50)}..."`);

            // TC numaralarını çıkar
            const candidates = extractAllPotentialTCs(ocrText);
            console.log(`   🔢 Bulunan adaylar: ${candidates.length > 0 ? candidates.map(c => c.substring(0, 3) + '***').join(', ') : 'Yok'}`);

            // Algoritma ile doğrula
            for (const candidate of candidates) {
                if (isValidTCKimlikNo(candidate)) {
                    console.log(`   ✅ GEÇERLİ TC BULUNDU! Strateji: ${strategy.name}`);
                    result.success = true;
                    result.tcKimlikNo = candidate;
                    result.rawText = ocrText;
                    result.strategy = strategy.name;

                    // Dosyaları temizle ve dön
                    await cleanupProcessedFiles(processedFiles);
                    return result;
                }
            }

            // Algoritma geçersiz ama 11 haneli sayı varsa kaydet (yedek)
            if (!result.tcKimlikNo && candidates.length > 0) {
                result.tcKimlikNo = candidates[0];
                result.rawText = ocrText;
                result.strategy = strategy.name;
            }
        }

        // Hiçbir strateji geçerli TC bulamadı ama aday varsa
        if (result.tcKimlikNo) {
            console.log(`\n⚠️ Algoritma doğrulaması geçemedi ama 11 haneli sayı bulundu`);
            result.success = true; // Yine de kullanıcıya dene
            result.error = null;
        } else {
            console.log(`\n❌ Hiçbir strateji TC bulamadı`);
            result.error = 'Kimlik kartında TC Kimlik Numarası bulunamadı. Lütfen TC numarasının net göründüğü, düz açılı bir fotoğraf yükleyin.';
        }

        return result;

    } catch (error) {
        console.error('❌ TC OCR Hatası:', error);
        result.error = error.message;
        return result;
    } finally {
        // Tüm işlenmiş dosyaları temizle
        await cleanupProcessedFiles(processedFiles);
    }
}

module.exports = {
    readTCFromIdCard,
    isValidTCKimlikNo,
    extractAllPotentialTCs,
    PREPROCESSING_STRATEGIES
};
