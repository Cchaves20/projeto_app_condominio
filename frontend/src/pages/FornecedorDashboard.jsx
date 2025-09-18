// frontend/src/pages/FornecedorDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard'; // <-- IMPORTE O NOVO COMPONENTE

// --- ESTILOS CSS (Apenas os estilos GERAIS do Dashboard ou FORMULÁRIO) ---
const productListStyles = { // Este estilo ainda é necessário para o GRID
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    listStyleType: 'none',
    padding: 0
};

// MANTENHA APENAS OS ESTILOS RELACIONADOS AO FORMULÁRIO E BOTOES GERAIS AQUI
const buttonStyles = {
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: 'none',
    marginRight: '10px',
    transition: 'background-color 0.2s ease'
};

const formInputStyles = {
    width: 'calc(100% - 20px)',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px'
};

const formButtonStyles = {
    ...buttonStyles,
    backgroundColor: '#28a745',
    color: 'white',
    marginTop: '10px',
    width: 'auto'
};

const cancelButtonStyles = {
    ...buttonStyles,
    backgroundColor: '#6c757d',
    color: 'white',
    marginTop: '10px'
};
// --- FIM DOS ESTILOS ---

function FornecedorDashboard() {
    const { userProfile } = useAuth();
    const [produtos, setProdutos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [editingProductId, setEditingProductId] = useState(null);
    const [currentProduct, setCurrentProduct] = useState({
        nome: '',
        descricao: '',
        unidade_medida: '',
        preco: '',
        disponivel: true,
        em_oferta: false,
        preco_oferta: null,
        imagem_url: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [availabilityFilter, setAvailabilityFilter] = useState('all');

    const fetchProdutos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.get('/produtos', { 
                params: {
                    search: searchTerm || undefined,
                    disponivel: availabilityFilter === 'all' ? undefined : availabilityFilter === 'true'
                } 
            });
            setProdutos(response.data);
        } catch (err) {
            setError('Erro ao carregar produtos.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, availabilityFilter]);

    useEffect(() => {
        fetchProdutos();
    }, [fetchProdutos]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentProduct(prev => {
            const newValue = type === 'checkbox' ? checked : value;
            const updatedProduct = { ...prev, [name]: newValue };

            if (name === 'em_oferta' && !checked) {
                updatedProduct.preco_oferta = null;
            }
            if ((name === 'preco' || name === 'preco_oferta') && value === '') {
                updatedProduct[name] = null;
            }
            return updatedProduct;
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await apiClient.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // CORREÇÃO: O backend retorna 'file_path', não 'url'.
            setCurrentProduct(prev => ({ ...prev, imagem_url: response.data.file_path }));
            setSuccessMessage('Imagem carregada com sucesso!');
        } catch (err) {
            setError('Erro ao carregar imagem.');
            console.error(err);
        }
    };

    const handleCreateUpdateProduct = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const productData = {
            ...currentProduct,
            preco: parseFloat(currentProduct.preco),
            preco_oferta: currentProduct.em_oferta ? parseFloat(currentProduct.preco_oferta) : null,
        };
        
        if (productData.em_oferta && (!productData.preco_oferta || productData.preco_oferta >= productData.preco)) {
            setError('O preço de oferta deve ser menor que o preço normal.');
            return;
        }

        try {
            if (editingProductId) {
                await apiClient.patch(`/produtos/${editingProductId}`, productData);
                setSuccessMessage('Produto atualizado com sucesso!');
            } else {
                await apiClient.post('/produtos', productData);
                setSuccessMessage('Produto criado com sucesso!');
            }
            setEditingProductId(null);
            setCurrentProduct({
                nome: '', descricao: '', unidade_medida: '', preco: '',
                disponivel: true, em_oferta: false, preco_oferta: null, imagem_url: ''
            });
            fetchProdutos();
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Erro ao salvar produto.';
            setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
            console.error(err);
        }
    };
    
    const handleEditClick = (product) => {
        setEditingProductId(product.id);
        setCurrentProduct({ ...product, preco_oferta: product.preco_oferta || null });
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm("Tem certeza que deseja deletar este produto?")) {
            try {
                await apiClient.delete(`/produtos/${productId}`);
                setSuccessMessage('Produto deletado com sucesso!');
                fetchProdutos();
            } catch (err) {
                setError('Erro ao deletar produto.');
                console.error(err);
            }
        }
    };

    const handleToggleAvailability = async (productId, currentStatus) => {
        setError('');
        setSuccessMessage('');
        try {
            // Chama o endpoint PATCH que criamos no backend
            const response = await apiClient.patch(`/produtos/${productId}/availability`, {
                disponivel: !currentStatus 
            });

            // Atualiza a lista de produtos na tela para refletir a mudança instantaneamente
            setProdutos(prevProdutos => 
                prevProdutos.map(p => 
                    p.id === productId ? response.data : p
                )
            );
            setSuccessMessage(`Produto ${response.data.disponivel ? 'disponibilizado' : 'indisponibilizado'} com sucesso!`);

        } catch (err) {
            setError('Erro ao alterar a disponibilidade do produto.');
            console.error(err);
        }
    };

    if (loading) return <p>Carregando produtos...</p>;

    return (
        <div>
            <h2>Painel do Fornecedor: {userProfile?.nome_empresa || userProfile?.nome_completo}</h2>

            <h3>{editingProductId ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
            <form onSubmit={handleCreateUpdateProduct} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <input type="text" name="nome" value={currentProduct.nome} onChange={handleInputChange} placeholder="Nome do Produto" required style={formInputStyles} />
                <textarea name="descricao" value={currentProduct.descricao} onChange={handleInputChange} placeholder="Descrição do Produto" style={formInputStyles} />
                <input type="text" name="unidade_medida" value={currentProduct.unidade_medida} onChange={handleInputChange} placeholder="Unidade (ex: kg, un, litro)" required style={formInputStyles} />
                <input type="number" name="preco" value={currentProduct.preco} onChange={handleInputChange} placeholder="Preço" step="0.01" required style={formInputStyles} />
                
                <div>
                    <label><input type="checkbox" name="disponivel" checked={currentProduct.disponivel} onChange={handleInputChange} /> Disponível</label>
                </div>
                <div>
                    <label><input type="checkbox" name="em_oferta" checked={currentProduct.em_oferta} onChange={handleInputChange} /> Em Oferta</label>
                </div>
                
                {currentProduct.em_oferta && (
                    <input type="number" name="preco_oferta" value={currentProduct.preco_oferta ?? ''} onChange={handleInputChange} placeholder="Preço de Oferta" step="0.01" required={currentProduct.em_oferta} style={formInputStyles} />
                )}
                
                <div>
                    <label>Imagem do Produto:</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                    {currentProduct.imagem_url && (
                        <div>
                            <p>Pré-visualização:</p>
                            <img src={`http://127.0.0.1:8000${currentProduct.imagem_url}`} alt="Pré-visualização" style={{ maxWidth: '100px', border: '1px solid #ddd' }} />
                            <button type="button" onClick={() => setCurrentProduct(prev => ({ ...prev, imagem_url: '' }))}>Remover Imagem</button>
                        </div>
                    )}
                </div>

                <button type="submit" style={formButtonStyles}>{editingProductId ? 'Salvar Alterações' : 'Adicionar Produto'}</button>
                {editingProductId && (
                    <button type="button" onClick={() => { setEditingProductId(null); setCurrentProduct({ nome: '', descricao: '', unidade_medida: '', preco: '', disponivel: true, em_oferta: false, preco_oferta: null, imagem_url: '' }); }} style={cancelButtonStyles}>
                        Cancelar Edição
                    </button>
                )}
                {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>

            <h3>Meus Produtos no Catálogo</h3>
            <div style={{ marginBottom: '20px' }}>
                <input type="text" placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="true">Disponíveis</option>
                    <option value="false">Indisponíveis</option>
                </select>
            </div>

            {produtos.length === 0 ? (
                <p>Nenhum produto encontrado.</p>
            ) : (
                <ul style={productListStyles}>
                    {produtos.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            showAdminButtons={true}
                            onEdit={handleEditClick}
                            onDelete={handleDeleteProduct}
                            // --- CORREÇÃO AQUI ---
                            // Passando a função para o componente ProductCard
                            onToggleAvailability={handleToggleAvailability}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

export default FornecedorDashboard;