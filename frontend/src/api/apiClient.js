// src/api/apiClient.js
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 20000,
});

// A função que será chamada pelo AuthContext para configurar os interceptors
export const setupInterceptors = (logout) => {
  let isRefreshing = false;
  let failedQueue = [];

  const processQueue = (error, token = null) => {
    failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    failedQueue = [];
  };

  apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  apiClient.interceptors.response.use(
    res => res,
    async error => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return apiClient(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) throw new Error("No refresh token found");

          // Nota: Usando 'axios' global aqui para evitar um loop de interceptor
          // caso a própria requisição de refresh falhe com 401.
          const response = await axios.post(`${baseURL}/auth/token/refresh/`, {
            refresh: refreshToken
          });

          const newAccessToken = response.data.access;
          if (!newAccessToken) throw new Error("No new access token returned");

          localStorage.setItem("accessToken", newAccessToken);

          // REFINAMENTO: Removida a linha 'api.defaults.headers.common'.
          // O interceptor de *request* já vai pegar o novo token do localStorage na nova tentativa.

          processQueue(null, newAccessToken);
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`; // Adiciona o header na requisição que será tentada novamente
          return apiClient(originalRequest);

        } catch (err) {
          // --- CORREÇÃO PRINCIPAL AQUI ---
          // Em vez de manipular o localStorage e a janela diretamente,
          // chamamos a função de logout que o AuthContext nos deu.
          processQueue(err, null);
          logout(); // <-- O AuthContext cuidará de limpar o storage e redirecionar
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

export default apiClient;