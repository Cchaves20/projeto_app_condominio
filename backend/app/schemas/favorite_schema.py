# backend/app/schemas/favorite_schema.py

from pydantic import BaseModel

# Schema para a requisição de alternar favorito (adicionar ou remover)
class FavoriteToggle(BaseModel):
    produto_id: int

# Schema para representar um item de produto em uma lista de favoritos (opcional, mas bom para consistência)
# Pode ser usado para serializar produtos dentro da resposta GET /favoritos/
class FavoriteProduct(BaseModel):
    id: int
    nome: str
    descricao: str
    preco: float
    # Adicione outros campos relevantes do seu modelo Produto
    imagem_url: str | None = None # Se você tem um campo de imagem
    preco_promocional: float | None = None # Se você tem um campo de promoção
    em_oferta: bool # Se você tem um campo de oferta

    class Config:
        from_attributes = True # Ou orm_mode = True para versões mais antigas do Pydantic
        # Isso permite que o Pydantic leia dados de modelos ORM (como o SQLAlchemy)

# Schema para a resposta da lista de favoritos (GET /favoritos/)
class FavoritosResponse(BaseModel):
    produtos: list[FavoriteProduct]