# backend/app/crud/crud_pedido.py

from sqlalchemy.orm import Session
from typing import List, Optional  # Importando os tipos necessários

from app.models.user import Pedido, ItemPedido, CarrinhoItem
from app.schemas.pedido import PedidoCreate
from app.crud import crud_cart
def get_pedidos_by_sindico(db: Session, sindico_id: int, status: Optional[str] = None) -> List[Pedido]:
    """
    Busca no banco de dados todos os pedidos feitos por um síndico específico.
    Filtra opcionalmente por status.
    """
    # Usamos 'Pedido' diretamente, sem o prefixo 'models.'
    query = db.query(Pedido).filter(Pedido.sindico_id == sindico_id)
    
    if status:
        query = query.filter(Pedido.status == status)
        
    return query.order_by(Pedido.data_pedido.desc()).all()


def get_pedidos_by_entregador(db: Session, entregador_id: int, status: Optional[str] = None) -> List[Pedido]:
    """
    Busca no banco de dados todos os pedidos atribuídos a um entregador específico.
    Filtra opcionalmente por status.
    """
    query = db.query(Pedido).filter(Pedido.entregador_id == entregador_id)
    
    if status:
        query = query.filter(Pedido.status == status)
        
    return query.order_by(Pedido.data_pedido.desc()).all()


def get_pedidos_disponiveis(db: Session) -> List[Pedido]:
    """
    Busca no banco de dados todos os pedidos que estão prontos para serem
    retirados por um entregador.
    """
    # Assumindo que o status para pedidos disponíveis seja "PRONTO_PARA_RETIRADA"
    return db.query(Pedido).filter(Pedido.status == "PRONTO_PARA_RETIRADA").all()

def create_pedido_from_cart(db: Session, sindico_id: int, address_data: PedidoCreate) -> Pedido:
    """
    Cria um novo pedido a partir do carrinho de um síndico e limpa o carrinho.
    """
    # 1. Busca o carrinho do usuário
    cart = crud_cart.get_or_create_cart(db, sindico_id=sindico_id)
    if not cart.itens:
        raise ValueError("O carrinho está vazio. Não é possível criar um pedido.")

    # 2. Calcula o valor total
    valor_total = sum(item.quantidade * item.preco_congelado for item in cart.itens)

    # 3. Cria o objeto do novo Pedido com os dados do endereço
    db_pedido = Pedido(
        sindico_id=sindico_id,
        valor_total=valor_total,
        status="PENDENTE", # Status inicial
        **address_data.model_dump()
    )
    db.add(db_pedido)
    db.flush() # Aplica a sessão para obter o ID do novo pedido antes do commit

    # 4. Copia os itens do carrinho para a tabela de itens de pedido
    for item in cart.itens:
        db_item_pedido = ItemPedido(
            pedido_id=db_pedido.id,
            produto_id=item.produto_id,
            quantidade=item.quantidade,
            preco_congelado=item.preco_congelado,
            nome_produto=item.produto.nome,
            nome_fornecedor=item.produto.fornecedor.nome_empresa or item.produto.fornecedor.nome_completo
        )
        db.add(db_item_pedido)
    
    # 5. Limpa o carrinho
    db.query(CarrinhoItem).filter(CarrinhoItem.carrinho_id == cart.id).delete()
    
    db.commit()
    db.refresh(db_pedido)
    return db_pedido