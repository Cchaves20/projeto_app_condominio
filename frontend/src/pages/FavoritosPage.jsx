// frontend/src/pages/FavoritosPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import ProductCard from '../components/ProductCard';

const productListStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    listStyleType: 'none',
    padding: 0
};

function FavoritosPage() {
    const [favoritos, setFavoritos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // CORREÇÃO: Adicionando state para mensagens de sucesso para uma melhor UX
    const [successMessage, setSuccessMessage] = useState('');

    const fetchFavoritos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/favoritos/');
            // CORREÇÃO: Lógica de extração de dados simplificada
            if (response.data && Array.isArray(response.data.produtos)) {
                setFavoritos(response.data.produtos);
            }
        } catch (err) {
            setError('Não foi possível carregar os favoritos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavoritos();
    }, [fetchFavoritos]);

    // CORREÇÃO: Renomeado para consistência e usando mensagens de state
    const handleAlternarFavorito = async (productId) => {
        setError('');
        setSuccessMessage('');
        try {
            // --- CORREÇÃO AQUI ---
            // Altere a URL de 'favorites' para 'favoritos'
            await apiClient.post('/favoritos/toggle/', { produto_id: productId });
            
            // Atualiza a UI removendo o item da lista
            setFavoritos(prevFavoritos => prevFavoritos.filter(p => p.id !== productId));
            setSuccessMessage('Produto removido dos favoritos com sucesso.');

        } catch (err) {
            setError('Erro ao remover favorito.');
            console.error(err);
        }
    };

    const handleAdicionarAoCarrinho = async (produtoId) => {
        setError('');
        setSuccessMessage('');
        try {
            await apiClient.post('/cart/items/', { produto_id: produtoId, quantidade: 1 });
            setSuccessMessage('Produto adicionado ao carrinho com sucesso!');
        } catch (err) {
            setError('Erro ao adicionar produto ao carrinho.');
            console.error(err);
        }
    };

    if (loading) return <p>Carregando seus favoritos...</p>;
    
    return (
        <div>
            <h2>Meus Produtos Favoritos</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

            {favoritos.length === 0 ? (
                <p>Você ainda não favoritou nenhum produto.</p>
            ) : (
                <ul style={productListStyles}>
                    {favoritos.map(produto => (
                        // --- CORREÇÃO PRINCIPAL AQUI ---
                        // Agora passamos as funções e o estado como props, em vez de children.
                        <ProductCard
                            key={produto.id}
                            product={produto}
                            showAdminButtons={false}
                            onAddToCart={handleAdicionarAoCarrinho}
                            onToggleFavorite={handleAlternarFavorito}
                            isFavorite={true} // Todos os produtos nesta página são, por definição, favoritos
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

export default FavoritosPage;