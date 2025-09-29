// frontend/src/pages/OfertasPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

const productListStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    listStyleType: 'none',
    padding: 0
};

function OfertasPage() {
    const { userProfile } = useAuth(); // Usar userProfile é mais robusto que accessToken
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); // State para feedback
    const [favoriteProducts, setFavoriteProducts] = useState(new Set());

    const fetchOfertas = useCallback(async () => {
        if (!userProfile) return;
        setLoading(true);
        setError('');
        try {
            const [ofertasResponse, favoritesResponse] = await Promise.all([
                apiClient.get('/produtos', { params: { em_oferta: true } }),
                apiClient.get('/favoritos/') // Chamada para saber o que já é favorito
            ]);
            setProducts(ofertasResponse.data);

            if (favoritesResponse.data && Array.isArray(favoritesResponse.data.produtos)) {
                const favoriteIds = new Set(favoritesResponse.data.produtos.map(p => p.id));
                setFavoriteProducts(favoriteIds);
            }
        } catch (err) {
            setError('Não foi possível carregar os dados da página.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        fetchOfertas();
    }, [fetchOfertas]);

    const handleAdicionarAoCarrinho = async (produtoId) => {
        setError('');
        setSuccessMessage('');
        try {
            // CORREÇÃO: Usando a rota padronizada
            await apiClient.post('/carrinhos/items/', { produto_id: produtoId, quantidade: 1 });
            setSuccessMessage('Produto adicionado ao carrinho!');
        } catch (err) {
            setError('Erro ao adicionar produto ao carrinho.');
            console.error(err);
        }
    };

    const handleAlternarFavorito = async (produtoId) => {
        setError('');
        setSuccessMessage('');
        try {
            // CORREÇÃO: Usando a rota padronizada
            await apiClient.post('/favoritos/toggle/', { produto_id: produtoId });
            setFavoriteProducts(prevIds => {
                const newIds = new Set(prevIds);
                if (newIds.has(produtoId)) {
                    newIds.delete(produtoId);
                    setSuccessMessage('Produto removido dos favoritos.');
                } else {
                    newIds.add(produtoId);
                    setSuccessMessage('Produto adicionado aos favoritos.');
                }
                return newIds;
            });
        } catch (err) {
            setError('Erro ao favoritar o produto.');
            console.error(err);
        }
    };

    if (loading) return <p>Carregando ofertas...</p>;

    return (
        <div>
            <h2>Ofertas em Destaque</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

            {products.length === 0 ? (
                <p>Nenhuma oferta encontrada no momento.</p>
            ) : (
                <ul style={productListStyles}>
                    {products.map(produto => (
                        // --- CORREÇÃO PRINCIPAL AQUI ---
                        // Passando as funções e o estado como props, em vez de children.
                        <ProductCard
                            key={produto.id}
                            product={produto}
                            showAdminButtons={false}
                            onAddToCart={handleAdicionarAoCarrinho}
                            onToggleFavorite={handleAlternarFavorito}
                            isFavorite={favoriteProducts.has(produto.id)}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

export default OfertasPage;