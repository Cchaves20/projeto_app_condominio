# backend/app/main.py

import os # <-- Garanta que 'os' está importado
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, products, favorites, cart
from app.database.base import SQLALCHEMY_DATABASE_URL

# --- ADICIONE ESTAS DUAS LINHAS LOGO AQUI ---
print(f"DEBUG (main.py): SQLALCHEMY_DATABASE_URL sendo usada: {SQLALCHEMY_DATABASE_URL}")
print(f"DEBUG (main.py): Valor de DATABASE_URL do ambiente: {os.getenv('DATABASE_URL')}")
# --- FIM DAS LINHAS ADICIONADAS ---

app = FastAPI(title="API Condomínio")

# Configuração CORS - VERIFIQUE ISTO
origins = [
    "http://localhost",
    "http://localhost:5173",  # Seu frontend Vite/React
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5173",  # Outra forma de referenciar o localhost
    # Adicione outros domínios de frontend permitidos aqui se necessário
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")
app.include_router(cart.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Bem-vindo à API do Condomínio!"}