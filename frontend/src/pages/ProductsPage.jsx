// frontend/src/pages/ProductsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
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


function ProductsPage() {
    const { userType } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [favoriteProducts, setFavoriteProducts] = useState({}); // Mapeia { productId: true/false }
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProductsAndFavorites = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            let queryParams = {};
            if (searchTerm) {
                queryParams.search = searchTerm;
            }

            const productsResponse = await api.get('/produtos', { params: queryParams });
            setProducts(productsResponse.data);

            if (userType === 'SINDICO') {
                const favoritesResponse = await api.get('/favoritos');
                const favs = {};
                // CORREÇÃO AQUI: Acessar response.data corretamente
                if (Array.isArray(favoritesResponse.data) && favoritesResponse.data.length > 0 && favoritesResponse.data[0].produtos) {
                    favoritesResponse.data[0].produtos.forEach(p => {
                        favs[p.id] = true;
                    });
                } else if (favoritesResponse.data && favoritesResponse.data.produtos) { // Fallback, caso retorne direto o objeto
                    favoritesResponse.data.produtos.forEach(p => {
                        favs[p.id] = true;
                    });
                }
                setFavoriteProducts(favs);
            }

        } catch (err) {
            setError('Erro ao carregar produtos ou favoritos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userType, searchTerm]);

    useEffect(() => {
        fetchProductsAndFavorites();
    }, [fetchProductsAndFavorites]);


    const handleAlternarFavorito = async (productId) => {
        setError('');
        setSuccessMessage('');
        try {
            await api.post('/favoritos/alternar_favorito/', { produto_id: productId });
            setFavoriteProducts(prev => ({
                ...prev,
                [productId]: !prev[productId]
            }));
            setSuccessMessage(favoriteProducts[productId] ? 'Produto removido dos favoritos.' : 'Produto adicionado aos favoritos.');
        } catch (err) {
            setError('Erro ao alternar favorito.');
            console.error(err);
        }
    };

    const handleAdicionarAoCarrinho = async (productId) => {
        setError('');
        setSuccessMessage('');
        try {
            await api.post('/carrinhos/adicionar_item/', { produto_id: productId, quantidade: 1 });
            setSuccessMessage('Item adicionado ao carrinho!');
        } catch (err) {
            setError('Erro ao adicionar item ao carrinho.');
            console.error(err);
        }
    };

    if (loading) return <p>Carregando catálogo...</p>;

    return (
        <div>
            <h2>Catálogo de Produtos</h2>

            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px' }}>
                <input
                    type="text"
                    placeholder="Buscar produtos disponíveis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
            </div>
            {error && <p style={{ color: 'red', marginBottom: '15px' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green', marginBottom: '15px' }}>{successMessage}</p>}

            {products.length === 0 ? (
                <p>Nenhum produto disponível no momento.</p>
            ) : (
                <ul style={productListStyles}>
                    {products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            showAdminButtons={false}
                        >
                            {userType === 'SINDICO' && (
                                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-around' }}>
                                    <button onClick={() => handleAdicionarAoCarrinho(product.id)} style={addToCartButtonStyles}>
                                        Adicionar ao Carrinho
                                    </button>
                                    <button onClick={() => handleAlternarFavorito(product.id)} style={favoriteButtonStyles}>
                                        {favoriteProducts[product.id] ? '❤️ Favorito' : '🤍 Favoritar'}
                                    </button>
                                </div>
                            )}
                        </ProductCard>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default ProductsPage;