import React, { useState } from "react";
import "./Auth.css"; // Eğer css dosyanın adı farklıysa düzelt
import { Link, useNavigate } from "react-router-dom";

function Giris() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      // Backend'den { error: "..." } dönerse buraya girer
      if (!res.ok) {
        throw new Error(data.error || "Giriş başarısız");
      }

      // BAŞARILI: Token'ı tarayıcıya kaydet
      // Bu token, ileride anket oluştururken "Ben kimim?" ispatı olacak.
      localStorage.setItem("token", data.token);

      // Kullanıcı bilgisini de saklayabilirsin
      localStorage.setItem("user", JSON.stringify(data.user));

      // Panele yönlendir
      navigate("/panel");

    } catch (err) {
      console.error("Giriş Hatası Detayı:", err);
      // Eğer hata "Failed to fetch" ise sunucu kapalı demektir, kullanıcıyı uyaralım.
      if (err.message === "Failed to fetch") {
        setError("Sunucuya ulaşılamadı. Backend'i başlattığınızdan emin olun.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Oturum Aç</h2>
        <p>Hesabınız yok mu? <Link to="/uyeol">Kaydol</Link></p>

        <form onSubmit={handleSubmit}>
          <label>E-posta adresi</label>
          <input
            type="email"
            placeholder="E-posta adresinizi girin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <label>Şifre</label>
          <input
            type="password"
            placeholder="Şifrenizi girin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && <div className="error-text" style={{ color: "red", marginBottom: "10px" }}>{error}</div>}

          <button type="submit" className="btn-green" disabled={loading}>
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="divider">veya</div>

        <div className="social-login">
          {/* Sosyal medya butonları şimdilik görsel kalabilir */}
          <button className="social-btn google" type="button">Google</button>
        </div>
      </div>
    </div>
  );
}

export default Giris;