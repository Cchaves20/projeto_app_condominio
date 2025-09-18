# backend/app/routes/products.py

from fastapi import APIRouter, Depends, status, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional

# Importações estão corretas e centralizadas
from app.dependencies import get_db, get_current_user, get_current_fornecedor
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductAvailabilityUpdate
from app.crud import crud_product

router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"]
)

@router.get("/", response_model=List[ProductResponse])
def listar_produtos(
    search: Optional[str] = Query(None),
    disponivel: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lista produtos com base no perfil do usuário e filtros.
    """
    produtos = crud_product.get_products(db=db, user=current_user, search=search, disponivel=disponivel)
    return produtos

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def criar_produto(
    product_data: ProductCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_fornecedor)
):
    """Cria um novo produto para o fornecedor logado."""
    return crud_product.create_fornecedor_product(db=db, product_in=product_data, fornecedor_id=current_user.id)

@router.patch("/{product_id}", response_model=ProductResponse)
def atualizar_produto(
    product_id: int, 
    product_data: ProductUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_fornecedor)
):
    """Atualiza um produto pertencente ao fornecedor logado."""
    db_product = crud_product.get_product_by_id_and_fornecedor(db, product_id=product_id, fornecedor_id=current_user.id)
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    
    return crud_product.update_product(db=db, db_product=db_product, product_in=product_data)

# --- ADIÇÃO DA ROTA PARA ALTERNAR DISPONIBILIDADE ---
@router.patch("/{product_id}/availability", response_model=ProductResponse)
def toggle_product_availability(
    product_id: int,
    availability_update: ProductAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_fornecedor)
):
    """
    Alterna o status de disponibilidade de um produto pertencente ao fornecedor logado.
    """
    db_product = crud_product.get_product_by_id_and_fornecedor(
        db=db, product_id=product_id, fornecedor_id=current_user.id
    )
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    return crud_product.update_product_availability(
        db=db, db_product=db_product, is_available=availability_update.disponivel
    )
# --- FIM DA ADIÇÃO ---

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_produto(
    product_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_fornecedor)
):
    """Deleta um produto pertencente ao fornecedor logado."""
    db_product = crud_product.get_product_by_id_and_fornecedor(db, product_id=product_id, fornecedor_id=current_user.id)
    if not db_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    
    crud_product.delete_product(db=db, db_product=db_product)
    return Response(status_code=status.HTTP_204_NO_CONTENT)