# backend/app/database/base.py

print("DEBUG: Entrando em app/database/base.py") # <-- AGORA AQUI

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Verifique que esta URL NÃO TEM "?check_same_thread=False"
SQLALCHEMY_DATABASE_URL = "postgresql://app_user:Blue151174!@localhost:5432/projeto_condominio"
# Substitua sua_senha_secreta_aqui pela senha real do seu app_user.

print(f"DEBUG: SQLALCHEMY_DATABASE_URL antes de create_engine = {SQLALCHEMY_DATABASE_URL}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
    # Não inclua connect_args={"check_same_thread": False} para PostgreSQL
)

print("DEBUG: Engine criada com sucesso.") # <-- AGORA AQUI

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Isso é importante para que todos os seus modelos sejam registrados com Base
# antes que Base.metadata.create_all() seja chamado.
# Adapte conforme a sua estrutura de modelos:
# Se você tem um __init__.py em app/models que importa tudo:
from app import models
# Ou se você importa cada um individualmente:
# from app.models import user
# from app.models import produto
# from app.models import favoritos

# Certifique-se de que os modelos estão sendo importados aqui se não estiverem
# sendo importados por algum outro __init__.py que é importado.

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

print("DEBUG: Saindo de app/database/base.py") # <-- AGORA AQUI