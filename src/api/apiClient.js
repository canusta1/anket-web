import axios from 'axios';

// API URL - Environment variable veya varsayılan değer
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Axios instance oluştur
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 saniye zaman aşımı
});

// Request Interceptor: Her isteğe otomatik Token ekle
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 401 hatalarını yakala ve oturumu kapat
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized hatası ve login sayfasında değilsek
    if (error.response && error.response.status === 401) {
      // Sadece token hatası ise logout yap (login denenirken olmaması için kontrol edilebilir)
      // Ancak basitlik için her zaman temizleyelim
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/giris')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/giris';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
