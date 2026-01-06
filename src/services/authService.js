import apiClient from '../api/apiClient';

/**
 * Kimlik doğrulama servisleri
 */
const AuthService = {
  // Giriş Yap
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Kayıt Ol (Doğrulama kodu ile)
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Doğrulama Kodu Gönder
  sendCode: async (email, firstName) => {
    const response = await apiClient.post('/auth/send-code', { email, firstName });
    return response.data;
  },

  // Google ile Giriş
  googleLogin: async (googleData) => {
    const response = await apiClient.post('/auth/google', googleData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Çıkış Yap
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Profil Bilgilerini Getir
  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  
  // Profil Güncelle
  updateProfile: async (userData) => {
    const response = await apiClient.put('/auth/me', userData);
    // Güncellenmiş kullanıcı bilgisini localStorage'a da kaydet
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  }
};

export default AuthService;
