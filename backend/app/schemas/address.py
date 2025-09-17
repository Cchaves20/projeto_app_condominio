# backend/app/schemas/address.py

from pydantic import BaseModel, ConfigDict
from typing import Optional

# Schema base com os campos comuns
class AddressBase(BaseModel):
    apelido: str
    rua: str
    numero: str
    complemento: Optional[str] = None
    bairro: str
    cidade: str
    estado: str
    cep: str

# Schema para criar um novo endereço
class AddressCreate(AddressBase):
    pass

# Schema para retornar um endereço da API (inclui o ID)
class Address(AddressBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)