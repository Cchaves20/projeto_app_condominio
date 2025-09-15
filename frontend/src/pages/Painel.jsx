// frontend/src/pages/Painel.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

// Importe todos os painéis que serão usados
import FornecedorDashboard from './FornecedorDashboard';
import ProductsPage from './ProductsPage'; // Este é o painel do Síndico
import EntregadorDashboard from './EntregadorDashboard';

function Painel() {
  const { userType, isAuthenticated } = useAuth();

  console.log("Painel renderizado. UserType atual:", userType);
  
  // Medida de segurança caso o componente renderize antes da autenticação ser confirmada
  if (!isAuthenticated || !userType) {
    return <p>Carregando seu painel...</p>;
  }

  // **AQUI ESTÁ A LÓGICA CORRIGIDA E COMPLETA**
  // Verifica o tipo de usuário e renderiza o painel correto

  if (userType === 'FORNECEDOR') {
    return <FornecedorDashboard />;
  }
  
  if (userType === 'SINDICO') {
    return <ProductsPage />;
  }
  
  if (userType === 'ENTREGADOR') {
    return <EntregadorDashboard />;
  }
  
  // Se o userType for desconhecido, mostra uma mensagem de erro/carregamento
  return <p>Tipo de usuário desconhecido. Por favor, contate o suporte.</p>;
}

export default Painel;