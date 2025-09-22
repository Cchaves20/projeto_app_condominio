# backend/app/schemas/cart.py

from pydantic import BaseModel, ConfigDict
from typing import List
from .product import ProductResponse

# Item individual dentro do carrinho
class CartItem(BaseModel):
    id: int
    quantidade: int
    # --- CORREÇÃO AQUI ---
    # Esta linha é essencial para que o preço seja enviado para o frontend.
    preco_congelado: float
    
    produto: ProductResponse
    model_config = ConfigDict(from_attributes=True)

# Schema para a resposta completa do carrinho
class CartResponse(BaseModel):
    id: int
    sindico_id: int
    itens: List[CartItem] = []
    model_config = ConfigDict(from_attributes=True)

# Schema para a requisição de adicionar um item
class CartItemCreate(BaseModel):
    produto_id: int
    quantidade: int

# Schema para a requisição de ATUALIZAR a quantidade de um item
class CartItemUpdate(BaseModel):
    quantidade: int