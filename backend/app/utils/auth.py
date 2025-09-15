# backend/app/utils/auth.py
import os
from datetime import datetime, timedelta
from typing import Optional # <-- Adicione esta importação
from jose import jwt
from passlib.context import CryptContext # Se você usa para hashing
from app.config import settings
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

if not SECRET_KEY:
    raise ValueError("SECRET_KEY não definido no ambiente ou arquivo .env")
if not ALGORITHM:
    raise ValueError("ALGORITHM não definido no ambiente ou arquivo .env")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Função de verificação de senha
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Função de criação de token de acesso
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Padrão se não for fornecido
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes) 
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decodifica e valida o payload de um token JWT. Não trata exceções de credenciais."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        # Re-raise o erro para que a dependência possa tratá-lo com HTTPException
        raise e