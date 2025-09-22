# backend/app/crud/crud_favorites.py

from sqlalchemy.orm import Session, joinedload
from app.models.user import Favoritos, Produto

def get_or_create_favorites(db: Session, user_id: int) -> Favoritos:
    db_favorites = (
        db.query(Favoritos)
        .options(joinedload(Favoritos.produtos))
        .filter(Favoritos.usuario_id == user_id)
        .first()
    )
    if not db_favorites:
        db_favorites = Favoritos(usuario_id=user_id)
        db.add(db_favorites)
        db.commit()
        db.refresh(db_favorites)
    return db_favorites

def toggle_product_in_favorites(db: Session, user_id: int, product_id: int) -> Favoritos | None:
    db_favorites = get_or_create_favorites(db, user_id=user_id)
    product_to_toggle = db.query(Produto).filter(Produto.id == product_id).first()
    
    if not product_to_toggle:
        return None

    if product_to_toggle in db_favorites.produtos:
        db_favorites.produtos.remove(product_to_toggle)
    else:
        db_favorites.produtos.append(product_to_toggle)
    
    db.commit()
    # Recarregar o objeto com o relacionamento para garantir que a resposta seja atualizada
    db.refresh(db_favorites)
    return db_favorites