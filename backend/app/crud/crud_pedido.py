# backend/app/crud/crud_pedido.py

from sqlalchemy.orm import Session
from typing import List, Optional

# --- CORREÇÃO AQUI ---
# Importamos a classe 'Pedido' diretamente do arquivo onde ela foi definida
from app.models.user import Pedido

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