// frontend/src/pages/ProductsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

// --- ESTILOS GERAIS DA PÁGINA ---
const productListStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', // Colunas responsivas
    gap: '20px',
    listStyleType: 'none',
    padding: 0
};

// Estilos para os botões específicos da ProductsPage

function ProductsPage() {
    const { userProfile } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    // CORREÇÃO: Usando um Set para gerenciar favoritos de forma mais eficiente
    const [favoriteProducts, setFavoriteProducts] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProductsAndFavorites = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const productsResponse = await apiClient.get('/produtos', { 
                params: { search: searchTerm || undefined } 
            });
            setProducts(productsResponse.data);

            if (userProfile?.tipo_usuario === 'SINDICO') {
                const favoritesResponse = await apiClient.get('/favoritos/');
                // Simplificando a lógica para extrair os IDs dos produtos favoritos
                if (favoritesResponse.data && Array.isArray(favoritesResponse.data.produtos)) {
                    const favoriteIds = new Set(favoritesResponse.data.produtos.map(p => p.id));
                    setFavoriteProducts(favoriteIds);
                }
            }
        } catch (err) {
            setError('Erro ao carregar produtos ou favoritos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userProfile?.tipo_usuario, searchTerm]);

    useEffect(() => {
        fetchProductsAndFavorites();
    }, [fetchProductsAndFavorites]);

    // Em: frontend/src/pages/ProductsPage.jsx

    const handleAlternarFavorito = async (productId) => {
        setError('');
        setSuccessMessage('');
        try {
            // A chamada DEVE ser para '/favoritos/toggle/'
            await apiClient.post('/favoritos/toggle/', { produto_id: productId });
            
            // Atualiza o estado local para o feedback ser instantâneo na UI
            setFavoriteProducts(prevFavs => {
                const newFavs = new Set(prevFavs);
                if (newFavs.has(productId)) {
                    newFavs.delete(productId);
                    setSuccessMessage('Produto removido dos favoritos.');
                } else {
                    newFavs.add(productId);
                    setSuccessMessage('Produto adicionado aos favoritos!');
                }
                return newFavs;
            });
        } catch (err) {
            setError('Erro ao alternar favorito.');
            console.error(err);
        }
    };

    const handleAdicionarAoCarrinho = async (productId) => {
        setError('');
        setSuccessMessage('');
        try {
            await apiClient.post('/carrinhos/items/', { produto_id: productId, quantidade: 1 });
            setSuccessMessage('Item adicionado ao carrinho com sucesso!');
        } catch (err) {
            setError('Erro ao adicionar item ao carrinho.');
            console.error(err);
        }
    };

    if (loading) return <p>Carregando catálogo...</p>;

    return (
        <div>
            <h2>Catálogo de Produtos</h2>
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Buscar produtos disponíveis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

            {products.length === 0 ? (
                <p>Nenhum produto disponível no momento.</p>
            ) : (
                <ul style={productListStyles}>
                    {products.map(product => (
                        // --- CORREÇÃO PRINCIPAL AQUI ---
                        // Passando as funções e o estado como props, em vez de children.
                        <ProductCard
                            key={product.id}
                            product={product}
                            showAdminButtons={false}
                            onAddToCart={handleAdicionarAoCarrinho}
                            onToggleFavorite={handleAlternarFavorito}
                            isFavorite={favoriteProducts.has(product.id)}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ProductsPage;