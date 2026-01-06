// Switch to Groq SDK implementation
const Groq = require("groq-sdk");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

let client;

if (!GROQ_API_KEY) {
    console.warn("⚠️  GROQ_API_KEY not set - AI requests will fail until you set it in .env");
} else {
    try {
        client = new Groq({ apiKey: GROQ_API_KEY });
        console.log("✅ Groq client başarıyla başlatıldı");
    } catch (error) {
        console.error("❌ Groq client initialization error:", error.message);
    }
}

const generateSurveyQuestions = async (topic, questionCount) => {
    console.log(`🔍 AI Servisi çağrıldı: ${topic}, ${questionCount} soru`);

    if (!client) {
        console.error('❌ Groq client başlatılamadı');
        throw new Error("Groq client not initialized - GROQ_API_KEY is missing");
    }

    console.log('✅ Groq client hazır');

    // Parse topic untuk özel koşulları ayıkla
    const topicLower = topic.toLowerCase();
    let questionTypes = ["acik-uclu", "coktan-tek", "coktan-coklu", "slider"];

    // Eğer "açık uçlu" belirtilmişse, sadece açık uçlu soruları kullan
    if (topicLower.includes("açık uçlu")) {
        questionTypes = ["acik-uclu"];
    } else if (topicLower.includes("çoktan seçmeli")) {
        questionTypes = ["coktan-tek", "coktan-coklu"];
    }

    const systemMessage = `Sen bir anket oluşturma API'sisin. SADECE geçerli JSON döndür. Markdown, açıklama, başlık veya ek metin ASLA ekleme. Çıktın doğrudan JSON.parse() ile işlenecek.`;

    const userMessage = `"${topic}" konusunda ${questionCount} soruluk profesyonel bir anket oluştur.

KURALLAR:
- Soru tipleri: single_select, multi_select, rating, text
- Sorular Türkçe ve yönlendirmeden uzak olmalı
- SADECE aşağıdaki JSON formatında yanıt ver, BAŞKA HİÇBİR ŞEY YAZMA

{"surveyTitle":"...","surveyDescription":"...","questions":[{"id":1,"text":"...","type":"single_select","options":["A","B","C"],"isRequired":true}]}`;

    try {
        console.log('📤 Groq API isteği gönderiliyor...');

        const resp = await client.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userMessage }
            ],
            max_tokens: 3500,
            temperature: 0.4,
        });

        console.log('✅ Groq API yanıtı alındı');

        let text = resp.choices[0].message.content;
        console.log('📝 AI Yanıtı (ilk 500 karakter):', text.substring(0, 500));

        // Markdown code block temizle
        text = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');

        // JSON bulup çıkart - daha esnek regex
        let jsonMatch = text.match(/\{[\s\S]*\}/);
        let jsonStr = jsonMatch ? jsonMatch[0] : null;

        if (!jsonStr) {
            console.error('❌ JSON eşleşme bulunamadı, yanıtın tamamı:', text);
            throw new Error("AI yanıtından JSON çıkarılamadı - yanıt geçerli JSON içermiyor");
        }

        // JSON'u temizle ve parse et
        let parsedData;
        try {
            // Kaçan karakterleri düzelt
            jsonStr = jsonStr
                .replace(/[\n\r]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            // Kesik JSON'u tamamlamaya çalış
            let openBraces = (jsonStr.match(/\{/g) || []).length;
            let closeBraces = (jsonStr.match(/\}/g) || []).length;
            let openBrackets = (jsonStr.match(/\[/g) || []).length;
            let closeBrackets = (jsonStr.match(/\]/g) || []).length;

            // Eksik parantezleri ekle
            while (closeBrackets < openBrackets) {
                jsonStr += ']';
                closeBrackets++;
            }
            while (closeBraces < openBraces) {
                jsonStr += '}';
                closeBraces++;
            }

            // Trailing comma düzelt
            jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

            parsedData = JSON.parse(jsonStr);
            console.log('✅ JSON parse başarılı');

            // Validasyon: questions array mi?
            if (!Array.isArray(parsedData.questions)) {
                throw new Error("Questions array olmalı");
            }

            if (parsedData.questions.length === 0) {
                throw new Error("En az 1 soru olmalı");
            }
        } catch (parseError) {
            console.error('❌ JSON parsing hatası:', parseError.message);
            console.error('📄 Parse edilen string:', jsonStr.substring(0, 200));
            throw parseError;
        }

        // İstenen soru sayısına kes (AI fazla soru üretebiliyor)
        const questionsSliced = (parsedData.questions || []).slice(0, questionCount);

        // Tip normalizasyonu - AI yanlış tip üretirse düzelt (İngilizce -> Türkçe)
        const tipMapping = {
            "single_select": "coktan-tek",
            "multi_select": "coktan-coklu",
            "rating": "slider",
            "text": "acik-uclu",
            // Eski Türkçe tipler için backward compatibility
            "acik-uclu": "acik-uclu",
            "açık-uçlu": "acik-uclu",
            "açık uçlu": "acik-uclu",
            "coktan-tek": "coktan-tek",
            "çoktan-tek": "coktan-tek",
            "çoktan seçmeli": "coktan-tek",
            "tek-seçmeli": "coktan-tek",
            "coktan-coklu": "coktan-coklu",
            "çoktan-çoklu": "coktan-coklu",
            "çok-seçmeli": "coktan-coklu",
            "slider": "slider"
        };

        const sorularWithIds = questionsSliced.map((question, index) => {
            const normalizedTip = tipMapping[question.type?.toLowerCase()] || "acik-uclu";

            return {
                id: Date.now() + index,
                metin: question.text || "",
                tip: normalizedTip,
                secenekler: question.options || [],
                zorunlu: question.isRequired !== false,
            };
        });

        console.log('🎉 Anket başarıyla oluşturuldu, istenilen soru:', questionCount, 'alınan soru:', sorularWithIds.length);
        return {
            anketBaslik: parsedData.surveyTitle || topic,
            sorular: sorularWithIds,
        };

    } catch (error) {
        console.error('❌ Groq Servisi Hatası Detayı:', error);
        console.error('❌ Error stack:', error.stack);
        throw new Error(`AI ile anket oluşturulamadı: ${error.message}`);
    }
};

const analyzeSurveyResponses = async (anketData, cevaplar) => {
    if (!client) {
        throw new Error("Groq client not initialized - GROQ_API_KEY is missing");
    }

    const prompt = `Sen bir veri analisti ve doğal dil işleme uzmanısın. Aşağıdaki anket verilerini analiz et.\n\nANKET BİLGİSİ:\nBaşlık: ${anketData.baslik}\nSoru Sayısı: ${anketData.sorular.length}\nKatılımcı Sayısı: ${cevaplar.length}\n\nSORULAR:\n${JSON.stringify(anketData.sorular, null, 2)}\n\nCEVAPLAR:\n${JSON.stringify(cevaplar, null, 2)}\n\nLütfen SADECE aşağıdaki JSON formatında detaylı bir analiz hazırla:

{
  "summary": "Genel özet",
  "keyFindings": ["Bulgu 1", "Bulgu 2"],
  "recommendations": ["Öneri 1", "Öneri 2"],
  "statistics": {
    "totalResponses": 0,
    "responseRate": "0%"
  }
}`;

    try {
        console.log('📤 Groq Analiz isteği gönderiliyor...');

        const resp = await client.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 4000,
            temperature: 0.3,
        });

        const text = resp.choices[0].message.content;
        console.log('📝 Analiz Yanıtı:', text);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Analiz sonucu JSON formatında değil");
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("Analiz Hatası (Groq):", error);
        throw new Error(`Analiz yapılamadı: ${error.message}`);
    }
};

module.exports = {
    generateSurveyQuestions,
    analyzeSurveyResponses,
    analyzeWithGroq: async (prompt) => {
        if (!client) {
            throw new Error("Groq client not initialized - GROQ_API_KEY is missing");
        }

        try {
            console.log('📤 Groq Analiz isteği gönderiliyor...');

            const resp = await client.chat.completions.create({
                model: GROQ_MODEL,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1000,
                temperature: 0.7,
            });

            const text = resp.choices[0].message.content;
            console.log('📝 AI Analiz Yanıtı:', text);
            return text;
        } catch (error) {
            console.error("❌ AI Analiz Hatası (Groq):", error);
            throw new Error(`Analiz yapılamadı: ${error.message}`);
        }
    }
};