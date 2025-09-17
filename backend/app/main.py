# backend/app/main.py

import os
from fastapi import FastAPI, APIRouter # <-- Importe o APIRouter
from fastapi.middleware.cors import CORSMiddleware
# Importe seus roteadores de funcionalidade
from app.routes import auth, products, favorites, cart, pedidos, addresses # <-- Adicionei 'pedidos' que criamos
# A URL do banco não deve ser importada aqui, ela deve ser usada dentro de 'database'
# from app.database.base import SQLALCHEMY_DATABASE_URL # <-- REMOVA ESTA LINHA

app = FastAPI(
    title="API Condomínio",
    description="API para gerenciar as operações do condomínio, fornecedores e entregadores.",
    version="1.0.0"
)

# --- Configuração do CORS (Correto) ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # Você pode remover os outros se não forem necessários
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CORREÇÃO: Agrupando Rotas sob um Roteador Principal ---

# 1. Crie um roteador principal para a API
api_router = APIRouter()

# 2. Inclua todos os seus roteadores de funcionalidades NELE, sem o prefixo "/api"
#    Eles já têm seus próprios prefixos (ex: "/auth", "/products").
api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(favorites.router)
api_router.include_router(cart.router)
api_router.include_router(pedidos.router)
api_router.include_router(addresses.router)

# 3. Inclua o roteador principal na aplicação com o prefixo global "/api"
app.include_router(api_router, prefix="/api")

# --- Rota Raiz (Opcional) ---
@app.get("/", tags=["Root"])
async def root():
    return {"message": "Bem-vindo à API do Condomínio!"}

# Seus prints de debug para verificar a URL do banco podem continuar aqui se precisar
# Lembre-se de importar a variável de um arquivo de configuração, não do 'base.py'
# Ex: from app.config import settings
# print(f"DEBUG: DATABASE_URL = {settings.database_url}")