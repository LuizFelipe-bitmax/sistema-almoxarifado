from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import models, schemas, database

app = FastAPI(title="Sistema de Almoxarifado")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

app.mount("/static", StaticFiles(directory="../frontend/static"), name="static")


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return FileResponse("../frontend/index.html")


# ── USUÁRIOS ──────────────────────────────────────────────

@app.get("/usuarios", response_model=list[schemas.UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(models.Usuario).all()


@app.post("/usuarios", response_model=schemas.UsuarioOut)
def criar_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    existe = db.query(models.Usuario).filter(models.Usuario.nome == usuario.nome).first()
    if existe:
        raise HTTPException(status_code=400, detail="Usuário já existe")
    db_user = models.Usuario(**usuario.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.post("/login", response_model=schemas.UsuarioOut)
def login(dados: schemas.LoginInput, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(
        models.Usuario.nome == dados.nome,
        models.Usuario.senha == dados.senha
    ).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário ou senha inválidos")
    return user


# ── MATERIAIS ─────────────────────────────────────────────

@app.get("/materiais", response_model=list[schemas.MaterialOut])
def listar_materiais(db: Session = Depends(get_db)):
    return db.query(models.Material).all()


@app.post("/materiais", response_model=schemas.MaterialOut)
def criar_material(material: schemas.MaterialCreate, db: Session = Depends(get_db)):
    existe = db.query(models.Material).filter(models.Material.nome == material.nome).first()
    if existe:
        raise HTTPException(status_code=400, detail="Material já cadastrado")
    db_mat = models.Material(**material.dict())
    db.add(db_mat)
    db.commit()
    db.refresh(db_mat)
    return db_mat


@app.put("/materiais/{material_id}", response_model=schemas.MaterialOut)
def atualizar_material(material_id: int, dados: schemas.MaterialCreate, db: Session = Depends(get_db)):
    mat = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    mat.nome = dados.nome
    mat.estoque_minimo = dados.estoque_minimo
    db.commit()
    db.refresh(mat)
    return mat


# ── MOVIMENTAÇÕES ─────────────────────────────────────────

@app.get("/movimentacoes", response_model=list[schemas.MovimentacaoOut])
def listar_movimentacoes(
    tipo: Optional[str] = None,
    material_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    q = db.query(models.Movimentacao)
    if tipo:
        q = q.filter(models.Movimentacao.tipo == tipo)
    if material_id:
        q = q.filter(models.Movimentacao.material_id == material_id)
    return q.order_by(models.Movimentacao.data_hora.desc()).all()


@app.post("/movimentacoes/entrada", response_model=schemas.MovimentacaoOut)
def registrar_entrada(dados: schemas.MovimentacaoInput, db: Session = Depends(get_db)):
    mat = db.query(models.Material).filter(models.Material.id == dados.material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    mat.estoque += dados.quantidade
    mov = models.Movimentacao(
        material_id=dados.material_id,
        tipo="entrada",
        quantidade=dados.quantidade,
        usuario_id=dados.usuario_id,
        turno=dados.turno,
        observacao=dados.observacao,
        data_hora=datetime.now()
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov


@app.post("/movimentacoes/saida", response_model=schemas.MovimentacaoOut)
def registrar_saida(dados: schemas.MovimentacaoInput, db: Session = Depends(get_db)):
    mat = db.query(models.Material).filter(models.Material.id == dados.material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    if dados.quantidade > mat.estoque:
        raise HTTPException(status_code=400, detail="Estoque insuficiente")
    mat.estoque -= dados.quantidade
    mov = models.Movimentacao(
        material_id=dados.material_id,
        tipo="saida",
        quantidade=dados.quantidade,
        usuario_id=dados.usuario_id,
        turno=dados.turno,
        observacao=dados.observacao,
        data_hora=datetime.now()
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov


@app.post("/movimentacoes/ajuste", response_model=schemas.MovimentacaoOut)
def ajustar_estoque(dados: schemas.AjusteInput, db: Session = Depends(get_db)):
    mat = db.query(models.Material).filter(models.Material.id == dados.material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material não encontrado")
    qtd_anterior = mat.estoque
    diferenca = abs(dados.nova_quantidade - qtd_anterior)
    mat.estoque = dados.nova_quantidade
    mov = models.Movimentacao(
        material_id=dados.material_id,
        tipo="ajuste",
        quantidade=diferenca,
        usuario_id=dados.usuario_id,
        turno="—",
        observacao=f"Ajuste: {qtd_anterior} → {dados.nova_quantidade} | Motivo: {dados.motivo}",
        data_hora=datetime.now()
    )
    db.add(mov)
    db.commit()
    db.refresh(mov)
    return mov


# ── ALERTAS ───────────────────────────────────────────────

@app.get("/alertas")
def alertas(db: Session = Depends(get_db)):
    baixos = db.query(models.Material).filter(
        models.Material.estoque < models.Material.estoque_minimo
    ).all()
    return [
        {"id": m.id, "nome": m.nome, "estoque": m.estoque, "estoque_minimo": m.estoque_minimo}
        for m in baixos
    ]
