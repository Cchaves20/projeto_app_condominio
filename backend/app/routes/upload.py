# backend/app/routes/upload.py

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from typing import Optional
import os
import uuid # Para gerar nomes de arquivo únicos

router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)

# DIRETÓRIO ONDE AS IMAGENS SERÃO SALVAS
# Em um ambiente real, você usaria um serviço de armazenamento de nuvem (AWS S3, Cloudinary, etc.)
UPLOAD_DIRECTORY = "./static/uploads"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True) # Cria o diretório se não existir

@router.post("/image/")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Apenas arquivos de imagem são permitidos.")

    # Gera um nome de arquivo único
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)

    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        # Retorna a URL que o frontend usará para exibir a imagem
        # No desenvolvimento, usaremos o endpoint do FastAPI para servir arquivos estáticos
        return {"url": f"/static/uploads/{unique_filename}"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao carregar imagem: {e}")