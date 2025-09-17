import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';

function EnderecosPage() {
    const [enderecos, setEnderecos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // --- State para o formulário ---
    const [apelido, setApelido] = useState('');
    const [rua, setRua] = useState('');
    const [numero, setNumero] = useState('');
    const [cep, setCep] = useState('');
    const [complemento, setComplemento] = useState('');
    // CORREÇÃO 1: Adicionar state para os campos que o backend requer
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');

    const fetchEnderecos = useCallback(async () => {
        try {
            const response = await apiClient.get('/enderecos/');
            setEnderecos(response.data);
        } catch (err) {
            setError('Não foi possível carregar seus endereços salvos.');
            console.error("Erro ao buscar endereços:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEnderecos();
    }, [fetchEnderecos]);

    const handleAddEndereco = async (e) => {
        e.preventDefault();
        setError('');

        // CORREÇÃO 2: Atualizar a validação para incluir os novos campos
        if (!apelido.trim() || !rua.trim() || !numero.trim() || !cep.trim() || !bairro.trim() || !cidade.trim() || !estado.trim()) {
            setError("Todos os campos, exceto Complemento, são obrigatórios.");
            return;
        }
        try {
            // CORREÇÃO 3: Enviar o objeto completo para a API
            await apiClient.post('/enderecos/', { 
                apelido, 
                rua, 
                numero, 
                cep, 
                complemento,
                bairro,
                cidade,
                estado
            });
            
            // Limpa o formulário e recarrega a lista
            setApelido(''); setRua(''); setNumero(''); setCep(''); setComplemento('');
            setBairro(''); setCidade(''); setEstado('');
            fetchEnderecos(); 
        } catch (err) {
            setError('Erro ao salvar o novo endereço. Verifique os dados e tente novamente.');
            console.error("Erro ao salvar endereço:", err);
        }
    };
    
    const handleDeleteEndereco = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este endereço?")) {
            try {
                await apiClient.delete(`/enderecos/${id}`);
                setEnderecos(enderecos.filter(end => end.id !== id));
            } catch (err) {
                setError('Erro ao excluir o endereço.');
                console.error("Erro ao excluir endereço:", err);
            }
        }
    };

    if (loading) return <p>Carregando seus endereços...</p>;

    return (
        <div>
            <h2>Gerenciar Meus Endereços</h2>
            <div>
                <h3>Adicionar Novo Endereço</h3>
                <form onSubmit={handleAddEndereco}>
                    {/* CORREÇÃO 4: Adicionar os inputs para os novos campos */}
                    <input value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="Apelido (ex: Portaria Principal)" />
                    <input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua / Avenida" />
                    <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número" />
                    <input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" />
                    <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" />
                    <input value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Estado (ex: RJ)" />
                    <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="CEP" />
                    <input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Complemento (Opcional)" />
                    <button type="submit">Salvar Endereço</button>
                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
            <hr />
            <h3>Endereços Salvos</h3>
            {enderecos.length === 0 ? (
                <p>Nenhum endereço cadastrado.</p>
            ) : (
                <ul>
                    {enderecos.map(end => (
                        <li key={end.id}>
                            <div>
                                <strong>{end.apelido}</strong>
                                {/* CORREÇÃO 5: Exibir o endereço completo */}
                                <p>{end.rua}, {end.numero} - {end.bairro}, {end.cidade}/{end.estado} - CEP: {end.cep}</p>
                                {end.complemento && <p>Complemento: {end.complemento}</p>}
                            </div>
                            <button onClick={() => handleDeleteEndereco(end.id)}>Excluir</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default EnderecosPage;