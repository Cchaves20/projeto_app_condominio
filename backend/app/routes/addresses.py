# backend/app/routes/addresses.py

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List

# Importações corrigidas e centralizadas
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.address import Address, AddressCreate
from app.crud import crud_address

router = APIRouter(
    prefix="/enderecos", # <-- Alterado para português, para consistência com a API
    tags=["Endereços"],
)

@router.post("/", response_model=Address, status_code=status.HTTP_201_CREATED)
def create_address(
    address: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # <-- Corrigido: o tipo é 'User', não 'dict'
):
    """Cria um novo endereço para o usuário logado."""
    return crud_address.create_user_address(db=db, address=address, user_id=current_user.id)

@router.get("/", response_model=List[Address])
def get_user_addresses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # <-- Corrigido: o tipo é 'User', não 'dict'
):
    """Retorna todos os endereços do usuário logado."""
    return crud_address.get_addresses_by_user(db=db, user_id=current_user.id)

@router.get("/{address_id}", response_model=Address)
def get_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna um endereço específico do usuário."""
    db_address = crud_address.get_address_by_id(db=db, address_id=address_id, user_id=current_user.id)
    if db_address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endereço não encontrado")
    return db_address

@router.put("/{address_id}", response_model=Address)
def update_address(
    address_id: int,
    address_update: AddressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza um endereço do usuário."""
    db_address = crud_address.get_address_by_id(db=db, address_id=address_id, user_id=current_user.id)
    if db_address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endereço não encontrado")
    
    return crud_address.update_address(db=db, db_address=db_address, address_update=address_update)

@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deleta um endereço do usuário."""
    db_address = crud_address.get_address_by_id(db=db, address_id=address_id, user_id=current_user.id)
    if db_address:
        crud_address.delete_address(db=db, db_address=db_address)
    # A resposta para 204 No Content não deve ter corpo
    return Response(status_code=status.HTTP_204_NO_CONTENT)