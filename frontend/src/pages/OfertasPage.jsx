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

// Estilos para os botões específicos da OfertasPage
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

const favoriteButtonStyles = {
    ...buttonStyles,
    backgroundColor: '#ffc107', // Amarelo
    color: '#333',
};


function OfertasPage() {
    const [ofertas, setOfertas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [favoritosIds, setFavoritosIds] = useState(new Set());
    const { accessToken } = useAuth();

    const fetchInitialData = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const [ofertasResponse, favoritosResponse] = await Promise.all([
                api.get('/produtos/?em_oferta=true'),
                api.get('/favoritos/')
            ]);
            setOfertas(ofertasResponse.data);

            // CORREÇÃO AQUI: Acessar response.data corretamente
            if (Array.isArray(favoritosResponse.data) && favoritosResponse.data.length > 0 && favoritosResponse.data[0].produtos) {
                const ids = new Set(favoritosResponse.data[0].produtos.map(p => p.id));
                setFavoritosIds(ids);
            } else if (favoritosResponse.data && favoritosResponse.data.produtos) { // Fallback
                const ids = new Set(favoritosResponse.data.produtos.map(p => p.id));
                setFavoritosIds(ids);
            }

        } catch (err) {
            setError('Não foi possível carregar os dados da página.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleAdicionarAoCarrinho = async (produtoId) => {
        try {
            await api.post('/carrinhos/adicionar_item/', { produto_id: produtoId, quantidade: 1 });
            alert('Produto adicionado ao carrinho!');
        } catch (err) {
            alert('Erro ao adicionar produto ao carrinho.');
            console.error(err);
        }
    };

    const handleAlternarFavorito = async (produtoId) => {
        try {
            await api.post('/favoritos/alternar_favorito/', { produto_id: produtoId });
            setFavoritosIds(prevIds => {
                const newIds = new Set(prevIds);
                if (newIds.has(produtoId)) {
                    newIds.delete(produtoId);
                } else {
                    newIds.add(produtoId);
                }
                return newIds;
            });
        } catch (err) {
            alert('Erro ao favoritar o produto.');
            console.error(err);
        }
    };

    if (loading) return <p>Carregando ofertas...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h2>Ofertas em Destaque</h2>
            {ofertas.length === 0 ? (
                <p>Nenhuma oferta encontrada no momento.</p>
            ) : (
                <ul style={productListStyles}>
                    {ofertas.map(produto => (
                        <ProductCard
                            key={produto.id}
                            product={produto}
                            showAdminButtons={false}
                        >
                            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-around' }}>
                                <button onClick={() => handleAdicionarAoCarrinho(produto.id)} style={addToCartButtonStyles}>Adicionar ao Carrinho</button>
                                <button onClick={() => handleAlternarFavorito(produto.id)} style={favoriteButtonStyles}>
                                    {favoritosIds.has(produto.id) ? '★ Desfavoritar' : '☆ Favoritar'}
                                </button>
                            </div>
                        </ProductCard>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default OfertasPage;