// frontend/src/pages/FornecedorDashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
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
    // ... (restante do seu componente - states, useEffect, handleInputChange, handleImageUpload) ...
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
            let queryParams = {};
            if (searchTerm) {
                queryParams.search = searchTerm;
            }
            if (availabilityFilter !== 'all') {
                queryParams.availability = availabilityFilter === 'true';
            }

            const response = await api.get('/produtos', { params: queryParams });
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
            let newValue = value;

            if (type === 'checkbox') {
                newValue = checked;
                if (name === 'em_oferta' && !checked) {
                    return {
                        ...prev,
                        [name]: newValue,
                        preco_oferta: null
                    };
                }
            } else if (name === 'preco' || name === 'preco_oferta') {
                newValue = value === '' ? null : parseFloat(value);
            }

            return {
                ...prev,
                [name]: newValue
            };
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload/image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setCurrentProduct(prev => ({ ...prev, imagem_url: response.data.url }));
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

        const productData = { ...currentProduct };

        if (productData.em_oferta) {
            if (productData.preco_oferta === null || isNaN(productData.preco_oferta) || parseFloat(productData.preco_oferta) >= parseFloat(productData.preco)) {
                setError('O preço de oferta deve ser um número válido e menor que o preço normal quando o produto está em oferta.');
                return;
            }
        } else {
            productData.preco_oferta = null;
        }
        
        if (productData.preco === null || isNaN(productData.preco)) {
            setError('O preço do produto é obrigatório.');
            return;
        }

        try {
            if (editingProductId) {
                await api.patch(`/produtos/${editingProductId}`, productData);
                setSuccessMessage('Produto atualizado com sucesso!');
            } else {
                await api.post('/produtos', productData);
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
            if (Array.isArray(errorMsg)) {
                setError(errorMsg.map(e => `${e.loc.join('.')} - ${e.msg}`).join('; '));
            } else {
                setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
            }
            console.error(err);
        }
    };

    const handleEditClick = (product) => {
        setEditingProductId(product.id);
        setCurrentProduct({
            nome: product.nome,
            descricao: product.descricao,
            unidade_medida: product.unidade_medida,
            preco: product.preco,
            disponivel: product.disponivel,
            em_oferta: product.em_oferta,
            preco_oferta: product.preco_oferta || null,
            imagem_url: product.imagem_url || ''
        });
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm("Tem certeza que deseja deletar este produto?")) {
            setError('');
            setSuccessMessage('');
            try {
                await api.delete(`/produtos/${productId}`);
                setSuccessMessage('Produto deletado com sucesso!');
                fetchProdutos();
            } catch (err) {
                setError('Erro ao deletar produto.');
                console.error(err);
            }
        }
    };

    if (loading) return <p>Carregando produtos...</p>;

    return (
        <div>
            <h2>Painel do Fornecedor: {userProfile?.nome_empresa || userProfile?.nome_completo}</h2>

            <h3>{editingProductId ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
            {/* ... SEU FORMULÁRIO DE ADICIONAR/EDITAR PRODUTO VAI AQUI (INALTERADO) ... */}
            <form onSubmit={handleCreateUpdateProduct} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                <input
                    type="text"
                    name="nome"
                    value={currentProduct.nome}
                    onChange={handleInputChange}
                    placeholder="Nome do Produto"
                    required
                    style={formInputStyles}
                />
                <textarea
                    name="descricao"
                    value={currentProduct.descricao}
                    onChange={handleInputChange}
                    placeholder="Descrição do Produto"
                    style={formInputStyles}
                />
                <input
                    type="text"
                    name="unidade_medida"
                    value={currentProduct.unidade_medida}
                    onChange={handleInputChange}
                    placeholder="Unidade de Medida (ex: kg, un, litro)"
                    required
                    style={formInputStyles}
                />
                <input
                    type="number"
                    name="preco"
                    value={currentProduct.preco}
                    onChange={handleInputChange}
                    placeholder="Preço"
                    step="0.01"
                    required
                    style={formInputStyles}
                />
                <div>
                    <label style={{ display: 'block', marginBottom: '10px' }}>
                        Disponível:
                        <input
                            type="checkbox"
                            name="disponivel"
                            checked={currentProduct.disponivel}
                            onChange={handleInputChange}
                            style={{ marginLeft: '5px' }}
                        />
                    </label>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '10px' }}>
                        Em Oferta:
                        <input
                            type="checkbox"
                            name="em_oferta"
                            checked={currentProduct.em_oferta}
                            onChange={handleInputChange}
                            style={{ marginLeft: '5px' }}
                        />
                    </label>
                </div>
                {currentProduct.em_oferta && (
                    <input
                        type="number"
                        name="preco_oferta"
                        value={currentProduct.preco_oferta !== null ? currentProduct.preco_oferta : ''}
                        onChange={handleInputChange}
                        placeholder="Preço de Oferta"
                        step="0.01"
                        required={currentProduct.em_oferta}
                        style={formInputStyles}
                    />
                )}
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Imagem do Produto:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ marginBottom: '5px' }}
                    />
                    {currentProduct.imagem_url && (
                        <div>
                            <p>Pré-visualização:</p>
                            <img 
                                src={`http://127.0.0.1:8000${currentProduct.imagem_url}`}
                                alt="Pré-visualização do produto" 
                                style={{ maxWidth: '100px', maxHeight: '100px', border: '1px solid #ddd' }} 
                            />
                            <p style={{ fontSize: '0.8em', color: '#555' }}>URL Relativa: {currentProduct.imagem_url}</p>
                            <button type="button" onClick={() => setCurrentProduct(prev => ({ ...prev, imagem_url: '' }))} style={cancelButtonStyles}>Remover Imagem</button>
                        </div>
                    )}
                </div>


                <button type="submit" style={formButtonStyles}>{editingProductId ? 'Salvar Alterações' : 'Adicionar Produto'}</button>
                {editingProductId && (
                    <button type="button" onClick={() => {
                        setEditingProductId(null);
                        setCurrentProduct({
                            nome: '', descricao: '', unidade_medida: '', preco: '',
                            disponivel: true, em_oferta: false, preco_oferta: null, imagem_url: ''
                        });
                    }} style={cancelButtonStyles}>
                        Cancelar Edição
                    </button>
                )}
                {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
            </form>


            <h3>Meus Produtos no Catálogo</h3>
            
            <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #eee', borderRadius: '5px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Buscar por nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option value="all">Todos os Produtos</option>
                    <option value="true">Disponíveis</option>
                    <option value="false">Indisponíveis</option>
                </select>
            </div>


            {produtos.length === 0 ? (
                <p>Nenhum produto encontrado.</p>
            ) : (
                <ul style={productListStyles}>
                    {produtos.map(product => (
                        <ProductCard // <-- AQUI USAMOS O NOVO COMPONENTE
                            key={product.id}
                            product={product}
                            showAdminButtons={true} // Mostrar botões de edição/deleção
                            onEdit={handleEditClick}
                            onDelete={handleDeleteProduct}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

export default FornecedorDashboard;