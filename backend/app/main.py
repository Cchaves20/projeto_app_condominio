# backend/app/main.py

import os
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
# <-- 1. ADICIONE A IMPORTAÇÃO DE StaticFiles E do novo roteador 'uploads' -->
from fastapi.staticfiles import StaticFiles
from app.routes import auth, products, favorites, cart, pedidos, addresses, upload

app = FastAPI(
    title="API Condomínio",
    description="API para gerenciar as operações do condomínio, fornecedores e entregadores.",
    version="1.0.0"
)

# --- Configuração do CORS (Correto) ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# <-- 2. ADICIONE ESTA LINHA PARA SERVIR ARQUIVOS ESTÁTICOS -->
# Isso permite que URLs como '/static/uploads/imagem.png' funcionem.
# Deve vir antes da inclusão dos roteadores que podem usar esses caminhos.
app.mount("/static", StaticFiles(directory="static"), name="static")


# --- Agrupando Rotas sob um Roteador Principal ---
api_router = APIRouter()

# Inclua todos os seus roteadores de funcionalidades
api_router.include_router(auth.router)
api_router.include_router(products.router)
api_router.include_router(favorites.router)
api_router.include_router(cart.router)
api_router.include_router(pedidos.router)
api_router.include_router(addresses.router)
# <-- 3. ADICIONE A LINHA PARA INCLUIR O ROTEADOR DE UPLOADS -->
api_router.include_router(upload.router)


# Inclua o roteador principal na aplicação com o prefixo global "/api"
app.include_router(api_router, prefix="/api")


# --- Rota Raiz (Opcional) ---
@app.get("/", tags=["Root"])
async def root():
    return {"message": "Bem-vindo à API do Condomínio!"}