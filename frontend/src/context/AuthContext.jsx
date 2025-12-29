import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = () => {
      const token = localStorage.getItem('access_token');
      if (token) setUser({ username: 'Student' });
      setLoading(false);
    };
    checkLogin();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('token/', { username, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setUser({ username });
      return { success: true };
    } catch (error) {
      return { success: false, error: "Invalid credentials" };
    }
  };

  const register = async (username, email, password) => {
    try {
      await api.post('attendance/register/', { username, email, password });
      return await login(username, password); // Auto-login
    } catch (error) {
      // Improved Error Handling
      let msg = "Registration failed.";
      if (error.response?.data?.username) msg = error.response.data.username[0];
      else if (error.response?.data?.password) msg = error.response.data.password[0];
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};