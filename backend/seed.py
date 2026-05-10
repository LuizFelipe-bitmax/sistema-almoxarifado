"""
Execute uma vez para popular o banco com dados iniciais:
  python seed.py
"""
from database import SessionLocal, engine
import models

models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

usuarios = [
    models.Usuario(nome="Carlos Silva",  senha="1234", cargo="Auxiliar de Almoxarifado"),
    models.Usuario(nome="Ana Souza",     senha="1234", cargo="Encarregada Turno 1"),
    models.Usuario(nome="Roberto Lima",  senha="1234", cargo="Encarregado Turno 2"),
    models.Usuario(nome="Marta Costa",   senha="1234", cargo="Encarregada Turno 3"),
    models.Usuario(nome="João Pedro",    senha="admin", cargo="Gerente"),
]

materiais = [
    models.Material(nome="LDT",               estoque=12, estoque_minimo=5),
    models.Material(nome="Cloro",             estoque=3,  estoque_minimo=10),
    models.Material(nome="Papel Higiênico",   estoque=48, estoque_minimo=20),
    models.Material(nome="Papel Interfolhado",estoque=8,  estoque_minimo=15),
    models.Material(nome="Papel Toalha",      estoque=22, estoque_minimo=10),
    models.Material(nome="Aromatizante",      estoque=4,  estoque_minimo=8),
]

db.add_all(usuarios)
db.add_all(materiais)
db.commit()
db.close()

print("✅ Banco populado com sucesso!")
print("Usuários criados — senha padrão: 1234 (João Pedro: admin)")
