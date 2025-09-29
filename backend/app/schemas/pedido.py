# backend/app/schemas/pedido.py

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

from .user import UserSimpleResponse  # Supondo que você tenha um schema simples para User

# Schema para um item individual dentro de um pedido
class ItemPedido(BaseModel):
    id: int
    produto_id: int
    quantidade: int
    preco_congelado: float
    nome_produto: str
    model_config = ConfigDict(from_attributes=True)

# Schema base para um Pedido
class PedidoBase(BaseModel):
    status: str
    valor_total: float
    rua: Optional[str] = None
    numero: Optional[str] = None
    cep: Optional[str] = None
    complemento: Optional[str] = None

# Schema para retornar um pedido completo na API
class Pedido(PedidoBase):
    id: int
    sindico_id: int
    entregador_id: Optional[int] = None
    data_pedido: datetime
    itens_pedido: List[ItemPedido] = []
    sindico: UserSimpleResponse # <-- Agora o Pydantic sabe o que é um UserSimpleResponse

    model_config = ConfigDict(from_attributes=True)
    
class PedidoCreate(BaseModel):
    rua: str
    numero: str
    cep: str
    bairro: str
    cidade: str
    estado: str
    complemento: Optional[str] = None