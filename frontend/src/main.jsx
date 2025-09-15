// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* --- A CORREÇÃO PRINCIPAL ESTÁ AQUI --- */}
    {/* 1. O BrowserRouter deve ser o componente mais externo */}
    <BrowserRouter>
      {/* 2. O AuthProvider fica DENTRO do BrowserRouter */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
    {/* --- FIM DA CORREÇÃO --- */}
  </React.StrictMode>,
);