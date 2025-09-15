import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Esta função será chamada UMA VEZ para configurar os interceptors.
export const setupInterceptors = (logoutCallback) => {
  
  // Interceptor de Requisição (Request)
  api.interceptors.request.use(
    (config) => {
      // --- A CORREÇÃO DEFINITIVA ---
      // Lemos o token direto do localStorage a cada requisição.
      // Isso é síncrono e garante que sempre teremos o token mais recente,
      // eliminando a condição de corrida com o estado do React.
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor de Resposta (Response)
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        console.error("Token inválido ou expirado. Deslogando...");
        if (typeof logoutCallback === 'function') {
          logoutCallback();
        }
      }
      return Promise.reject(error);
    }
  );
};

export default api;