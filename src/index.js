import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Navigate bileşenini de ekledik
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Anasayfa from './anasayfa'; // Dosya adının büyük/küçük harf uyumuna dikkat (Anasayfa.js ise burası da Anasayfa olmalı)
import Giris from './Giris';
import UyeOl from './UyeOl';
import Panel from './Panel';
import AnketOlustur from './AnketOlustur';
import SifirdanAnket from './SifirdanAnket';
import AIileAnket from './AIileAnket';
import HedefKitleSecimi from './HedefKitleSecimi';
import Profil from './Profil';
import AnketCoz from "./AnketCoz";

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 1. KURAL: Siteye ilk gireni (root) direkt /anasayfa adresine fırlat */}
        <Route path="/" element={<Navigate to="/anasayfa" replace />} />

        {/* 2. KURAL: Anasayfa tasarımı sadece bu adreste çalışsın */}
        <Route path="/anasayfa" element={<Anasayfa />} />

        {/* 3. KURAL: Panel sayfası */}
        <Route path="/panel" element={<Panel />} />

        {/* Diğer sayfalar */}
        <Route path="/giris" element={<Giris />} />
        <Route path="/uyeol" element={<UyeOl />} />
        <Route path="/anket-olustur" element={<AnketOlustur />} />
        <Route path="/sifirdan-anket" element={<SifirdanAnket />} />
        <Route path="/ai-ile-anket" element={<AIileAnket />} />
        <Route path="/hedef-kitle-secimi" element={<HedefKitleSecimi />} />
        <Route path="/profil" element={<Profil />} />
        <Route path="/anket/:id" element={<AnketCoz />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);