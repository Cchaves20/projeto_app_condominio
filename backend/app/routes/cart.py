# backend/app/routes/cart.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Importações corrigidas e centralizadas
from app.dependencies import get_db, get_current_sindico
from app.models.user import User
# CORREÇÃO: Importando o novo schema 'CartItemUpdate'
from app.schemas.cart import CartResponse, CartItemCreate, CartItemUpdate
from app.crud import crud_cart

router = APIRouter(
    prefix="/carrinhos",
    tags=["Carrinhos"]
)

@router.get("/", response_model=CartResponse)
def read_user_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_sindico)
):
    """Retorna o carrinho de compras do síndico logado."""
    return crud_cart.get_or_create_cart(db, sindico_id=current_user.id)

@router.post("/items/", response_model=CartResponse)
def add_item_to_cart(
    item_data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_sindico)
):
    """Adiciona um item ao carrinho do síndico logado."""
    cart = crud_cart.add_item_to_cart(
        db, sindico_id=current_user.id, produto_id=item_data.produto_id, quantidade=item_data.quantidade
    )
    if cart is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return cart

# CORREÇÃO: Removida a classe 'CartItemUpdate' daqui
@router.patch("/items/{item_id}", response_model=CartResponse)
def update_item_quantity(
    item_id: int,
    item_data: CartItemUpdate, # <-- Agora usa o schema importado
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_sindico) # <-- Corrigido para usar 'User'
):
    """Atualiza a quantidade de um item no carrinho."""
    cart = crud_cart.update_cart_item_quantity(
        db, sindico_id=current_user.id, item_id=item_id, quantidade=item_data.quantidade
    )
    if cart is None:
        raise HTTPException(status_code=404, detail="Item não encontrado no carrinho")
    return cart

@router.delete("/items/{item_id}", response_model=CartResponse)
def remove_item_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_sindico)
):
    """Remove um item do carrinho do síndico logado."""
    cart = crud_cart.remove_item_from_cart(db, sindico_id=current_user.id, item_id=item_id)
    if cart is None:
        raise HTTPException(status_code=404, detail="Item não encontrado no carrinho")
    return cart