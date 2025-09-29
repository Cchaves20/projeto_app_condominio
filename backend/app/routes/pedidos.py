# backend/app/routes/pedidos.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

# --- CORREÇÃO AQUI: Importações explícitas e centralizadas ---
from app.dependencies import get_db, get_current_user, get_current_sindico
from app.models.user import User, TipoUsuario
from app.schemas.pedido import Pedido, PedidoCreate
from app.crud import crud_pedido

router = APIRouter(
    prefix="/pedidos",
    tags=["Pedidos"]
)

@router.get("/", response_model=List[Pedido])
def listar_pedidos_do_usuario(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista os pedidos associados ao usuário logado.
    """
    if current_user.tipo_usuario == TipoUsuario.SINDICO:
        pedidos = crud_pedido.get_pedidos_by_sindico(
            db=db, sindico_id=current_user.id, status=status
        )
    elif current_user.tipo_usuario == TipoUsuario.ENTREGADOR:
        # Supondo que você tenha esta função no seu crud_pedido.py
        pedidos = crud_pedido.get_pedidos_by_entregador(
            db=db, entregador_id=current_user.id, status=status
        )
    else:
        pedidos = []
        
    return pedidos


@router.get("/disponiveis", response_model=List[Pedido])
def listar_pedidos_disponiveis_para_entrega(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint exclusivo para ENTREGADORES.
    """
    if current_user.tipo_usuario != TipoUsuario.ENTREGADOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso não autorizado. Apenas entregadores podem ver os pedidos disponíveis."
        )
    
    # Supondo que você tenha esta função no seu crud_pedido.py
    pedidos = crud_pedido.get_pedidos_disponiveis(db=db)
    return pedidos


@router.post("/", response_model=Pedido, status_code=status.HTTP_201_CREATED)
def create_pedido(
    address_data: PedidoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_sindico)
):
    """
    Cria um novo pedido a partir do carrinho do síndico logado.
    """
    try:
        pedido = crud_pedido.create_pedido_from_cart(
            db=db, sindico_id=current_user.id, address_data=address_data
        )
        return pedido
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))