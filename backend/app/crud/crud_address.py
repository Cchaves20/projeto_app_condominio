# backend/app/crud/crud_address.py

from sqlalchemy.orm import Session
from typing import List

from app.models.user import Endereco
from app.schemas.address import AddressCreate

def get_address_by_id(db: Session, address_id: int, user_id: int) -> Endereco | None:
    """Busca um endereço específico pelo seu ID, garantindo que ele pertença ao usuário."""
    return db.query(Endereco).filter(Endereco.id == address_id, Endereco.user_id == user_id).first()

def get_addresses_by_user(db: Session, user_id: int) -> List[Endereco]:
    """Busca todos os endereços de um usuário."""
    return db.query(Endereco).filter(Endereco.user_id == user_id).all()

def create_user_address(db: Session, address: AddressCreate, user_id: int) -> Endereco:
    """Cria um novo endereço para um usuário."""
    db_address = Endereco(**address.model_dump(), user_id=user_id)
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

def update_address(db: Session, db_address: Endereco, address_update: AddressCreate) -> Endereco:
    """Atualiza os dados de um endereço existente."""
    update_data = address_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_address, key, value)
    db.add(db_address)
    db.commit()
    db.refresh(db_address)
    return db_address

def delete_address(db: Session, db_address: Endereco):
    """Deleta um endereço do banco de dados."""
    db.delete(db_address)
    db.commit()
    return db_address