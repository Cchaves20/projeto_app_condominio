import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

// --- ESTILOS GERAIS DA PÁGINA ---
const productListStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    listStyleType: 'none',
    padding: 0
};

// Estilos para os botões específicos da FavoritosPage
const buttonStyles = {
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: 'none',
    marginRight: '10px',
    transition: 'background-color 0.2s ease',
    fontSize: '0.9em',
    fontWeight: 'bold',
};

const addToCartButtonStyles = {
    ...buttonStyles,
    backgroundColor: '#28a745', // Verde
    color: 'white',
};

const removeFavoriteButtonStyles = {
    ...buttonStyles,
    backgroundColor: '#dc3545', // Vermelho
    color: 'white',
};

function FavoritosPage() {
    const [favoritos, setFavoritos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { accessToken } = useAuth();

    const fetchFavoritos = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const response = await api.get('/favoritos/');
            // CORREÇÃO AQUI: Acessar response.data corretamente
            if (Array.isArray(response.data) && response.data.length > 0 && response.data[0].produtos) {
                setFavoritos(response.data[0].produtos);
            } else if (response.data && response.data.produtos) { // Fallback
                setFavoritos(response.data.produtos);
            } else {
                setFavoritos([]);
            }
        } catch (err) {
            setError('Não foi possível carregar os favoritos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchFavoritos();
    }, [fetchFavoritos]);

    const handleRemoverDosFavoritos = async (produtoId) => {
        try {
            await api.post('/favoritos/alternar_favorito/', { produto_id: produtoId });
            setFavoritos(prevFavoritos => prevFavoritos.filter(p => p.id !== produtoId));
            alert('Produto removido dos favoritos.');
        } catch (err) {
            alert('Erro ao remover dos favoritos.');
            console.error(err);
        }
    };

    const handleAdicionarAoCarrinho = async (produtoId) => {
        try {
            await api.post('/carrinhos/adicionar_item/', { produto_id: produtoId, quantidade: 1 });
            alert('Produto adicionado ao carrinho com sucesso!');
        } catch (err) {
            alert('Erro ao adicionar produto ao carrinho.');
            console.error(err);
        }
    };

    if (loading) return <p>Carregando seus favoritos...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h2>Meus Produtos Favoritos</h2>
            {favoritos.length === 0 ? (
                <p>Você ainda não favoritou nenhum produto.</p>
            ) : (
                <ul style={productListStyles}>
                    {favoritos.map(produto => (
                        <ProductCard
                            key={produto.id}
                            product={produto}
                            showAdminButtons={false}
                        >
                            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-around' }}>
                                <button onClick={() => handleAdicionarAoCarrinho(produto.id)} style={addToCartButtonStyles}>Adicionar ao Carrinho</button>
                                <button onClick={() => handleRemoverDosFavoritos(produto.id)} style={removeFavoriteButtonStyles}>Remover dos Favoritos</button>
                            </div>
                        </ProductCard>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default FavoritosPage;