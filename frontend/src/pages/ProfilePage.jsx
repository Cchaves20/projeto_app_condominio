import React, { useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
    const { userType, logout, userProfile, login } = useAuth();
    // O estado do formulário é inicializado com os dados do contexto.
    const [profile, setProfile] = useState(userProfile);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    if (!profile) {
        return <p>Carregando perfil...</p>;
    }

    const handleProfileInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prevProfile => ({ ...prevProfile, [name]: value }));
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        try {
            const response = await api.patch('/auth/user', profile);
            // Atualiza o perfil no AuthContext e no localStorage após o sucesso
            login({ access: localStorage.getItem('accessToken') }, response.data);
            setSuccessMessage("Perfil atualizado com sucesso!");
        } catch (err) {
            setError("Não foi possível atualizar o perfil.");
            console.error(err);
        }
    };
    
    const handleDeleteAccount = async () => {
        if (window.confirm("Você tem certeza que deseja excluir sua conta? Esta ação é irreversível.")) {
            try {
                await api.delete('/auth/user');
                alert("Conta excluída com sucesso.");
                logout();
            } catch (err) {
                alert("Não foi possível excluir a conta.");
                console.error(err);
            }
        }
    };

    return (
        <div>
            <h2>Meu Perfil</h2>
            <p><strong>Login (CNPJ/CPF):</strong> {profile.username}</p>
            
            <form onSubmit={handleProfileUpdate}>
                <div>
                    <label>Email de Contato/Recuperação:</label><br />
                    <input name="email" type="email" value={profile.email || ''} onChange={handleProfileInputChange} />
                </div>
                
                {userType === 'SINDICO' && (
                    <>
                        <div style={{marginTop: '10px'}}>
                            <label>Nome Completo:</label><br />
                            <input name="nome_completo" type="text" value={profile.nome_completo || ''} onChange={handleProfileInputChange} />
                        </div>
                        <div style={{marginTop: '10px'}}>
                            <label>Nome do Condomínio:</label><br />
                            <input name="nome_condominio" type="text" value={profile.nome_condominio || ''} onChange={handleProfileInputChange} />
                        </div>
                    </>
                )}

                {userType === 'FORNECEDOR' && (
                    <>
                        <div style={{marginTop: '10px'}}>
                            <label>Nome da Empresa:</label><br />
                            <input name="nome_empresa" type="text" value={profile.nome_empresa || ''} onChange={handleProfileInputChange} />
                        </div>
                        <div style={{marginTop: '10px', border: '1px solid #ccc', padding: '10px'}}>
                            <strong>Endereço da Loja/Ponto de Coleta</strong>
                            <input name="rua" value={profile.rua || ''} onChange={handleProfileInputChange} placeholder="Rua / Avenida" />
                            <input name="numero" value={profile.numero || ''} onChange={handleProfileInputChange} placeholder="Número" />
                            <input name="cidade" value={profile.cidade || ''} onChange={handleProfileInputChange} placeholder="Cidade" />
                            <input name="estado" value={profile.estado || ''} onChange={handleProfileInputChange} placeholder="Estado (UF)" />
                            <input name="cep" value={profile.cep || ''} onChange={handleProfileInputChange} placeholder="CEP" />
                        </div>
                    </>
                )}

                {userType === 'ENTREGADOR' && (
                     <div style={{marginTop: '10px'}}>
                        <label>Nome Completo:</label><br />
                        <input name="nome_completo" type="text" value={profile.nome_completo || ''} onChange={handleProfileInputChange} />
                    </div>
                )}

                <button type="submit" style={{marginTop: '15px'}}>Salvar Alterações</button>
                {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
            
            <hr style={{margin: '20px 0'}} />
            <div>
                <h3>Gerenciamento da Conta</h3>
                <button onClick={handleDeleteAccount} style={{backgroundColor: '#dc3545', color: 'white'}}>Excluir Minha Conta</button>
            </div>
        </div>
    );
}

export default ProfilePage;