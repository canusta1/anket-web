import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Anasayfa from './anasayfa';
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
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/anasayfa" replace />} />
      <Route path="/anasayfa" element={<Anasayfa />} />
      <Route path="/panel" element={<Panel />} />
      <Route path="/giris" element={<Giris />} />
      <Route path="/uyeol" element={<UyeOl />} />
      <Route path="/anket-olustur" element={<AnketOlustur />} />
      <Route path="/sifirdan-anket" element={<SifirdanAnket />} />
      <Route path="/ai-ile-anket" element={<AIileAnket />} />
      <Route path="/hedef-kitle-secimi" element={<HedefKitleSecimi />} />
      <Route path="/profil" element={<Profil />} />
      <Route path="/anket-coz/:linkKodu" element={<AnketCoz />} />
    </Routes>
  </BrowserRouter>
);