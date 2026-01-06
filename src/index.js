import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy Load Components
const Anasayfa = lazy(() => import('./anasayfa'));
const Giris = lazy(() => import('./Giris'));
const UyeOl = lazy(() => import('./UyeOl'));
const Panel = lazy(() => import('./Panel'));
const AnketOlustur = lazy(() => import('./AnketOlustur'));
const SifirdanAnket = lazy(() => import('./SifirdanAnket'));
const AIileAnket = lazy(() => import('./AIileAnket'));
const HedefKitleSecimi = lazy(() => import('./HedefKitleSecimi'));
const Profil = lazy(() => import('./Profil'));
const AnketCoz = lazy(() => import('./AnketCoz'));
const AnketSonuclari = lazy(() => import('./AnketSonuclari'));
const AnketDetay = lazy(() => import('./AnketDetay'));
const AnketKopyala = lazy(() => import('./AnketKopyala'));
const SorulariYapistir = lazy(() => import('./SorulariYapistir'));

const root = ReactDOM.createRoot(document.getElementById('root'));

// Google Client ID - .env dosyasından okur
const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

// Loading Component
const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0a0f14', color: '#00d4aa' }}>
    <div className="spinner"></div> Yükleniyor...
  </div>
);

root.render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/anasayfa" replace />} />
            <Route path="/anasayfa" element={<Anasayfa />} />
            <Route path="/giris" element={<Giris />} />
            <Route path="/uyeol" element={<UyeOl />} />
            <Route path="/anket-coz/:linkKodu" element={<AnketCoz />} />
            
            {/* Protected Routes - Login gerektirenler */}
            <Route path="/panel" element={<ProtectedRoute><Panel /></ProtectedRoute>} />
            <Route path="/anket-olustur" element={<ProtectedRoute><AnketOlustur /></ProtectedRoute>} />
            <Route path="/anket-kopyala" element={<ProtectedRoute><AnketKopyala /></ProtectedRoute>} />
            <Route path="/sorulari-yapistir" element={<ProtectedRoute><SorulariYapistir /></ProtectedRoute>} />
            <Route path="/sifirdan-anket" element={<ProtectedRoute><SifirdanAnket /></ProtectedRoute>} />
            <Route path="/ai-ile-anket" element={<ProtectedRoute><AIileAnket /></ProtectedRoute>} />
            <Route path="/hedef-kitle-secimi" element={<ProtectedRoute><HedefKitleSecimi /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
            <Route path="/anket-sonuclari" element={<ProtectedRoute><AnketSonuclari /></ProtectedRoute>} />
            <Route path="/anket-sonuclari/:id" element={<ProtectedRoute><AnketSonuclari /></ProtectedRoute>} />
            <Route path="/anket-detay/:id" element={<ProtectedRoute><AnketDetay /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </GoogleOAuthProvider>
);
