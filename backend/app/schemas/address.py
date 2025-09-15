# backend/app/schemas/address.py

from pydantic import BaseModel, ConfigDict
from typing import Optional

# Base para criar/atualizar um endereço
class AddressBase(BaseModel):
    apelido: str
    rua: str
    numero: str
    complemento: Optional[str] = None # Mantendo como opcional
    bairro: str # Adicionei o bairro de volta, pois é comum em endereços
    cidade: str
    estado: str
    cep: str

# Schema para os dados que chegam ao criar um endereço
class AddressCreate(AddressBase):
    pass # Herda todos os campos de AddressBase

# Schema para os dados que são retornados pela API (inclui o ID e user_id)
class Address(AddressBase): # Renomeei para Address para consistência com o modelo DB e o uso nas rotas
    id: int
    user_id: int # O ID do usuário ao qual o endereço pertence (importante para relacionamentos)

    # Configuração para Pydantic v2
    model_config = ConfigDict(from_attributes=True) # updated from orm_mode = True