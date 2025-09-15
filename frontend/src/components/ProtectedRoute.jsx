// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Se o usuário não está autenticado, redirecione para a página de login
    return <Navigate to="/login" replace />;
  }

  // Se está autenticado, renderize o componente filho (a página de produtos)
  return children;
}

export default ProtectedRoute;