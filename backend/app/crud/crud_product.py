# backend/app/crud/crud_product.py

from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.models.user import Produto, User, TipoUsuario
from app.schemas.product import ProductCreate, ProductUpdate

def get_product_by_id_and_fornecedor(db: Session, product_id: int, fornecedor_id: int) -> Produto | None:
    """
    Busca um produto específico pelo seu ID, garantindo que ele pertença ao fornecedor.
    """
    return db.query(Produto).filter(Produto.id == product_id, Produto.fornecedor_id == fornecedor_id).first()

def get_products(
    db: Session, 
    user: User,
    search: Optional[str] = None, 
    disponivel: Optional[bool] = None,
    em_oferta: Optional[bool] = None  # <-- 1. ADICIONE O NOVO PARÂMETRO
) -> List[Produto]:
    """
    Busca produtos com lógica de negócio baseada no tipo de usuário e filtros.
    """
    query = db.query(Produto).options(joinedload(Produto.fornecedor))

    if user.tipo_usuario == TipoUsuario.FORNECEDOR:
        query = query.filter(Produto.fornecedor_id == user.id)
        if disponivel is not None:
            query = query.filter(Produto.disponivel == disponivel)
    else:
        query = query.filter(Produto.disponivel == True)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Produto.nome.ilike(search_pattern)) | 
            (Produto.descricao.ilike(search_pattern))
        )

    if em_oferta is not None:
        query = query.filter(Produto.em_oferta == em_oferta)
        
    return query.order_by(Produto.nome).all()

def create_fornecedor_product(db: Session, product_in: ProductCreate, fornecedor_id: int) -> Produto:
    """
    Cria um novo produto para um fornecedor.
    """
    # Cria o objeto do modelo SQLAlchemy a partir do schema Pydantic
    db_product = Produto(**product_in.model_dump(), fornecedor_id=fornecedor_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, db_product: Produto, product_in: ProductUpdate) -> Produto:
    """
    Atualiza os dados de um produto existente.
    """
    # Converte o schema Pydantic para um dicionário, excluindo campos não enviados
    update_data = product_in.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, db_product: Produto):
    """
    Deleta um produto do banco de dados.
    """
    db.delete(db_product)
    db.commit()
    return db_product

def update_product_availability(db: Session, db_product: Produto, is_available: bool) -> Produto:
    """
    Atualiza apenas o status de disponibilidade de um produto.
    """
    db_product.disponivel = is_available
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product