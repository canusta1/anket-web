import React from "react";
import "./Auth.css";
import { Link } from "react-router-dom";

function UyeOl() {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Üye Ol</h2>
        <form>
          <label>İsim</label>
          <input type="text" placeholder="Adınızı girin" required />

          <label>Soyisim</label>
          <input type="text" placeholder="Soyadınızı girin" required />

          <label>TC Kimlik No</label>
          <input type="text" placeholder="11 haneli kimlik numaranız" maxLength="11" required />

          <label>Telefon Numarası</label>
          <input type="tel" placeholder="05XX XXX XX XX" required />

          <label>E-posta Adresi</label>
          <input type="email" placeholder="E-posta adresinizi girin" required />

          <div className="checkbox-group">
            <label>
              <input type="checkbox" required /> Konumumun kullanılmasına onay veriyorum
            </label>
            <label>
              <input type="checkbox" required /> KVKK metnini okudum ve onaylıyorum
            </label>
          </div>

          <button type="submit" className="btn-green">Kayıt Ol</button>
        </form>

        <p style={{ marginTop: "15px" }}>
          Zaten hesabınız var mı? <Link to="/giris">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}

export default UyeOl;
