// frontend/src/App.jsx

import React from 'react'; // Removido useEffect e useNavigate
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
// Removida a importação de setupInterceptors

// Importação das suas páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import Painel from './pages/Painel';
import OfertasPage from './pages/OfertasPage';
import FavoritosPage from './pages/FavoritosPage';
import CarrinhoPage from './pages/CarrinhoPage';
import HistoricoPedidosPage from './pages/HistoricoPedidosPage';
import EnderecosPage from './pages/EnderecosPage';
import AcompanharPedidoPage from './pages/AcompanharPedidoPage';
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const { isAuthenticated, logout, userType } = useAuth();
  
  // O useEffect que chamava setupInterceptors foi REMOVIDO daqui.

  const handleLogout = () => {
    logout();
  };

  return (
    <div>
      <nav>
        <ul>
          {isAuthenticated ? (
            <>
              <li><Link to="/perfil">Meu Perfil</Link></li>
              <li><Link to="/painel">Meu Painel</Link></li>
              
              {userType === 'SINDICO' && (
                <>
                  <li><Link to="/ofertas">Ofertas</Link></li>
                  <li><Link to="/favoritos">Favoritos</Link></li>
                  <li><Link to="/carrinho">Carrinho</Link></li>
                  <li><Link to="/historico">Histórico</Link></li>
                  <li><Link to="/enderecos">Endereços</Link></li>
                </>
              )}

              <li>
                <button onClick={handleLogout}>Sair</button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/criar-conta">Criar Conta</Link></li>
            </>
          )}
        </ul>
      </nav>
      <hr />
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/criar-conta" element={<RegisterPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/password-reset/:uid/:token" element={<ResetPasswordPage />} />
        <Route path="/" element={isAuthenticated ? <Painel /> : <LoginPage />} />
        
        {/* Rotas Protegidas */}
        <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/painel" element={<ProtectedRoute><Painel /></ProtectedRoute>} />
        <Route path="/ofertas" element={<ProtectedRoute><OfertasPage /></ProtectedRoute>} />
        <Route path="/favoritos" element={<ProtectedRoute><FavoritosPage /></ProtectedRoute>} />
        <Route path="/carrinho" element={<ProtectedRoute><CarrinhoPage /></ProtectedRoute>} />
        <Route path="/historico" element={<ProtectedRoute><HistoricoPedidosPage /></ProtectedRoute>} />
        <Route path="/acompanhar-pedido/:pedidoId" element={<ProtectedRoute><AcompanharPedidoPage /></ProtectedRoute>} />
        <Route path="/enderecos" element={<ProtectedRoute><EnderecosPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;