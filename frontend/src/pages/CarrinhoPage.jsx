import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function CarrinhoPage() {
    const [carrinho, setCarrinho] = useState(null);
    const [enderecosSalvos, setEnderecosSalvos] = useState([]);
    const [rua, setRua] = useState('');
    const [numero, setNumero] = useState('');
    const [cep, setCep] = useState('');
    const [complemento, setComplemento] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { accessToken } = useAuth();
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const [carrinhoRes, enderecosRes] = await Promise.all([
                api.get('/carrinhos/'),
                api.get('/enderecos/')
            ]);
            if (carrinhoRes.data.length > 0) setCarrinho(carrinhoRes.data[0]);
            setEnderecosSalvos(enderecosRes.data);
        } catch (err) {
            setError('Não foi possível carregar os dados da página.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSelectEndereco = (endereco) => {
        // CORREÇÃO: Preenche todos os novos campos
        setRua(endereco.rua);
        setNumero(endereco.numero);
        setCep(endereco.cep);
        setComplemento(endereco.complemento || '');
    };

    const calcularTotal = () => {
        if (!carrinho || !carrinho.itens) return '0.00';
        return carrinho.itens.reduce((total, item) => {
            return total + (item.quantidade * parseFloat(item.preco_congelado));
        }, 0).toFixed(2);
    };

    const handleUpdateQuantidade = async (itemId, novaQuantidade) => {
        if (novaQuantidade < 1) {
            return handleRemoverItem(itemId);
        }
        try {
            await api.patch('/carrinhos/atualizar_item/', { 
                item_id: itemId, 
                quantidade: novaQuantidade 
            });
            fetchData();
        } catch (err) {
            alert('Erro ao atualizar a quantidade.');
            console.error(err);
        }
    };

    const handleRemoverItem = async (itemId) => {
        try {
            await api.post('/carrinhos/remover_item/', { item_id: itemId });
            fetchData();
        } catch (err) {
            alert('Erro ao remover o item.');
            console.error(err);
        }
    };
    
    const handleFinalizarCompra = async () => {
        // CORREÇÃO: Valida os novos campos obrigatórios
        if (!rua.trim() || !numero.trim() || !cep.trim()) {
            alert('Por favor, preencha Rua, Número e CEP para a entrega.');
            return;
        }
        if (!carrinho || carrinho.itens.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        if (window.confirm(`Confirmar pedido para: ${rua}, ${numero}?`)) {
            try {
                // CORREÇÃO: Envia a nova estrutura de endereço para a API
                await api.post('/carrinhos/finalizar_compra/', { 
                    rua, 
                    numero, 
                    cep, 
                    complemento 
                });
                alert('Pedido realizado com sucesso!');
                navigate('/historico'); 
            } catch (err) {
                alert('Ocorreu um erro ao finalizar o pedido.');
                console.error(err);
            }
        }
    };

    if (loading) return <p>Carregando seu carrinho...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h2>Meu Carrinho de Compras</h2>
            {!carrinho || carrinho.itens.length === 0 ? (
                <p>Seu carrinho está vazio.</p>
            ) : (
                <>
                    <ul>
                        {carrinho.itens.map(item => {
                            const subtotal = item.quantidade * parseFloat(item.preco_congelado);
                            return (
                                <li key={item.id}>
                                    <div>
                                        <strong>{item.produto.nome}</strong>
                                        <span style={{ color: '#555', fontSize: '0.8rem', marginLeft: '10px' }}>
                                            - Vendido por: {item.produto.nome_fornecedor}
                                        </span>
                                    </div>
                                    <div>
                                        <span>Subtotal: R$ {subtotal.toFixed(2)}</span>
                                        {item.produto.em_oferta && parseFloat(item.preco_congelado) < parseFloat(item.produto.preco) && (
                                            <span style={{ textDecoration: 'line-through', color: 'grey', marginLeft: '10px' }}>
                                                (Preço original unitário: R$ {item.produto.preco})
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ marginTop: '5px' }}>
                                        <button onClick={() => handleUpdateQuantidade(item.id, item.quantidade - 1)}>-</button>
                                        <span> {item.quantidade} </span>
                                        <button onClick={() => handleUpdateQuantidade(item.id, item.quantidade + 1)}>+</button>
                                        <button onClick={() => handleRemoverItem(item.id)} style={{marginLeft: '10px'}}>Remover</button>
                                    </div>
                                 </li>
                            );
                        })}
                    </ul>
                    <hr />
                    <div style={{ margin: '20px 0' }}>
                        <h3>Endereço de Entrega</h3>
                        {enderecosSalvos.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                                <label>Usar um endereço salvo: </label>
                                {enderecosSalvos.map(end => (
                                    <button key={end.id} onClick={() => handleSelectEndereco(end)}>
                                        {end.apelido}
                                    </button>
                                ))}
                            </div>
                        )}
                        {/* CORREÇÃO: Garante que todos os campos estejam presentes */}
                        <input type="text" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Rua / Avenida" required />
                        <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número" required />
                        <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="CEP" required />
                        <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Complemento (Opcional)" />
                        <Link to="/enderecos" style={{marginLeft: '10px'}}>Gerenciar Endereços</Link>
                    </div>
                    
                    <h3>Total: R$ {calcularTotal()}</h3>
                    <button onClick={handleFinalizarCompra}>Finalizar Compra</button>
                </>
            )}
        </div>
    );
}

export default CarrinhoPage;