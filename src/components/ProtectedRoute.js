import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - Korumalı sayfa wrapper'ı (AuthContext ile)
 */
function ProtectedRoute({ children }) {
  const { loading, token } = useAuth();
  const location = useLocation();

  // Yükleniyor durumu
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#0a0f14'
      }}>
        <div style={{ color: '#00d4aa' }} className="spinner"></div>
      </div>
    );
  }

  // Authenticated değilse login'e yönlendir
  if (!token) {
    return <Navigate to="/giris" state={{ from: location }} replace />;
  }

  // Authenticated ise children'ı render et
  return children;
}

export default ProtectedRoute;
