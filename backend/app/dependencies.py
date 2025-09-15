# backend/app/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database.connection import get_db
from app.models.user import User, TipoUsuario 
# --- CORREÇÃO AQUI: Altere 'security' para 'auth' ---
from app.utils.auth import verify_password, create_access_token # Importe o create_access_token também se for usado para decodificação

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def authenticate_user_for_token(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = {"username": username}
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == token_data["username"]).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_sindico(current_user: User = Depends(get_current_user)):
    if current_user.tipo_usuario != TipoUsuario.SINDICO:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a síndicos")
    return current_user

async def get_current_fornecedor(current_user: User = Depends(get_current_user)):
    if current_user.tipo_usuario != TipoUsuario.FORNECEDOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a fornecedores")
    return current_user