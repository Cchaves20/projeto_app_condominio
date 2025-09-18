// frontend/src/components/ProductCard.jsx

// CORREÇÃO 1: Importar 'useState' e 'useEffect' do React
import React, { useState, useEffect } from 'react';
import placeholderImage from '../assets/placeholder.png'; // Garanta que esta imagem exista em src/assets/

// --- ESTILOS DO CARTÃO DE PRODUTO ---
const styles = {
    productItem: {
        border: '1px solid #ddd',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        borderRadius: '8px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '420px',
        position: 'relative',
        listStyle: 'none'
    },
    productImageWrapper: {
        position: 'relative',
        width: '100%',
        height: '200px',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    productActualImage: {
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    productContent: {
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        justifyContent: 'space-between',
    },
    productTitle: { margin: '0 0 5px 0', fontSize: '1.2em', fontWeight: 'bold' },
    productParagraph: { margin: '0 0 8px 0', lineHeight: '1.4', color: '#555', fontSize: '0.9em' },
    priceText: { fontWeight: 'bold', color: '#333', fontSize: '1.1em', marginBottom: '5px' },
    offerText: { color: 'green', fontWeight: 'bold' },
    offerBadge: {
        position: 'absolute', top: '10px', right: '10px', backgroundColor: '#ffc107',
        color: '#333', padding: '5px 10px', borderRadius: '5px',
        fontSize: '0.8em', fontWeight: 'bold', zIndex: 10,
    },
    buttonContainer: {
        marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px'
    },
    baseButton: {
        padding: '8px 12px', borderRadius: '4px', cursor: 'pointer',
        border: 'none', transition: 'background-color 0.2s ease',
        fontSize: '0.9em', fontWeight: 'bold', flexGrow: 1,
    },
};

// --- COMPONENTE PRODUCT CARD ---
const ProductCard = ({ product, showAdminButtons, onEdit, onDelete, onToggleAvailability, isFavorite, onAddToCart, onToggleFavorite }) => {
    
    const fullImageUrl = product.imagem_url 
        ? `http://127.0.0.1:8000${product.imagem_url}`
        : placeholderImage;

    const [imageSrc, setImageSrc] = useState(fullImageUrl);

    useEffect(() => {
        setImageSrc(product.imagem_url ? `http://127.0.0.1:8000${product.imagem_url}` : placeholderImage);
    }, [product.imagem_url]);

    const handleImageError = () => {
        setImageSrc(placeholderImage);
    };

    return (
        <li style={styles.productItem}>
            {product.em_oferta && <span style={styles.offerBadge}>OFERTA!</span>}

            <div style={styles.productImageWrapper}>
                <img 
                    src={imageSrc} 
                    alt={product.nome} 
                    style={styles.productActualImage}
                    onError={handleImageError}
                />
            </div>
            <div style={styles.productContent}>
                <div>
                    <h4 style={styles.productTitle}>{product.nome}</h4>
                    <p style={styles.productParagraph}>{product.descricao}</p>
                    <p style={styles.priceText}>R$ {product.preco.toFixed(2)} / {product.unidade_medida}</p>
                    {product.em_oferta && <p style={styles.offerText}>Oferta: R$ {product.preco_oferta?.toFixed(2)}</p>}
                    <p style={styles.productParagraph}>Disponível: {product.disponivel ? 'Sim' : 'Não'}</p>
                    {product.nome_fornecedor && <p style={styles.productParagraph}><strong>Vendido por:</strong> {product.nome_fornecedor}</p>}
                </div>
                
                <div style={styles.buttonContainer}>
                    {/* Botões do Painel do Fornecedor */}
                    {showAdminButtons && (
                        <>
                            <button onClick={() => onEdit(product)} style={{...styles.baseButton, backgroundColor: '#007bff', color: 'white'}}>Editar</button>
                            <button onClick={() => onDelete(product.id)} style={{...styles.baseButton, backgroundColor: '#dc3545', color: 'white'}}>Deletar</button>
                            <button onClick={() => onToggleAvailability(product.id, product.disponivel)} style={{...styles.baseButton, backgroundColor: '#17a2b8', color: 'white', width: '100%'}}>
                                {product.disponivel ? 'Tornar Indisponível' : 'Tornar Disponível'}
                            </button>
                        </>
                    )}
                    
                    {/* CORREÇÃO 2: Adicionando os botões para o cliente (Síndico) */}
                    {!showAdminButtons && (
                         <>
                            <button onClick={() => onAddToCart(product.id)} style={{...styles.baseButton, backgroundColor: '#28a745', color: 'white'}}>
                                Add ao Carrinho
                            </button>
                            <button onClick={() => onToggleFavorite(product.id)} style={{...styles.baseButton, backgroundColor: '#ffc107', color: '#333'}}>
                                {isFavorite ? '❤️ Favorito' : '🤍 Favoritar'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </li>
    );
};

export default ProductCard;