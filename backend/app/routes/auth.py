# backend/app/routes/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta 

# REMOVIDO: from fastapi.security import OAuth2PasswordRequestForm 
# NÃO PRECISAMOS MAIS DESTA IMPORTAÇÃO, pois o frontend envia JSON e o backend espera um Pydantic BaseModel

# Importações de utilitários de segurança
from app.utils.auth import hash_password, verify_password, create_access_token
# Importações de dependências personalizadas
from app.dependencies import get_current_user, get_current_sindico, get_current_fornecedor, authenticate_user_for_token 
from app.config import settings # Para acessar ACCESS_TOKEN_EXPIRE_MINUTES

# Importações de banco de dados e modelos
from app.database.base import get_db
from app.models.user import User, TipoUsuario 

# Importações de schemas
# Estes schemas são definidos em app/schemas/user.py e são usados para validação de entrada/saída
from app.schemas.user import UserCreate, UserProfileResponse, Login, LoginResponse 

router = APIRouter(prefix="/auth", tags=["Auth"])

# ==================== Rota de Registro ====================
@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Verifica se o username ou email já existem
    existing_user_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_user_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nome de usuário já registrado.")
    
    existing_user_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_user_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email já registrado.")

    # 2. Hash da senha
    hashed_password = hash_password(user_data.password)

    # 3. Cria o objeto User no banco de dados
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password=hashed_password,
        tipo_usuario=user_data.tipo_usuario,
        nome_completo=user_data.nome_completo,
        nome_empresa=user_data.nome_empresa,
        nome_condominio=user_data.nome_condominio,
        rua=user_data.rua,
        numero=user_data.numero,
        cidade=user_data.cidade,
        estado=user_data.estado,
        cep=user_data.cep
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # 4. Retorna a resposta (usando o schema UserProfileResponse)
    return db_user

# ==================== Rota de Login ====================
@router.post("/login", response_model=LoginResponse)
async def login_for_access_token(
    user_credentials: Login, # <-- CORREÇÃO: Agora espera o seu Pydantic 'Login' schema (JSON)
    db: Session = Depends(get_db)
):
    # NOTA: user_credentials.username e user_credentials.password já estarão disponíveis do JSON enviado
    user = authenticate_user_for_token(db, user_credentials.username, user_credentials.password) 

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nome de usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # Retorna o token de acesso e o perfil completo do usuário
    return {"access_token": access_token, "token_type": "bearer", "profile": user} 

# ==================== Rota para obter o perfil do usuário logado ====================
@router.get("/me", response_model=UserProfileResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Retorna o perfil do usuário logado."""
    # O `current_user` já é um objeto User completo do banco de dados,
    # então podemos retorná-lo diretamente e o response_model fará a validação.
    return current_user

# ==================== Exemplo de rota protegida para síndicos ====================
@router.get("/sindico-only", response_model=UserProfileResponse) 
async def read_sindico_info(current_sindico: User = Depends(get_current_sindico)):
    """Rota de exemplo protegida para síndicos."""
    return current_sindico 

# ==================== Exemplo de rota protegida para fornecedores ====================
@router.get("/fornecedor-only", response_model=UserProfileResponse) 
async def read_fornecedor_info(current_fornecedor: User = Depends(get_current_fornecedor)):
    """Rota de exemplo protegida para fornecedores."""
    return current_fornecedor