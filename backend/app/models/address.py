# backend/app/models/address.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base 

class Address(Base): # <--- Esta é a classe que o User está tentando encontrar
    __tablename__ = "addresses" 

    id = Column(Integer, primary_key=True, index=True)
    apelido = Column(String, index=True, nullable=False)
    rua = Column(String, index=True, nullable=False)
    numero = Column(String, nullable=False)
    complemento = Column(String, nullable=True)
    bairro = Column(String, nullable=False)
    cidade = Column(String, nullable=False)
    estado = Column(String, nullable=False)
    cep = Column(String, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id")) 

    owner = relationship("User", back_populates="user_addresses")