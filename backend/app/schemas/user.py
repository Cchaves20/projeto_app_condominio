# backend/app/schemas/user.py

from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import TipoUsuario, User # Importe o enum TipoUsuario (se User for de outro modulo)

# Schema para criação de usuário (registro)
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    tipo_usuario: TipoUsuario
    nome_completo: Optional[str] = Field(None, max_length=150)
    nome_empresa: Optional[str] = Field(None, max_length=100)
    nome_condominio: Optional[str] = Field(None, max_length=150)
    rua: Optional[str] = Field(None, max_length=255)
    numero: Optional[str] = Field(None, max_length=20)
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, max_length=50) 
    cep: Optional[str] = Field(None, max_length=9)

# Schema para a resposta do perfil do usuário (omitindo a senha)
class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    tipo_usuario: TipoUsuario
    nome_completo: Optional[str] = None
    nome_empresa: Optional[str] = None
    nome_condominio: Optional[str] = None
    rua: Optional[str] = None
    numero: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None 
    cep: Optional[str] = None

    class Config:
        from_attributes = True # Para Pydantic v2+
        # orm_mode = True # Para Pydantic v1.x, se ainda estiver usando

# NOVO: Schema para a entrada de login
class Login(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    profile: UserProfileResponse

# Schema para atualização de usuário (se você tiver uma rota de atualização)
class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    tipo_usuario: Optional[TipoUsuario] = None
    nome_completo: Optional[str] = Field(None, max_length=150)
    nome_empresa: Optional[str] = Field(None, max_length=100)
    nome_condominio: Optional[str] = Field(None, max_length=150)
    rua: Optional[str] = Field(None, max_length=255)
    numero: Optional[str] = Field(None, max_length=20)
    cidade: Optional[str] = Field(None, max_length=100)
    estado: Optional[str] = Field(None, max_length=50)
    cep: Optional[str] = Field(None, max_length=9)

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfile(BaseModel):
    id: int
    username: str
    email: str
    tipo_usuario: str

class UserSimpleResponse(BaseModel):
    """
    Um schema simplificado para retornar apenas informações básicas do usuário.
    """
    id: int
    username: str
    nome_completo: str | None = None # Usando | None para campos opcionais

    # Permite que o Pydantic leia os dados de um objeto SQLAlchemy
    model_config = ConfigDict(from_attributes=True)
