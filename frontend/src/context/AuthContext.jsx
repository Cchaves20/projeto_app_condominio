import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { setupInterceptors } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : null;
  });
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setAccessToken(null);
    setUserProfile(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userProfile');
    navigate('/login');
  }, [navigate]);
  
  useEffect(() => {
    setupInterceptors(logout);
  }, [logout]);

  const login = (tokens, profile) => {
    if (tokens?.access && profile) {
      setAccessToken(tokens.access);
      setUserProfile(profile);
      localStorage.setItem('accessToken', tokens.access);
      localStorage.setItem('userProfile', JSON.stringify(profile));
    }
  };

  const isAuthenticated = !!accessToken;
  const userType = userProfile?.tipo_usuario || null;

  const value = { isAuthenticated, accessToken, userType, userProfile, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};