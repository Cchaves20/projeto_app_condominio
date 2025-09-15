# backend/app/database.py

print("DEBUG: Entrando em database.py") # <-- ADICIONE ESTA LINHA BEM NO TOPO

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

SQLALCHEMY_DATABASE_URL = "postgresql://app_user:sua_senha_secreta_aqui@localhost:5432/projeto_condominio"

print(f"DEBUG: SQLALCHEMY_DATABASE_URL antes de create_engine = {SQLALCHEMY_DATABASE_URL}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

print("DEBUG: Engine criada com sucesso.") # <-- ADICIONE ESTA LINHA

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()