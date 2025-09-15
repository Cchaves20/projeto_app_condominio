import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';

function EnderecosPage() {
    const [enderecos, setEnderecos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [apelido, setApelido] = useState('');
    const [rua, setRua] = useState('');
    const [numero, setNumero] = useState('');
    const [cep, setCep] = useState('');
    const [complemento, setComplemento] = useState('');

    const fetchEnderecos = useCallback(async () => {
        try {
            const response = await api.get('/enderecos/');
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
        if (!apelido.trim() || !rua.trim() || !numero.trim() || !cep.trim()) {
            setError("Apelido, Rua, Número e CEP são obrigatórios.");
            return;
        }
        try {
            await api.post('/enderecos/', { apelido, rua, numero, cep, complemento });
            // Limpa o formulário e recarrega a lista
            setApelido(''); setRua(''); setNumero(''); setCep(''); setComplemento('');
            fetchEnderecos(); 
        } catch (err) {
            setError('Erro ao salvar o novo endereço.');
            console.error(err);
        }
    };
    
    const handleDeleteEndereco = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este endereço?")) {
            try {
                await api.delete(`/enderecos/${id}/`);
                // Atualiza a lista na tela sem precisar de uma nova chamada à API
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
                    <input value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="Apelido (ex: Portaria Principal)" required />
                    <input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua / Avenida" required />
                    <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número" required />
                    <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="CEP" required />
                    <input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Complemento (Opcional)" />
                    <button type="submit">Salvar Endereço</button>
                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </div>
            <hr />
            <h3>Endereços Salvos</h3>
            <ul>
                {enderecos.map(end => (
                    <li key={end.id}>
                        <div>
                            <strong>{end.apelido}</strong>
                            <p>{end.rua}, {end.numero} - CEP: {end.cep} {end.complemento && `- ${end.complemento}`}</p>
                        </div>
                        <button onClick={() => handleDeleteEndereco(end.id)}>Excluir</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
export default EnderecosPage;