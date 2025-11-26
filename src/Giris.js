import React, { useState } from "react";
import "./Auth.css";
import { Link, useNavigate } from "react-router-dom";

function Giris() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // use relative URL so CRA dev server proxy (package.json) forwards to backend
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Giriş başarısız");

      // Token sakla — backend korumalı endpointlerde kullanacağız
      localStorage.setItem("token", data.token);
      // İstersen user da saklayabilirsin:
      // localStorage.setItem("me", JSON.stringify(data.user));

      navigate("/panel");
    } catch (err) {
      setError(err.message);
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

          {error && <div className="error-text">{error}</div>}

          <button type="submit" className="btn-green" disabled={loading}>
            {loading ? "Gönderiliyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="divider">veya</div>

        <div className="social-login">
          <button className="social-btn microsoft" type="button">Microsoft</button>
          <button className="social-btn facebook"   type="button">Facebook</button>
          <button className="social-btn linkedin"   type="button">LinkedIn</button>
          <button className="social-btn google"     type="button">Google</button>
          <button className="social-btn apple"      type="button">Apple</button>
        </div>
      </div>
    </div>
  );
}

export default Giris;
