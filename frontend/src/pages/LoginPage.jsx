import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true); // Manter se você for usar depois
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // --- ALTERAÇÃO PRINCIPAL AQUI: Enviar como JSON ---
            // O Axios envia automaticamente como application/json quando você passa um objeto JS
            const response = await api.post('/auth/login', {
                username: username, // Nomes dos campos devem corresponder ao seu Pydantic Login schema
                password: password,
            });
            
            // 2. Extraímos o token. A rota de login do FastAPI que eu sugeri
            // retorna { "access_token": "...", "token_type": "bearer" }.
            // Se você quiser o perfil do usuário na mesma resposta, seu backend
            // precisaria ser modificado para incluir o perfil.
            // Por enquanto, vamos assumir que apenas o token é retornado.
            const accessToken = response.data.access_token;
            
            // Se o seu backend também retornar o perfil na resposta de login (ex: {access_token: ..., profile: {...}}),
            // você pode extraí-lo aqui:
            // const userProfile = response.data.profile; 
            
            // --- IMPORTANTE: Como sua rota de login do backend NÃO retorna o userProfile diretamente
            // com o token, vamos fazer a requisição do perfil SEPARADAMENTE APÓS o login bem-sucedido.
            // (Esta era a lógica original que você tinha, e que faz sentido se o backend não anexa o perfil ao token)
            
            // Define o token padrão para futuras requisições API
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // Agora, faça a requisição para obter o perfil do usuário usando o token recém-adquirido
            const userProfileResponse = await api.get('/auth/me'); // Rota para obter o perfil do usuário autenticado
            const userProfile = userProfileResponse.data;

            // 3. Salvamos tudo no contexto.
            // O objeto 'access' pode ter outras propriedades como 'refresh_token' se você tiver.
            login({ access: accessToken }, userProfile);
            navigate('/painel');

        } catch (err) {
            console.error('Erro de login:', err);
            if (err.response && err.response.data && err.response.data.detail) {
                // Tenta extrair a mensagem de erro detalhada do FastAPI
                if (typeof err.response.data.detail === 'string') {
                    setError(err.response.data.detail);
                } else if (Array.isArray(err.response.data.detail) && err.response.data.detail.length > 0) {
                    // Para erros 422, o 'detail' é uma lista de objetos. Pegar a primeira mensagem.
                    setError(err.response.data.detail[0].msg);
                } else {
                    setError('Falha no login. Verifique seu usuário e senha.');
                }
            } else {
                setError('Ocorreu um erro desconhecido ao tentar fazer login.');
            }
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Nome de Usuário" // Melhor que CNPJ/CPF se o backend espera 'username'
                    required 
                />
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Digite sua senha" 
                    required 
                />
                
                <div style={{ margin: '10px 0' }}>
                    <input 
                        type="checkbox" 
                        id="rememberMe" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)} 
                    />
                    <label htmlFor="rememberMe" style={{ marginLeft: '5px' }}>Lembrar de mim</label>
                </div>
                
                <button type="submit">Entrar</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
            <div style={{ marginTop: '15px' }}>
                <Link to="/esqueci-senha">Esqueceu sua senha?</Link>
            </div>
        </div>
    );
}

export default LoginPage;