import sys
import os
import argparse  # Importa a biblioteca para lidar com argumentos de linha de comando

# Garante que o diretório raiz do backend esteja no sys.path
# Adiciona o diretório 'app' ao sys.path para que os módulos possam ser encontrados
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


from app.database.base import Base
from app.database.connection import engine
    
# Importa todos os seus modelos para que o SQLAlchemy os conheça
from app.models import user 

def drop_tables():
    try:
        print("🔥 Apagando todas as tabelas...")
        # Apaga todas as tabelas conhecidas pelo Base.metadata
        Base.metadata.drop_all(bind=engine)
        print("✅ Tabelas apagadas com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao apagar tabelas: {e}")
        raise

def create_tables():
    try:
        print("🔄 Criando tabelas no banco de dados...")
        # Cria todas as tabelas conhecidas pelo Base.metadata
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas criadas com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao criar tabelas: {e}")
        raise

if __name__ == "__main__":
    # Cria um parser para argumentos da linha de comando
    parser = argparse.ArgumentParser(description="Gerencia o banco de dados.")
    parser.add_argument(
        '--recreate', 
        action='store_true', 
        help='Apaga todas as tabelas antes de criá-las novamente.'
    )
    args = parser.parse_args()

    # Se o argumento --recreate for passado, apaga as tabelas primeiro
    if args.recreate:
        drop_tables()
    
    # Cria as tabelas
    create_tables()