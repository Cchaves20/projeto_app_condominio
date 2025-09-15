import React from 'react';
import { Link } from 'react-router-dom'; // Se você tiver uma página de detalhes do produto

// --- ESTILOS DO CARTÃO DE PRODUTO ---
const productItemStyles = {
    border: '1px solid #ddd',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '350px', // Altura mínima para consistência
    position: 'relative', // Para o badge de oferta
};

const productImageWrapperStyles = {
    position: 'relative',
    width: '100%',
    height: '200px', // Altura fixa da área da imagem
    overflow: 'hidden',
    borderRadius: '8px 8px 0 0',
    backgroundColor: '#f0f0f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    // border: '1px dashed red', // DEBUG TEMPORÁRIO: Mostra a área do wrapper
};

const productActualImageStyles = {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain', // Ajusta a imagem inteira dentro do container
    objectPosition: 'center',
    borderRadius: '8px 8px 0 0',
    // border: '1px solid blue', // DEBUG TEMPORÁRIO: Mostra o tamanho real da imagem
};

const productContentStyles = {
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    color: '#333',
};

const productTitleStyles = {
    margin: '0 0 5px 0',
    color: '#333',
    fontSize: '1.2em',
    fontWeight: 'bold',
};

const productParagraphStyles = {
    margin: '0 0 5px 0',
    lineHeight: '1.4',
    color: '#555'
};

const priceTextStyles = {
    ...productParagraphStyles,
    fontWeight: 'bold',
    color: '#333',
};

const offerTextStyles = {
    ...productParagraphStyles,
    color: 'green',
    fontWeight: 'bold',
};

// Estilo para o badge de oferta
const offerBadgeStyles = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: '#ffc107', // Cor amarela para destaque
    color: '#333',
    padding: '5px 10px',
    borderRadius: '5px',
    fontSize: '0.8em',
    fontWeight: 'bold',
    zIndex: 10,
};

// Estilos para os botões de Ação (Editar/Deletar) dentro do card
const baseButtonCardStyles = {
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: 'none',
    marginRight: '10px',
    transition: 'background-color 0.2s ease',
    fontSize: '0.9em', // Um pouco menor para caber melhor no card
    fontWeight: 'bold',
};

const editButtonCardStyles = {
    ...baseButtonCardStyles,
    backgroundColor: '#007bff',
    color: 'white',
    '&:hover': { // Exemplo de hover, se estivesse usando Styled Components ou CSS Module
        backgroundColor: '#0056b3',
    }
};

const deleteButtonCardStyles = {
    ...baseButtonCardStyles,
    backgroundColor: '#dc3545',
    color: 'white',
    '&:hover': { // Exemplo de hover
        backgroundColor: '#c82333',
    }
};


// --- COMPONENTE PRODUCT CARD ---
const ProductCard = ({ product, showAdminButtons, onEdit, onDelete, children }) => { // Adicione children    // Definir uma URL de imagem fallback se product.imagem_url for nulo ou vazio
    const imageUrl = product.imagem_url ? `http://127.0.0.1:8000${product.imagem_url}` : 'https://via.placeholder.com/150?text=Sem+Imagem';

    return (
        <li style={productItemStyles}>
            {product.em_oferta && <span style={offerBadgeStyles}>OFERTA\!</span>}

            <div style={productImageWrapperStyles}>
                <img 
                    src={imageUrl} 
                    alt={product.nome} 
                    style={productActualImageStyles}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150?text=Erro+Imagem';
                        console.warn(`Erro ao carregar imagem para o produto ${product.nome}. URL: ${imageUrl}`);
                    }}
                />
            </div>
            <div style={productContentStyles}>
                <h4 style={productTitleStyles}>{product.nome}</h4>
                <p style={productParagraphStyles}>{product.descricao}</p>
                <p style={priceTextStyles}>Preço: R$ {product.preco.toFixed(2)} / {product.unidade_medida}</p>
                {product.em_oferta && <p style={offerTextStyles}>Oferta: R$ {product.preco_oferta?.toFixed(2)}</p>}
                <p style={productParagraphStyles}>Disponível: {product.disponivel ? 'Sim' : 'Não'}</p>
                
                {showAdminButtons && (
                    <div style={{ marginTop: '10px' }}> {/* Adicionado margem para separar botões */}
                        <button onClick={() => onEdit(product)} style={editButtonCardStyles}>Editar</button>
                        <button onClick={() => onDelete(product.id)} style={deleteButtonCardStyles}>Deletar</button>
                    </div>
                )}
                {children} {/* <-- Renderiza os children aqui */}
                {/* Você pode adicionar um link para detalhes do produto aqui se tiver */}
                {/* <Link to={`/produtos/${product.id}`} style={{ marginTop: '10px', display: 'block' }}>Ver Detalhes</Link> */}
            </div>
        </li>
    );
};

export default ProductCard;