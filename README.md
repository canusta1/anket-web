# 🛡️ SurvAI - Web Client (anket-web)

**Yapay Zeka Destekli ve Çok Faktörlü Doğrulamalı (MFA) Güvenli Anket Platformu**

SurvAI, anket manipülasyonlarını engellemek ve sadece **gerçek kullanıcıların** veri girişini garanti altına almak için tasarlanmış uçtan uca güvenli bir platformdur. Bu depo, projenin **React.js** ile geliştirilmiş kullanıcı arayüzü (Frontend) tarafını içermektedir.

### 🚀 Öne Çıkan Mühendislik Özellikleri
- **Biyometrik Yüz Doğrulama:** Kamera entegrasyonu ile anketi dolduran kişinin gerçek bir insan olup olmadığını analiz eden bilgisayarlı görü (Computer Vision) katmanı.
- **Çok Faktörlü Kimlik Doğrulama (MFA):** E-posta ve SMS tabanlı OTP (One-Time Password) doğrulama süreçleriyle kullanıcı izolasyonu.
- **Yapay Zeka Destekli Analiz:** Toplanan verilerin Groq AI ve Büyük Dil Modelleri (LLM) ile anlamlandırılması.
- **Modern ve Reaktif Arayüz:** Kullanıcı deneyimini kesintiye uğratmayan, asenkron backend iletişimine sahip modern React mimarisi.

### 🛠️ Kullanılan Teknolojiler (Frontend Ekosistemi)
- **Framework:** React.js
- **State Management:** Context API / Redux (Projeye göre uyarlanmıştır)
- **Güvenlik İletişimi:** JWT (JSON Web Token) tabanlı güvenli oturum yönetimi
- **Backend Entegrasyonu:** RESTful API (Node.js & Express.js ile haberleşir)

---

### ⚙️ Kurulum ve Çalıştırma (Geliştiriciler İçin)

Projeyi kendi bilgisayarınızda (lokal ortamda) ayağa kaldırmak için aşağıdaki adımları izleyebilirsiniz:

**1. Repoyu Klonlayın:**
```bash
git clone [https://github.com/canusta1/anket-web.git](https://github.com/canusta1/anket-web.git)
cd anket-web
