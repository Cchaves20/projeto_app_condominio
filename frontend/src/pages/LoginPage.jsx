import React, { useState } from 'react';
// Renomeando para clareza, assumindo que este é o seu cliente Axios configurado com interceptors
import apiClient from '../api/apiClient'; 
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth(); // A função 'login' do seu contexto fará todo o trabalho pesado
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // 1. Faz uma ÚNICA requisição para o endpoint de login
            const response = await apiClient.post('/auth/login', {
                username: username,
                password: password,
            });
            
            // 2. Extrai o token e o perfil da resposta da API
            // Conforme seu backend, a resposta é: { access_token: "...", profile: {...} }
            const { access_token, profile } = response.data;

            if (!access_token || !profile) {
                throw new Error("Resposta de login inválida do servidor.");
            }

            // 3. Passa os dados para a função de login do AuthContext.
            // O contexto agora é responsável por salvar o token e o usuário.
            await login(access_token, profile);
            
            // 4. Navega para o painel após o sucesso
            navigate('/painel');

        } catch (err) {
            console.error('Erro de login:', err);
            if (err.response?.data?.detail) {
                // Lógica de erro do FastAPI (já estava ótima!)
                const detail = err.response.data.detail;
                if (typeof detail === 'string') {
                    setError(detail);
                } else if (Array.isArray(detail) && detail.length > 0) {
                    setError(detail[0].msg);
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
                    placeholder="Nome de Usuário"
                    required 
                />
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Digite sua senha" 
                    required 
                />
                
                {/* O checkbox de "Lembrar de mim" pode ser implementado no futuro
                    alterando a forma como o token é salvo (localStorage vs. sessionStorage) */}
                
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