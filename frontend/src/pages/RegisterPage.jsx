import React, { useState } from 'react';
import api from '../api'; // Supondo que 'api' é sua instância do Axios
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PasswordRequirements = ({ requirements }) => {
    return (
        <ul style={{ listStyleType: 'none', padding: 0, marginTop: '10px', fontSize: '0.9rem' }}>
            {Object.entries(requirements).map(([key, req]) => (
                <li key={key} style={{ color: req.valid ? 'green' : 'red' }}>
                    {req.valid ? '✓' : '✗'} {req.text}
                </li>
            ))}
        </ul>
    );
};

function RegisterPage() {
    // Estados para os campos do formulário
    const [username, setUsername] = useState(''); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [accountType, setAccountType] = useState('SINDICO'); // Default para Síndico
    
    // Campos de perfil
    const [nomeEmpresa, setNomeEmpresa] = useState('');
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [nomeCondominio, setNomeCondominio] = useState('');

    // --- ESTADOS PARA O ENDEREÇO DO FORNECEDOR ---
    const [rua, setRua] = useState('');
    const [numero, setNumero] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [cep, setCep] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Requisitos de senha
    const [passwordReqs, setPasswordReqs] = useState({
        length: { text: 'Pelo menos 9 caracteres', valid: false },
        upper: { text: 'Pelo menos 1 letra maiúscula (A-Z)', valid: false },
        lower: { text: 'Pelo menos 1 letra minúscula (a-z)', valid: false },
        number: { text: 'Pelo menos 1 número (0-9)', valid: false },
        special: { text: 'Pelo menos 1 caractere especial (!@#$...)', valid: false },
    });

    const { login } = useAuth();
    const navigate = useNavigate();

    // Função para validar requisitos de senha
    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordReqs({
            length: { ...passwordReqs.length, valid: newPassword.length >= 9 },
            upper: { ...passwordReqs.upper, valid: /[A-Z]/.test(newPassword) },
            lower: { ...passwordReqs.lower, valid: /[a-z]/.test(newPassword) },
            number: { ...passwordReqs.number, valid: /[0-9]/.test(newPassword) },
            special: { ...passwordReqs.special, valid: /[^A-Za-z0-9]/.test(newPassword) },
        });
    };

    // Função para limpar os estados do formulário
    const clearForm = () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setAccountType('SINDICO'); // Reseta para o default
        setNomeEmpresa('');
        setNomeCompleto('');
        setNomeCondominio('');
        setRua('');
        setNumero('');
        setCidade('');
        setEstado('');
        setCep('');
        setError('');
        setSuccessMessage('');
        // Reseta os requisitos de senha
        setPasswordReqs({
            length: { text: 'Pelo menos 9 caracteres', valid: false },
            upper: { text: 'Pelo menos 1 letra maiúscula (A-Z)', valid: false },
            lower: { text: 'Pelo menos 1 letra minúscula (a-z)', valid: false },
            number: { text: 'Pelo menos 1 número (0-9)', valid: false },
            special: { text: 'Pelo menos 1 caractere especial (!@#$...)', valid: false },
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        const allValid = Object.values(passwordReqs).every(req => req.valid);
        if (!allValid) {
            setError('A senha não cumpre todos os requisitos.');
            return;
        }

        const userData = {
            username: username,
            email: email,
            password: password,
            tipo_usuario: accountType,
            nome_completo: ['SINDICO', 'ENTREGADOR'].includes(accountType) ? nomeCompleto : null,
            nome_empresa: accountType === 'FORNECEDOR' ? nomeEmpresa : null,
            nome_condominio: accountType === 'SINDICO' ? nomeCondominio : null,
            rua: accountType === 'FORNECEDOR' ? rua : null,
            numero: accountType === 'FORNECEDOR' ? numero : null,
            cidade: accountType === 'FORNECEDOR' ? cidade : null,
            estado: accountType === 'FORNECEDOR' ? estado : null,
            cep: accountType === 'FORNECEDOR' ? cep : null,
        };

        // --- ADICIONE ESTA LINHA PARA LOGAR O PAYLOAD ---
        console.log("Payload de registro enviado:", userData);

        try {
            await api.post('/auth/register', userData);
            setSuccessMessage('Conta criada com sucesso! Realizando login...');

            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const loginResponse = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            
            const { access_token, profile } = loginResponse.data;

            login({ access: access_token }, profile);

            switch (profile.tipo_usuario) {
                case 'SINDICO': navigate('/sindico'); break;
                case 'FORNECEDOR': navigate('/fornecedor'); break;
                case 'ENTREGADOR': navigate('/entregador'); break;
                default: navigate('/dashboard'); break;
            }

            clearForm();

        } catch (err) {
            let errorMessage = 'Erro ao criar conta ou fazer login. Tente novamente.';
            if (err.response) {
                // O servidor respondeu com um status code fora da faixa 2xx
                console.error("Erro da API:", err.response.data); // <-- Log detalhado da resposta do backend
                console.error("Status do erro:", err.response.status);
                if (err.response.data?.detail) {
                    errorMessage = `Erro: ${err.response.data.detail}`;
                } else if (err.response.data) { // Se houver outros dados no corpo da resposta
                    errorMessage = `Erro: ${JSON.stringify(err.response.data)}`;
                } else {
                    errorMessage = `Erro: Status ${err.response.status}`;
                }
            } else if (err.request) {
                // A requisição foi feita mas não houve resposta (e.g., rede offline)
                errorMessage = "Erro de rede: O servidor não respondeu.";
                console.error("Erro de rede:", err.request);
            } else {
                // Algo mais aconteceu ao configurar a requisição
                errorMessage = `Erro: ${err.message}`;
                console.error("Erro Axios:", err.message);
            }
            setError(errorMessage);
            setSuccessMessage('');
            console.error('Erro no processo de registro/login (final):', err);
        }
    };

    return (
        <div>
            <h2>Criar Conta</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="accountType">Eu sou: </label>
                    <select id="accountType" value={accountType} onChange={(e) => setAccountType(e.target.value)}>
                        <option value="SINDICO">Síndico</option>
                        <option value="FORNECEDOR">Fornecedor</option>
                        <option value="ENTREGADOR">Entregador</option>
                    </select>
                </div>
                
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={accountType === 'ENTREGADOR' ? 'Digite seu CPF ou RG (para login)' : 'Digite seu CNPJ (para login)'}
                    required
                />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu melhor e-mail" required />

                {accountType === 'SINDICO' && (
                    <>
                        <input value={nomeCondominio} onChange={(e) => setNomeCondominio(e.target.value)} placeholder="Nome do seu Condomínio" required />
                        <input value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} placeholder="Seu Nome Completo" required />
                    </>
                )}
                
                {accountType === 'FORNECEDOR' && (
                    <>
                        <input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Nome da sua Empresa" required />
                        <div style={{marginTop: '10px', border: '1px solid #ccc', padding: '10px'}}>
                            <strong>Endereço da Loja/Ponto de Coleta</strong>
                            <input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua / Avenida" required />
                            <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número" required />
                            <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" required />
                            <input value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Estado (UF)" required />
                            <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="CEP" required />
                        </div>
                    </>
                )}

                {accountType === 'ENTREGADOR' && (
                    <input value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} placeholder="Seu Nome Completo" required />
                )}
                
                <input type="password" value={password} onChange={handlePasswordChange} placeholder="Crie uma senha" required />
                <PasswordRequirements requirements={passwordReqs} />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme a senha" required />
                
                <button type="submit">Criar Conta e Entrar</button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            </form>
        </div>
    );
}

export default RegisterPage;