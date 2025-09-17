# backend/app/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

# Importações do seu projeto
from app.config import settings
from app.database.connection import get_db
from app.models.user import User, TipoUsuario
from app.schemas.token import TokenData # <-- Adicionar import do schema
from app.utils.auth import verify_password

# O tokenUrl deve ser o caminho para o endpoint de login, relativo à raiz da API
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def authenticate_user_for_token(db: Session, username: str, password: str) -> User | None:
    """Verifica se um usuário existe e se a senha está correta."""
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password):
        return None
    return user

# REFINAMENTO: Removido 'async' pois não há 'await' dentro da função.
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Decodifica o token, valida os dados e retorna o usuário do banco."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
        
        # REFINAMENTO: Usando um schema Pydantic para validar os dados do token
        token_data = TokenData(username=username)

    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
        
    return user

# REFINAMENTO: Removido 'async'
def get_current_sindico(current_user: User = Depends(get_current_user)) -> User:
    """Dependência que garante que o usuário logado é um síndico."""
    if current_user.tipo_usuario != TipoUsuario.SINDICO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acesso restrito a síndicos"
        )
    return current_user

# REFINAMENTO: Removido 'async'
def get_current_fornecedor(current_user: User = Depends(get_current_user)) -> User:
    """Dependência que garante que o usuário logado é um fornecedor."""
    if current_user.tipo_usuario != TipoUsuario.FORNECEDOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acesso restrito a fornecedores"
        )
    return current_user