import React, { useState } from "react";
import "./Auth.css";
import { Link, useNavigate } from "react-router-dom";

function UyeOl() {
  const [firstName, setFirst] = useState("");
  const [lastName, setLast]   = useState("");
  const [tckn, setTckn]       = useState("");
  const [phone, setPhone]     = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [agreeLoc, setAgreeLoc]   = useState(false);
  const [agreeKvkk, setAgreeKvkk] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!agreeLoc || !agreeKvkk) return alert("Lütfen tüm onayları işaretleyin.");
    if (tckn && !/^\d{11}$/.test(tckn)) return alert("TC Kimlik No 11 haneli olmalıdır.");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, tckn, phone, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız");
      alert("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz.");
      navigate("/giris");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Üye Ol</h2>
        <form onSubmit={onSubmit}>
          <label>İsim</label>
          <input type="text" placeholder="Adınızı girin"
                 value={firstName} onChange={(e)=>setFirst(e.target.value)} required />

          <label>Soyisim</label>
          <input type="text" placeholder="Soyadınızı girin"
                 value={lastName} onChange={(e)=>setLast(e.target.value)} required />

          <label>TC Kimlik No</label>
          <input type="text" placeholder="11 haneli kimlik numaranız" maxLength="11"
                 value={tckn} onChange={(e)=>setTckn(e.target.value)} />

          <label>Telefon Numarası</label>
          <input type="tel" placeholder="05XX XXX XX XX"
                 value={phone} onChange={(e)=>setPhone(e.target.value)} />

          <label>E-posta Adresi</label>
          <input type="email" placeholder="E-posta adresinizi girin"
                 value={email} onChange={(e)=>setEmail(e.target.value)} required />

          <label>Şifre</label>
          <input type="password" placeholder="Şifrenizi girin"
                 value={password} onChange={(e)=>setPass(e.target.value)} required />

          <div className="checkbox-group">
            <label>
              <input type="checkbox" checked={agreeLoc}
                     onChange={(e)=>setAgreeLoc(e.target.checked)} required />
              {" "}Konumumun kullanılmasına onay veriyorum
            </label>
            <label>
              <input type="checkbox" checked={agreeKvkk}
                     onChange={(e)=>setAgreeKvkk(e.target.checked)} required />
              {" "}KVKK metnini okudum ve onaylıyorum
            </label>
          </div>

          <button type="submit" className="btn-green" disabled={loading}>
            {loading ? "Gönderiliyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p style={{ marginTop: 15 }}>
          Zaten hesabınız var mı? <Link to="/giris">Giriş Yap</Link>
        </p>
      </div>
    </div>
  );
}
export default UyeOl;
