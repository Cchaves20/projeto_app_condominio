# backend/app/schemas/token.py
from pydantic import BaseModel

class TokenData(BaseModel):
    username: str