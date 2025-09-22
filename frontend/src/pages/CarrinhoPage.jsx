import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

function CarrinhoPage() {
    const [carrinho, setCarrinho] = useState(null);
    const [enderecosSalvos, setEnderecosSalvos] = useState([]);
    
    // State para o endereço de entrega
    const [rua, setRua] = useState('');
    const [numero, setNumero] = useState('');
    const [cep, setCep] = useState('');
    const [complemento, setComplemento] = useState('');
    const [bairro, setBairro] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { userProfile } = useAuth();
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        if (!userProfile) return;
        setLoading(true);
        setError('');
        try {
            const [carrinhoRes, enderecosRes] = await Promise.all([
                apiClient.get('/carrinhos/'),
                apiClient.get('/enderecos/')
            ]);
            setCarrinho(carrinhoRes.data);
            setEnderecosSalvos(enderecosRes.data);
        } catch (err) {
            setError('Não foi possível carregar os dados da página.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSelectEndereco = (endereco) => {
        setRua(endereco.rua);
        setNumero(endereco.numero);
        setCep(endereco.cep);
        setComplemento(endereco.complemento || '');
        setBairro(endereco.bairro);
        setCidade(endereco.cidade);
        setEstado(endereco.estado);
    };

    const calcularTotal = () => {
        if (!carrinho || !carrinho.itens) return 0;
        return carrinho.itens.reduce((total, item) => {
            const preco = parseFloat(item.preco_congelado) || 0;
            const qtd = parseInt(item.quantidade, 10) || 0;
            return total + (preco * qtd);
        }, 0);
    };

    const handleUpdateQuantidade = async (itemId, novaQuantidade) => {
        if (novaQuantidade < 1) {
            return handleRemoverItem(itemId);
        }
        try {
            const response = await apiClient.patch(`/carrinhos/items/${itemId}`, { quantidade: novaQuantidade });
            setCarrinho(response.data);
        } catch (err) {
            setError('Erro ao atualizar a quantidade.');
            console.error(err);
        }
    };

    const handleRemoverItem = async (itemId) => {
        try {
            const response = await apiClient.delete(`/carrinhos/items/${itemId}`);
            setCarrinho(response.data);
            setSuccessMessage('Item removido com sucesso.');
        } catch (err) {
            setError('Erro ao remover o item.');
            console.error(err);
        }
    };
    
    const handleFinalizarCompra = async () => {
        if (!rua.trim() || !numero.trim() || !cep.trim() || !bairro.trim() || !cidade.trim() || !estado.trim()) {
            setError('Por favor, preencha todos os campos do endereço para a entrega.');
            return;
        }
        if (!carrinho || carrinho.itens.length === 0) {
            setError('Seu carrinho está vazio!');
            return;
        }
        if (window.confirm(`Confirmar pedido para: ${rua}, ${numero}?`)) {
            try {
                // Lembrete: A rota POST /pedidos/ precisa ser criada no backend
                await apiClient.post('/pedidos/', { 
                    rua, numero, cep, complemento, bairro, cidade, estado
                });
                setSuccessMessage('Pedido realizado com sucesso! Redirecionando...');
                setTimeout(() => navigate('/historico'), 2000);
            } catch (err) {
                setError('Ocorreu um erro ao finalizar o pedido.');
                console.error(err);
            }
        }
    };

    if (loading) return <p>Carregando seu carrinho...</p>;
    
    return (
        <div>
            <h2>Meu Carrinho de Compras</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            
            {!carrinho || carrinho.itens.length === 0 ? (
                <div>
                    <p>Seu carrinho está vazio.</p>
                    <Link to="/produtos">Ver produtos</Link>
                </div>
            ) : (
                <>
                    <ul>
                        {carrinho.itens.map(item => {
                            // Lógica de cálculo segura dentro do map
                            const precoUnitario = parseFloat(item.preco_congelado) || 0;
                            const quantidade = parseInt(item.quantidade, 10) || 0;
                            const subtotal = precoUnitario * quantidade;

                            return (
                                <li key={item.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{item.produto.nome}</strong>
                                        <p style={{margin: '5px 0', color: '#555'}}>
                                            Preço Unitário: R$ {precoUnitario.toFixed(2)}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
                                            <button onClick={() => handleUpdateQuantidade(item.id, quantidade - 1)}>-</button>
                                            <span style={{ margin: '0 10px' }}> {quantidade} </span>
                                            <button onClick={() => handleUpdateQuantidade(item.id, quantidade + 1)}>+</button>
                                            <button onClick={() => handleRemoverItem(item.id)} style={{marginLeft: '20px', color: 'red', background: 'none', border: 'none', cursor: 'pointer'}}>Remover</button>
                                        </div>
                                    </div>
                                    <div style={{textAlign: 'right'}}>
                                        <strong>Subtotal</strong>
                                        <p style={{margin: '5px 0'}}>R$ {subtotal.toFixed(2)}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <hr />
                    <div>
                        <h3>Endereço de Entrega</h3>
                        {enderecosSalvos.length > 0 && (
                            <div style={{marginBottom: '10px'}}>
                                <label>Usar um endereço salvo: </label>
                                {enderecosSalvos.map(end => (
                                    <button key={end.id} onClick={() => handleSelectEndereco(end)}>{end.apelido}</button>
                                ))}
                            </div>
                        )}
                        <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua / Avenida" />
                        <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número" />
                        <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" />
                        <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" />
                        <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="Estado (UF)" />
                        <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="CEP" />
                        <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Complemento (Opcional)" />
                        <Link to="/enderecos" style={{marginLeft: '10px'}}>Gerenciar Endereços</Link>
                    </div>
                    
                    <div style={{ textAlign: 'right', marginTop: '20px', fontSize: '1.5em' }}>
                        <strong>Total: R$ {calcularTotal().toFixed(2)}</strong>
                    </div>
                    <button onClick={handleFinalizarCompra} style={{float: 'right', padding: '10px 20px', fontSize: '1.1em'}}>Finalizar Compra</button>
                </>
            )}
        </div>
    );
}

export default CarrinhoPage;