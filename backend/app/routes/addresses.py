# backend/app/routes/addresses.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.schemas.address import AddressCreate, Address  # Você precisará criar estes schemas
from app.models.address import Address as DBAddress # Modelo do SQLAlchemy
from app.dependencies import get_current_user # Para proteger a rota

router = APIRouter(
    prefix="/addresses", # O prefixo para as rotas de endereço
    tags=["Endereços"],
)

# Rota para criar um novo endereço
@router.post("/", response_model=Address, status_code=status.HTTP_201_CREATED)
def create_address(
    address: AddressCreate, 
    current_user: dict = Depends(get_current_user), # Exige autenticação
    db: Session = Depends(get_db)
):
    db_address = DBAddress(**address.model_dump(), user_id=current_user["id"]) # Assume que o Address tem user_id
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

# Rota para obter todos os endereços do usuário logado
@router.get("/", response_model=List[Address])
def get_user_addresses(
    current_user: dict = Depends(get_current_user), # Exige autenticação
    db: Session = Depends(get_db)
):
    addresses = db.query(DBAddress).filter(DBAddress.user_id == current_user["id"]).all()
    return addresses

# Rota para obter um endereço específico por ID
@router.get("/{address_id}", response_model=Address)
def get_address(
    address_id: int, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_address = db.query(DBAddress).filter(DBAddress.id == address_id, DBAddress.user_id == current_user["id"]).first()
    if db_address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endereço não encontrado ou não pertence ao usuário")
    return db_address

# Rota para atualizar um endereço
@router.put("/{address_id}", response_model=Address)
def update_address(
    address_id: int, 
    address_update: AddressCreate, # Ou um schema AddressUpdate mais específico
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_address = db.query(DBAddress).filter(DBAddress.id == address_id, DBAddress.user_id == current_user["id"]).first()
    if db_address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endereço não encontrado ou não pertence ao usuário")
    
    for key, value in address_update.model_dump(exclude_unset=True).items():
        setattr(db_address, key, value)
    
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

# Rota para deletar um endereço
@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int, 
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_address = db.query(DBAddress).filter(DBAddress.id == address_id, DBAddress.user_id == current_user["id"]).first()
    if db_address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Endereço não encontrado ou não pertence ao usuário")
    
    db.delete(db_address)
    db.commit()
    return {"message": "Endereço deletado com sucesso"}