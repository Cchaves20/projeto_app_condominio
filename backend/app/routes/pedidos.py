# backend/app/routes/pedidos.py

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.user import User, Pedido # Importe seus modelos
from app.utils.auth import get_current_user
# Futuramente, você criará schemas para os pedidos
# from app.schemas.pedido import PedidoResponse 

router = APIRouter(
    # Vamos manter o prefixo genérico aqui
    prefix="/pedidos",
    tags=["Pedidos"]
)

# Rota para listar pedidos (ex: GET /api/pedidos/?status=A_CAMINHO)
@router.get("/")
def listar_pedidos(status: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Lista pedidos baseados em filtros e no tipo de usuário.
    """
    print(f"Buscando pedidos com status: {status} para o usuário {current_user.username}")
    
    # Aqui virá a lógica para buscar no banco de dados.
    # Por agora, retornamos uma lista vazia para o endpoint funcionar.
    return []

# --- NOVA ROTA ADICIONADA ---
# Esta é a rota que seu EntregadorDashboard estava procurando.
# Note que o prefixo "/pedidos" do router NÃO se aplica aqui, pois o path começa com '/'.
# Para manter a consistência, vamos criar um router separado para isso.
# A melhor abordagem é criar um novo router para o entregador.

# Vamos criar um novo router para as funcionalidades do entregador
entregador_router = APIRouter(
    prefix="/pedidos-disponiveis",
    tags=["Entregador"]
)

@entregador_router.get("/")
def listar_pedidos_disponiveis(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Lista todos os pedidos que estão com status "PRONTO_PARA_RETIRADA".
    """
    # Lógica para buscar os pedidos no banco de dados virá aqui.
    # Por agora, retornamos uma lista vazia para resolver o 404.
    print(f"Entregador {current_user.username} está buscando pedidos disponíveis.")
    return []

# --- ATUALIZAÇÃO NO MAIN.PY É NECESSÁRIA ---