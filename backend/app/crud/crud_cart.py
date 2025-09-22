# backend/app/crud/crud_cart.py
from sqlalchemy.orm import Session, joinedload
from app.models.user import Carrinho, CarrinhoItem, Produto

def get_or_create_cart(db: Session, sindico_id: int) -> Carrinho:
    """Busca o carrinho de um síndico. Se não existir, cria um novo."""
    db_cart = db.query(Carrinho).filter(Carrinho.sindico_id == sindico_id).first()
    if not db_cart:
        db_cart = Carrinho(sindico_id=sindico_id)
        db.add(db_cart)
        db.commit()
        db.refresh(db_cart)
    return db_cart

def add_item_to_cart(db: Session, sindico_id: int, produto_id: int, quantidade: int) -> Carrinho:
    """Adiciona um item ao carrinho do síndico."""
    cart = get_or_create_cart(db, sindico_id=sindico_id)
    
    produto = db.query(Produto).filter(Produto.id == produto_id).first()
    if not produto:
        return None

    db_item = db.query(CarrinhoItem).filter(
        CarrinhoItem.carrinho_id == cart.id,
        CarrinhoItem.produto_id == produto_id
    ).first()

    if db_item:
        db_item.quantidade += quantidade
    else:
        # --- CORREÇÃO PRINCIPAL AQUI ---
        # Lógica robusta para definir o preço a ser congelado
        preco_a_congelar = produto.preco
        if produto.em_oferta and produto.preco_oferta is not None and produto.preco_oferta > 0:
            preco_a_congelar = produto.preco_oferta
        
        db_item = CarrinhoItem(
            carrinho_id=cart.id,
            produto_id=produto_id,
            quantidade=quantidade,
            preco_congelado=preco_a_congelar # <-- Usando o preço seguro
        )
    
    db.add(db_item)
    db.commit()
    db.refresh(cart)
    return cart

def remove_item_from_cart(db: Session, sindico_id: int, item_id: int) -> Carrinho | None:
    """Remove um item específico do carrinho de um síndico."""
    cart = get_or_create_cart(db, sindico_id=sindico_id)
    
    # Encontra o item, garantindo que ele pertença ao carrinho do usuário
    db_item = db.query(CarrinhoItem).filter(
        CarrinhoItem.id == item_id,
        CarrinhoItem.carrinho_id == cart.id
    ).first()

    if db_item:
        db.delete(db_item)
        db.commit()
        db.refresh(cart)
        return cart
        
    return None

def update_cart_item_quantity(db: Session, sindico_id: int, item_id: int, quantidade: int) -> Carrinho | None:
    """Atualiza a quantidade de um item específico no carrinho de um síndico."""
    cart = get_or_create_cart(db, sindico_id=sindico_id)
    
    db_item = db.query(CarrinhoItem).filter(
        CarrinhoItem.id == item_id,
        CarrinhoItem.carrinho_id == cart.id
    ).first()

    if db_item:
        db_item.quantidade = quantidade
        db.add(db_item)
        db.commit()
        db.refresh(cart)
        return cart
        
    return None # Item não encontrado
