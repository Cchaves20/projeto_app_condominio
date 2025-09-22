# backend/app/routes/favorites.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Importações corrigidas e centralizadas
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.favorites import FavoritesResponse, FavoriteToggleRequest
from app.crud import crud_favorites

router = APIRouter(
    prefix="/favoritos",  # <-- Deve ser em português
    tags=["Favoritos"]
)

@router.get("/", response_model=FavoritesResponse)
def read_user_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return crud_favorites.get_or_create_favorites(db, user_id=current_user.id)

@router.post("/toggle/", response_model=FavoritesResponse)
def toggle_favorite(
    request: FavoriteToggleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adiciona ou remove um produto dos favoritos do usuário logado."""
    updated_favorites = crud_favorites.toggle_product_in_favorites(
        db, user_id=current_user.id, product_id=request.produto_id
    )
    
    if updated_favorites is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
        
    return updated_favorites