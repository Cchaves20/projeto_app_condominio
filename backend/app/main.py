# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 

from app.database.base import engine, Base, get_db

# Importe suas rotas
from app.routes import auth, products, favorites, cart # Suas rotas existentes
from app.routes import addresses # <-- Adicione esta importação

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    print("DEBUG: Executando startup_event...") # <-- Adicione este print
    # Isso garante que todas as tabelas baseadas em seus modelos são criadas
    Base.metadata.create_all(bind=engine)
    print("DEBUG: Tabelas do banco de dados verificadas/criadas.") # <-- Adicione este print

# --- Configuração CORS (já deve estar aqui) ---
origins = [
    "http://localhost",
    "http://localhost:5173",  
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)
# --- Fim da configuração CORS ---

# Inclua suas rotas
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(favorites.router, prefix="/api")
app.include_router(cart.router, prefix="/api")
app.include_router(addresses.router, prefix="/api") # <-- Adicione esta linha

@app.get("/")
async def root():
    return {"message": "Bem-vindo à API do Condomínio!"}
