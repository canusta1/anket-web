import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // İlk yüklemede kullanıcı bilgisini kontrol et
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Token geçerliliğini kontrol edebiliriz (opsiyonel)
        // try {
        //   await AuthService.getProfile();
        // } catch (e) {
        //   logout();
        // }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await AuthService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await AuthService.register(userData);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const googleLogin = async (googleData) => {
    const data = await AuthService.googleLogin(googleData);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    AuthService.logout();
    setToken(null);
    setUser(null);
  };

  const updateUser = (newUser) => {
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
