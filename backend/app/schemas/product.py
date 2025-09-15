# backend/app/schemas/product.py

from pydantic import BaseModel, ConfigDict
from typing import Optional

class ProductCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    unidade_medida: str
    preco: float
    disponivel: bool = True
    em_oferta: bool = False
    preco_oferta: Optional[float] = None
    imagem_url: Optional[str] = None # --- ADICIONADO AQUI ---

class ProductUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    unidade_medida: Optional[str] = None
    preco: Optional[float] = None
    disponivel: Optional[bool] = None
    em_oferta: Optional[bool] = None
    preco_oferta: Optional[float] = None
    imagem_url: Optional[str] = None # --- ADICIONADO AQUI ---

class ProductResponse(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    preco: float
    unidade_medida: str
    disponivel: bool
    fornecedor_id: int
    em_oferta: bool
    preco_oferta: Optional[float] = None
    imagem_url: Optional[str] = None # --- ADICIONADO AQUI ---
    nome_fornecedor: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)