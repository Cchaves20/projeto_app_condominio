import os
import sys
from sqlalchemy import create_engine
from sqlalchemy_utils import database_exists, create_database, drop_database

# Adiciona o diretório 'app' ao PATH para que possamos importar os módulos de lá
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

from app.database.base import Base
from app.models.user import (
    User, Endereco, Produto, Pedido, Carrinho, CarrinhoItem,
    Favoritos, ItemPedido, ProdutoFavorito
)
from app.config import settings

DATABASE_URL = settings.database_url

if __name__ == "__main__":
    # --- CORREÇÃO AQUI ---
    # DATABASE_URL já é uma string, imprima diretamente.
    # Para esconder a senha, podemos fazer uma pequena manipulação se necessário.
    print(f"Tentando conectar ao banco de dados em: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else DATABASE_URL}")
    # Ou, se quiser mais simples e não se importa em mostrar a senha no console local:
    # print(f"Tentando conectar ao banco de dados em: {DATABASE_URL}")

    engine = create_engine(DATABASE_URL) # create_engine sabe lidar com a string da URL

    if database_exists(engine.url):
        print("Banco de dados existente. Dropando todas as tabelas...")
        Base.metadata.drop_all(bind=engine)
        print("Tabelas dropadas.")
    else:
        print("Banco de dados não existente. Criando banco de dados...")
        create_database(engine.url)
        print("Banco de dados criado.")

    print("Criando todas as tabelas a partir dos modelos...")
    Base.metadata.create_all(bind=engine)
    print("Todas as tabelas foram criadas com sucesso de acordo com os modelos.")