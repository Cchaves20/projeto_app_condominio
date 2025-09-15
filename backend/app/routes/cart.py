# backend/app/routes/cart.py

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User, Carrinho, CarrinhoItem, Produto
from app.dependencies import get_current_user, get_current_sindico

# Vamos precisar de um schema para receber o ID do produto e a quantidade
from pydantic import BaseModel

class CartItemCreate(BaseModel):
    produto_id: int
    quantidade: int

router = APIRouter(
    prefix="/carrinhos",
    tags=["Carrinhos"]
)

@router.get("/")
def get_user_cart(current_user: User = Depends(get_current_user)):
    # Garante que o carrinho exista
    if not current_user.carrinho:
        return {"itens": [], "valor_total": 0}
    return current_user.carrinho

# --- NOVA ROTA ADICIONADA ---
@router.post("/adicionar_item/", status_code=status.HTTP_201_CREATED)
def adicionar_item_ao_carrinho(data: CartItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Encontra o produto
    produto = db.query(Produto).filter(Produto.id == data.produto_id).first()
    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")

    # 2. Garante que o usuário tenha um carrinho
    carrinho_usuario = current_user.carrinho
    if not carrinho_usuario:
        carrinho_usuario = Carrinho(sindico_id=current_user.id)
        db.add(carrinho_usuario)
        db.commit()
        db.refresh(carrinho_usuario)

    # 3. Verifica se o item já está no carrinho
    item_existente = db.query(CarrinhoItem).filter(
        CarrinhoItem.carrinho_id == carrinho_usuario.id,
        CarrinhoItem.produto_id == data.produto_id
    ).first()

    if item_existente:
        # Se já existe, apenas atualiza a quantidade
        item_existente.quantidade += data.quantidade
    else:
        # Se não existe, cria um novo item no carrinho
        novo_item = CarrinhoItem(
            carrinho_id=carrinho_usuario.id,
            produto_id=data.produto_id,
            quantidade=data.quantidade,
            preco_congelado=produto.preco_oferta if produto.em_oferta else produto.preco
        )
        db.add(novo_item)
    
    db.commit()
    return {"detail": "Item adicionado ao carrinho com sucesso!"}