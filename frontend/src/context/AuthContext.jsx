// frontend/src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// setupInterceptors deve estar no seu arquivo de configuração do Axios (ex: apiClient.js)
import { setupInterceptors } from '../api/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Inicializa o estado buscando os dados do localStorage.
  // A função no useState só é executada na primeira renderização, o que é ótimo para performance.
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('userProfile');
    return savedProfile ? JSON.parse(savedProfile) : null;
  });
  const navigate = useNavigate();

  // A função de logout é envolvida em `useCallback` para evitar recriações desnecessárias.
  // Isso é importante porque ela é uma dependência do `useEffect` abaixo.
  const logout = useCallback(() => {
    setAccessToken(null);
    setUserProfile(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userProfile');
    navigate('/login');
  }, [navigate]);
  
  // Este useEffect garante que os interceptors do Axios sejam configurados
  // assim que o contexto for montado, passando a função de logout para eles.
  useEffect(() => {
    setupInterceptors(logout);
  }, [logout]);

  // --- CORREÇÃO PRINCIPAL AQUI ---
  // A função agora aceita `accessToken` como uma string, e não mais um objeto.
  const login = (accessToken, profile) => {
    // Verificamos se ambos os dados necessários foram recebidos.
    if (accessToken && profile) {
      setAccessToken(accessToken);
      setUserProfile(profile);
      // Salva os dados no localStorage para manter o usuário logado entre sessões.
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userProfile', JSON.stringify(profile));
    }
  };

  // Valores derivados do estado para facilitar o uso em outros componentes.
  const isAuthenticated = !!accessToken;
  const userType = userProfile?.tipo_usuario || null; // Uso seguro com optional chaining.

  // O valor que será provido para todos os componentes filhos.
  const value = { isAuthenticated, accessToken, userType, userProfile, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook customizado para facilitar o consumo do contexto.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};