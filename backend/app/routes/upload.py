import shutil
import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status

router = APIRouter(
    prefix="/upload",
    tags=["Uploads"]
)

# Define o diretório onde as imagens serão salvas
UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True) # Cria o diretório se não existir

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """
    Recebe um arquivo de imagem, salva com um nome único no servidor
    e retorna o caminho para acessá-lo.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo enviado não é uma imagem válida."
        )

    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    save_path = UPLOAD_DIR / unique_filename

    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    return {"file_path": f"/static/uploads/{unique_filename}"}