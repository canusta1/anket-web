import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';


import Anasayfa from './anasayfa';
import Giris from './Giris';
import UyeOl from './UyeOl';
import Panel from './Panel';
import AnketOlustur from './AnketOlustur';
import SifirdanAnket from './SifirdanAnket';
import Profil from './Profil';


console.log('🔍 Anasayfa.js import ediliyor...');
console.log('✅ Anasayfa:', Anasayfa);

console.log('🔍 Giris.js import ediliyor...');
console.log('✅ Giris:', Giris);

console.log('🔍 UyeOl.js import ediliyor...');
console.log('✅ UyeOl:', UyeOl);

console.log('🔍 Panel.js import ediliyor...');
console.log('✅ Panel:', Panel);

console.log('🔍 AnketOlustur.js import ediliyor...');
console.log('✅ AnketOlustur:', AnketOlustur);

console.log('🔍 SifirdanAnket.js import ediliyor...');
console.log('✅ SifirdanAnket:', SifirdanAnket);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Anasayfa />} />
        <Route path="/giris" element={<Giris />} />
        <Route path="/uyeol" element={<UyeOl />} />
        <Route path="/panel" element={<Panel />} />
        <Route path="/anket-olustur" element={<AnketOlustur />} />
        <Route path="/sifirdan-anket" element={<SifirdanAnket />} />
        <Route path="/profil" element={<Profil />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);