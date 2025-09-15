# backend/app/routes/favorites.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
# IMPORTANTE: Confirme que 'get_db' está realmente em 'app/database/connection.py'
from app.database.connection import get_db
# Importe todos os schemas relevantes
from app.schemas.favorite_schema import FavoriteToggle, FavoritosResponse, FavoriteProduct
# CORREÇÃO AQUI: Todos os modelos agora vêm de 'app.models.user'
from app.models.user import User, Favoritos, ProdutoFavorito, Produto # Tudo de user.py
from app.dependencies import get_current_user, get_current_sindico
router = APIRouter()

@router.post("/favoritos/alternar_favorito/", status_code=status.HTTP_200_OK)
def alternar_favorito(
    fav_toggle: FavoriteToggle,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    produto_id = fav_toggle.produto_id

    # 1. Encontrar o produto
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")

    # 2. Encontrar ou criar a lista de favoritos do usuário
    lista_favoritos_do_usuario = db.query(Favoritos).filter(Favoritos.usuario_id == current_user.id).first()

    if not lista_favoritos_do_usuario:
        # Se o usuário não tem uma lista de favoritos, crie uma
        lista_favoritos_do_usuario = Favoritos(usuario_id=current_user.id)
        db.add(lista_favoritos_do_usuario)
        db.commit()
        db.refresh(lista_favoritos_do_usuario) # Garante que o ID foi gerado

    # 3. Verificar se o produto já está na lista de favoritos
    produto_favorito_existente = db.query(ProdutoFavorito).filter(
        ProdutoFavorito.favoritos_id == lista_favoritos_do_usuario.id,
        ProdutoFavorito.produto_id == produto_id
    ).first()

    if produto_favorito_existente:
        # Se já existe, remove (desfavorita)
        db.delete(produto_favorito_existente)
        db.commit()
        return {"message": "Produto removido dos favoritos"}
    else:
        # Se não existe, adiciona (favorita)
        novo_produto_favorito = ProdutoFavorito(
            favoritos_id=lista_favoritos_do_usuario.id,
            produto_id=produto_id
        )
        db.add(novo_produto_favorito)
        db.commit()
        db.refresh(novo_produto_favorito)
        return {"message": "Produto adicionado aos favoritos"}

# Rota para obter favoritos
@router.get("/favoritos/", response_model=FavoritosResponse, status_code=status.HTTP_200_OK)
def get_favoritos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Procura a lista de favoritos do usuário
    lista_favoritos_do_usuario = db.query(Favoritos).filter(Favoritos.usuario_id == current_user.id).first()

    if not lista_favoritos_do_usuario:
        return FavoritosResponse(produtos=[])

    favoritos_com_produtos_models = db.query(Produto).join(ProdutoFavorito).filter(
        ProdutoFavorito.favoritos_id == lista_favoritos_do_usuario.id
    ).all()
    
    return {"produtos": favoritos_com_produtos_models}