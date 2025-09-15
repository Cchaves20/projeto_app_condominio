# backend/app/routes/products.py

from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.connection import get_db
from app.models.user import User, Produto, TipoUsuario
from app.dependencies import get_current_user, get_current_fornecedor
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter(
    prefix="/produtos",
    tags=["Produtos"]
)

@router.get("/", response_model=List[ProductResponse])
def listar_produtos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    # --- NOVOS PARÂMETROS DE QUERY ---
    search: Optional[str] = Query(None, description="Termo de busca para nome ou descrição do produto"),
    availability: Optional[bool] = Query(None, description="Filtrar por disponibilidade (True para disponível, False para indisponível)")
):
    """
    Lista produtos com filtragem inteligente:
    - Fornecedores veem apenas seus produtos, com opção de filtrar por disponibilidade.
    - Outros usuários (Síndicos, Entregadores) veem produtos de todos os fornecedores, 
      MAS APENAS OS DISPONÍVEIS, com opção de busca.
    """
    
    query = db.query(Produto)

    if current_user.tipo_usuario == TipoUsuario.FORNECEDOR:
        # Fornecedor só vê seus próprios produtos
        query = query.filter(Produto.fornecedor_id == current_user.id)
        
        # Fornecedor pode filtrar por disponibilidade (True/False)
        if availability is not None:
            query = query.filter(Produto.disponivel == availability)
            
    else: # Sindico, Entregador ou outros
        # Outros usuários só veem produtos DISPONÍVEIS
        query = query.filter(Produto.disponivel == True)
        
        # Para esses usuários, o filtro de 'availability' é sempre True por padrão,
        # então não precisamos aplicar um filtro adicional se 'availability' for explicitamente False.
        # No entanto, se quiserem ver apenas os 'True', o filtro acima já resolve.
        # Se 'availability' for passado como False por um cliente não-fornecedor, ele será ignorado aqui
        # pois o filtro `Produto.disponivel == True` já foi aplicado.


    # Aplica o termo de busca se houver
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Produto.nome.ilike(search_pattern)) | 
            (Produto.descricao.ilike(search_pattern))
        )

    produtos = query.all()

    # Adiciona o nome do fornecedor aos produtos
    for produto in produtos:
        if produto.fornecedor:
            produto.nome_fornecedor = produto.fornecedor.nome_empresa or produto.fornecedor.nome_completo
        else:
            produto.nome_fornecedor = "Não informado"
            
    return produtos


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def criar_produto(product_data: ProductCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.tipo_usuario != TipoUsuario.FORNECEDOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas fornecedores podem criar produtos.")
        
    new_product = Produto(**product_data.model_dump(), fornecedor_id=current_user.id)
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.patch("/{product_id}", response_model=ProductResponse)
def atualizar_produto(product_id: int, product_data: ProductUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    produto_query = db.query(Produto).filter(Produto.id == product_id)
    produto = produto_query.first()

    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    
    if produto.fornecedor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Não autorizado a editar este produto")

    update_data = product_data.model_dump(exclude_unset=True)
    produto_query.update(update_data, synchronize_session=False)
    db.commit()
    db.refresh(produto)
    return produto


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_produto(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    produto = db.query(Produto).filter(Produto.id == product_id).first()

    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    
    if produto.fornecedor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Não autorizado a deletar este produto")

    db.delete(produto)
    db.commit()
    return