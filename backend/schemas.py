from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ── USUÁRIOS ──────────────────────────────────────────────

class UsuarioCreate(BaseModel):
    nome: str
    senha: str
    cargo: str


class UsuarioOut(BaseModel):
    id: int
    nome: str
    cargo: str

    class Config:
        from_attributes = True


class LoginInput(BaseModel):
    nome: str
    senha: str


# ── MATERIAIS ─────────────────────────────────────────────

class MaterialCreate(BaseModel):
    nome: str
    estoque: int = 0
    estoque_minimo: int = 0


class MaterialOut(BaseModel):
    id: int
    nome: str
    estoque: int
    estoque_minimo: int

    class Config:
        from_attributes = True


# ── MOVIMENTAÇÕES ─────────────────────────────────────────

class MovimentacaoInput(BaseModel):
    material_id: int
    quantidade: int
    usuario_id: int
    turno: Optional[str] = "Comercial"
    observacao: Optional[str] = ""


class AjusteInput(BaseModel):
    material_id: int
    nova_quantidade: int
    usuario_id: int
    motivo: str


class MovimentacaoOut(BaseModel):
    id: int
    material_id: int
    tipo: str
    quantidade: int
    usuario_id: int
    turno: Optional[str]
    observacao: Optional[str]
    data_hora: datetime

    class Config:
        from_attributes = True
