# backend/app/models/user.py

import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Enum
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.database.base import Base # <--- Mantendo esta importação conforme seu último erro e organização


# =============================== ENUMS ===============================
class TipoUsuario(str, enum.Enum):
    SINDICO = "SINDICO"
    FORNECEDOR = "FORNECEDOR"
    ENTREGADOR = "ENTREGADOR"


# =============================== TABELAS DE ASSOCIAÇÃO ===============================
# Esta é a classe de associação para a relação muitos-para-muitos entre Produto e Favoritos
class ProdutoFavorito(Base):
    __tablename__ = "favoritos_produtos"
    favoritos_id: Mapped[int] = mapped_column(ForeignKey("favoritos.id"), primary_key=True)
    produto_id: Mapped[int] = mapped_column(ForeignKey("produtos.id"), primary_key=True)

    # Relações com as classes principais
    # Adicionando 'overlaps' para resolver os SAWarnings
    favoritos_owner: Mapped["Favoritos"] = relationship(
        back_populates="produtos_associados",
        overlaps="produtos" # A relação 'produtos' em Favoritos também usa esta associação
    )
    produto_obj: Mapped["Produto"] = relationship(
        back_populates="favoritos_associados",
        overlaps="favorito_para" # A relação 'favorito_para' em Produto também usa esta associação
    )


# =============================== MODELOS PRINCIPAIS ===============================

class User(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    tipo_usuario = Column(Enum(TipoUsuario), nullable=False)

    # Campos de perfil que podem ser nulos dependendo do tipo de usuário
    nome_completo = Column(String(150), nullable=True)
    nome_empresa = Column(String(100), nullable=True)
    nome_condominio = Column(String(150), nullable=True)
    rua = Column(String(255), nullable=True)
    numero = Column(String(20), nullable=True)
    cidade = Column(String(100), nullable=True)
    estado = Column(String(50), nullable=True)
    cep = Column(String(9), nullable=True)

    # Relações bidirecionais
    # Endereços do usuário
    enderecos = relationship("Endereco", back_populates="user", cascade="all, delete-orphan")

    # Pedidos feitos pelo síndico (User.sindico)
    pedidos_feitos = relationship(
        "Pedido", 
        foreign_keys="[Pedido.sindico_id]", 
        back_populates="sindico",
        overlaps="sindico" # Adicionado overlaps
    )
    
    # Pedidos entregues pelo entregador (User.entregador)
    pedidos_entregues = relationship(
        "Pedido", 
        foreign_keys="[Pedido.entregador_id]", 
        back_populates="entregador",
        overlaps="entregador" # Adicionado overlaps
    )
    
    # Produtos fornecidos por este usuário (User.fornecedor)
    produtos = relationship("Produto", back_populates="fornecedor", cascade="all, delete-orphan")
    
    # Carrinho de compras do síndico
    carrinho = relationship("Carrinho", uselist=False, back_populates="sindico", cascade="all, delete-orphan")
    
    # Lista de favoritos do síndico
    favoritos = relationship("Favoritos", uselist=False, back_populates="sindico", cascade="all, delete-orphan")


class Endereco(Base):
    __tablename__ = "enderecos"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    apelido = Column(String(50))
    rua = Column(String(255))
    numero = Column(String(20))
    
    # --- GARANTA QUE ESTA LINHA ESTÁ AQUI ---
    bairro = Column(String(100), nullable=False)
    
    cidade = Column(String(100))
    estado = Column(String(50))
    cep = Column(String(9))
    complemento = Column(String(255), nullable=True)
    
    user = relationship("User", back_populates="enderecos")
    

class Produto(Base):
    __tablename__ = "produtos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    descricao = Column(String, nullable=True)
    preco = Column(Float, nullable=False)
    unidade_medida = Column(String(20))
    disponivel = Column(Boolean, default=True)
    fornecedor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    em_oferta = Column(Boolean, default=True) # Alterei para True como default para ter produtos em oferta
    preco_oferta = Column(Float, nullable=True)
    imagem_url = Column(String, nullable=True)
    
    # Relação com User (Fornecedor)
    fornecedor = relationship("User", back_populates="produtos")
    
    # Relação muitos-para-muitos com Favoritos usando a classe de associação ProdutoFavorito
    # 'secondary' aponta para o nome da tabela da classe de associação
    favorito_para = relationship(
        "Favoritos", 
        secondary="favoritos_produtos", 
        back_populates="produtos",
        overlaps="favoritos_associados" # Adicionado para resolver SAWarning
    )
    
    # Relação com a classe de associação ProdutoFavorito
    favoritos_associados = relationship(
        "ProdutoFavorito", 
        back_populates="produto_obj", 
        cascade="all, delete-orphan",
        overlaps="favorito_para" # Adicionado para resolver SAWarning
    )

class Pedido(Base):
    __tablename__ = "pedidos"
    id = Column(Integer, primary_key=True, index=True)
    sindico_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    entregador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    data_pedido = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50), default="PENDENTE")
    valor_total = Column(Float, nullable=False)
    
    # --- COLUNAS DE ENDEREÇO CORRIGIDAS E COMPLETAS ---
    rua = Column(String(255), nullable=False)
    numero = Column(String(20), nullable=False)
    bairro = Column(String(100), nullable=False) # <-- ADICIONADA
    cidade = Column(String(100), nullable=False) # <-- ADICIONADA
    estado = Column(String(50), nullable=False)  # <-- ADICIONADA
    cep = Column(String(9), nullable=False)
    complemento = Column(String(255), nullable=True)
    # --- FIM DA CORREÇÃO ---

    codigo_confirmacao = Column(String(4), nullable=True)

    # Relações com User (já estavam corretas)
    sindico = relationship(
        "User", 
        foreign_keys=[sindico_id], 
        back_populates="pedidos_feitos"
    )
    entregador = relationship(
        "User", 
        foreign_keys=[entregador_id], 
        back_populates="pedidos_entregues"
    )
    
    # Itens do pedido (já estava correto)
    itens_pedido = relationship("ItemPedido", back_populates="pedido", cascade="all, delete-orphan")
    
class Carrinho(Base):
    __tablename__ = "carrinhos"
    id = Column(Integer, primary_key=True, index=True)
    sindico_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)
    
    # Relação com User (síndico)
    sindico = relationship("User", back_populates="carrinho")
    
    # Itens no carrinho
    itens = relationship("CarrinhoItem", back_populates="carrinho", cascade="all, delete-orphan")


class CarrinhoItem(Base):
    __tablename__ = "carrinho_itens"
    id = Column(Integer, primary_key=True, index=True)
    carrinho_id = Column(Integer, ForeignKey("carrinhos.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    quantidade = Column(Integer, default=1)
    preco_congelado = Column(Float) # Preço do produto no momento que foi adicionado ao carrinho
    
    # Relações
    carrinho = relationship("Carrinho", back_populates="itens")
    produto = relationship("Produto") # Um item de carrinho tem um produto associado


class Favoritos(Base):
    __tablename__ = "favoritos"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False) 
    
    # Relação com User (síndico)
    sindico = relationship("User", back_populates="favoritos") 
    
    # Relação muitos-para-muitos com Produto usando a classe de associação ProdutoFavorito
    # 'secondary' aponta para o nome da tabela da classe de associação
    produtos = relationship(
        "Produto", 
        secondary="favoritos_produtos", # Use o nome da tabela aqui
        back_populates="favorito_para",
        overlaps="produtos_associados" # Adicionado para resolver SAWarning
    )

    # Relação com a classe de associação ProdutoFavorito
    produtos_associados = relationship(
        "ProdutoFavorito", 
        back_populates="favoritos_owner", 
        cascade="all, delete-orphan",
        overlaps="produtos" # Adicionado para resolver SAWarning
    )


class ItemPedido(Base):
    __tablename__ = "itens_pedido"
    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    quantidade = Column(Integer)
    preco_congelado = Column(Float)
    nome_produto = Column(String(100))
    nome_fornecedor = Column(String(150)) # Poderia ser derivado da relação, mas para logs pode ser útil
    
    # Relações
    pedido = relationship("Pedido", back_populates="itens_pedido")
    produto = relationship("Produto") # Um item de pedido tem um produto associado