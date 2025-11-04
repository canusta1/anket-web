import React, { useState } from "react";
import "./Auth.css";
import { Link, useNavigate } from "react-router-dom";

function Giris() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // örnek sabit kullanıcı
  const correctUser = {
    email: "a@a.com",
    password: "a",
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("📝 Form gönderildi");
    console.log("📧 Email:", email);
    console.log("🔐 Password:", password);

    if (email === correctUser.email && password === correctUser.password) {
      console.log("✅ Giriş başarılı, yönlendiriliyor...");
      alert("Giriş başarılı! 🎉");
      navigate("/panel"); // anapanele yönlendir
    } else {
      console.log("❌ Giriş başarısız");
      alert("E-posta veya şifre hatalı!");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Oturum Aç</h2>
        <p>
          Hesabınız yok mu? <Link to="/uyeol">Kaydol</Link>
        </p>

        <form onSubmit={handleSubmit}>
          <label>E-posta adresi</label>
          <input
            type="email"
            placeholder="E-posta adresinizi girin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Şifre</label>
          <input
            type="password"
            placeholder="Şifrenizi girin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-green">Giriş Yap</button>
        </form>

        <div className="divider">veya</div>

        <div className="social-login">
          <button className="social-btn microsoft">Microsoft</button>
          <button className="social-btn facebook">Facebook</button>
          <button className="social-btn linkedin">LinkedIn</button>
          <button className="social-btn google">Google</button>
          <button className="social-btn apple">Apple</button>
        </div>
      </div>
    </div>
  );
}

export default Giris;