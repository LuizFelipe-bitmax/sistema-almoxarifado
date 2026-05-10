from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    senha = Column(String, nullable=False)
    cargo = Column(String, nullable=False)

    movimentacoes = relationship("Movimentacao", back_populates="usuario")


class Material(Base):
    __tablename__ = "materiais"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    estoque = Column(Integer, default=0)
    estoque_minimo = Column(Integer, default=0)

    movimentacoes = relationship("Movimentacao", back_populates="material")


class Movimentacao(Base):
    __tablename__ = "movimentacoes"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materiais.id"), nullable=False)
    tipo = Column(String, nullable=False)          # entrada | saida | ajuste
    quantidade = Column(Integer, nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    turno = Column(String, nullable=True)
    observacao = Column(String, nullable=True)
    data_hora = Column(DateTime, default=datetime.now)

    material = relationship("Material", back_populates="movimentacoes")
    usuario = relationship("Usuario", back_populates="movimentacoes")
