# 📦 Sistema de Controle de Almoxarifado

Sistema web simples, responsivo e focado em mobile para controle de
entradas, saídas e estoque de materiais.

# 📦 Ferramentas usadas

Backend
Python
FastAPI
SQLAlchemy
SQLite
Pydantic
Uvicorn
Frontend
HTML5
CSS3
JavaScript (Vanilla JS)
Ferramentas
Visual Studio Code
Git
GitHub

---

## 🗂 Estrutura de arquivos

```
almoxarifado/
├── backend/
│   ├── main.py          ← API FastAPI (rotas)
│   ├── models.py        ← Tabelas do banco (SQLAlchemy)
│   ├── schemas.py       ← Validação de dados (Pydantic)
│   ├── database.py      ← Conexão com SQLite
│   ├── seed.py          ← Popula o banco com dados iniciais
│   └── requirements.txt ← Dependências Python
└── frontend/
    ├── index.html       ← Tela principal
    └── static/
        ├── css/style.css  ← Estilo visual
        └── js/app.js      ← Lógica e comunicação com a API
```

---

## 🚀 Como rodar

### 1. Instalar Python
Certifique-se de ter Python 3.10 ou superior instalado.

### 2. Instalar dependências
```bash
cd backend
pip install -r requirements.txt
```

### 3. Popular o banco de dados (primeira vez)
```bash
python seed.py
```
Isso cria o arquivo `almoxarifado.db` com os usuários e materiais iniciais.

### 4. Iniciar o servidor
```bash
uvicorn main:app --reload
```
O sistema estará disponível em: **http://localhost:8000**

---

## 👥 Usuários iniciais

| Nome           | Cargo                    | Senha  |
|----------------|--------------------------|--------|
| Carlos Silva   | Auxiliar de Almoxarifado | 1234   |
| Ana Souza      | Encarregada Turno 1      | 1234   |
| Roberto Lima   | Encarregado Turno 2      | 1234   |
| Marta Costa    | Encarregada Turno 3      | 1234   |
| João Pedro     | Gerente                  | admin  |

---

## 📦 Materiais iniciais

| Material          | Estoque | Mínimo |
|-------------------|---------|--------|
| LDT               | 12      | 5      |
| Cloro             | 3       | 10 ⚠️  |
| Papel Higiênico   | 48      | 20     |
| Papel Interfolhado| 8       | 15 ⚠️  |
| Papel Toalha      | 22      | 10     |
| Aromatizante      | 4       | 8 ⚠️   |

---

## 🔌 Endpoints da API

| Método | Rota                         | Descrição                  |
|--------|------------------------------|----------------------------|
| GET    | /usuarios                    | Lista usuários             |
| POST   | /usuarios                    | Cria usuário               |
| POST   | /login                       | Autenticação               |
| GET    | /materiais                   | Lista materiais            |
| POST   | /materiais                   | Cadastra material          |
| PUT    | /materiais/{id}              | Atualiza material          |
| GET    | /movimentacoes               | Lista movimentações        |
| POST   | /movimentacoes/entrada       | Registra entrada           |
| POST   | /movimentacoes/saida         | Registra saída             |
| POST   | /movimentacoes/ajuste        | Ajusta estoque (fechamento)|
| GET    | /alertas                     | Materiais abaixo do mínimo |
| GET    | /docs                        | Documentação automática    |

---

## 📱 Funcionalidades

- **Login** por usuário com cargo identificado
- **Dashboard** com estatísticas do dia e alertas de estoque baixo
- **Registrar Entrada** — aumenta estoque automaticamente
- **Registrar Saída** — reduz estoque com validação
- **Histórico** — filtrado por tipo (entrada / saída / ajuste)
- **Materiais** — cadastro e ajuste com registro de motivo
- **Alertas automáticos** quando estoque cai abaixo do mínimo

---

