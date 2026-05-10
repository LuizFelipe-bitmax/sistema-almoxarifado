/* ═══════════════════════════════════════════════════════
   ALMOXARIFADO — app.js
   Comunicação com a API FastAPI via fetch()
═══════════════════════════════════════════════════════ */

const API = "";   // deixe vazio — mesmo servidor
// const API = "http://localhost:8000";  // use em dev separado

const App = (() => {

  /* ── Estado ───────────────────────────────────────── */
  let currentUser  = null;
  let materiais    = [];
  let historico    = [];
  let ajusteIdx    = null;
  let histFiltro   = "todos";

  /* ── Helpers HTTP ─────────────────────────────────── */
  async function get(path) {
    const r = await fetch(API + path);
    if (!r.ok) throw await r.json();
    return r.json();
  }

  async function post(path, body) {
    const r = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw await r.json();
    return r.json();
  }

  async function put(path, body) {
    const r = await fetch(API + path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw await r.json();
    return r.json();
  }

  /* ── Toast ────────────────────────────────────────── */
  function toast(msg, isErro = false) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.style.background   = isErro ? "rgba(239,68,68,.15)" : "#1e3a2e";
    t.style.borderColor  = isErro ? "#ef4444" : "#10b981";
    t.style.color        = isErro ? "#ef4444" : "#10b981";
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2800);
  }

  /* ── Login ────────────────────────────────────────── */
  async function carregarUsuarios() {
    try {
      const usuarios = await get("/usuarios");
      const sel = document.getElementById("login-user");
      sel.innerHTML = '<option value="">Selecione...</option>';
      usuarios.forEach(u => {
        sel.innerHTML += `<option value="${u.id}">${u.nome} — ${u.cargo}</option>`;
      });
    } catch {
      toast("Erro ao carregar usuários", true);
    }
  }

  async function login() {
    const userId = document.getElementById("login-user").value;
    const senha  = document.getElementById("login-pass").value;
    const erro   = document.getElementById("login-erro");

    if (!userId) { erro.textContent = "Selecione um usuário"; erro.style.display = "block"; return; }
    if (!senha)  { erro.textContent = "Informe a senha";      erro.style.display = "block"; return; }

    // pega nome do select
    const opt  = document.querySelector(`#login-user option[value="${userId}"]`);
    const nome = opt.textContent.split(" —")[0];

    try {
      const user = await post("/login", { nome, senha });
      currentUser = user;
      erro.style.display = "none";
      document.getElementById("login-wrap").style.display = "none";
      document.getElementById("main-wrap").style.display  = "block";
      document.getElementById("user-cargo").textContent   = user.cargo;
      document.getElementById("user-avatar").textContent  =
        user.nome.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase();
      await carregarTudo();
      goTo("s-home");
    } catch (e) {
      erro.textContent  = e.detail || "Usuário ou senha inválidos";
      erro.style.display = "block";
    }
  }

  /* ── Carga de dados ───────────────────────────────── */
  async function carregarTudo() {
    [materiais, historico] = await Promise.all([
      get("/materiais"),
      get("/movimentacoes"),
    ]);
  }

  /* ── Navegação ────────────────────────────────────── */
  const titulos = {
    "s-home":      "📦 Início",
    "s-entrada":   "➕ Registrar Entrada",
    "s-saida":     "➖ Registrar Saída",
    "s-hist":      "📜 Histórico",
    "s-materiais": "⚙️ Materiais",
  };

  function goTo(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    document.getElementById("screen-title").textContent = titulos[id] || "Almoxarifado";
    const navBtn = document.getElementById("nav-" + id);
    if (navBtn) navBtn.classList.add("active");
    renderScreen(id);
  }

  async function renderScreen(id) {
    await carregarTudo();
    if (id === "s-home")      renderHome();
    if (id === "s-entrada")   renderForms();
    if (id === "s-saida")     renderForms();
    if (id === "s-hist")      renderHist(histFiltro);
    if (id === "s-materiais") renderMateriais();
  }

  /* ── Render: Home ─────────────────────────────────── */
  async function renderHome() {
    // alertas
    try {
      const alertas = await get("/alertas");
      const ac = document.getElementById("alerts-container");
      ac.innerHTML = alertas.map(m =>
        `<div class="alert-bar">
          <i class="ti ti-alert-triangle"></i>
          <span><b>${m.nome}</b> abaixo do estoque mínimo (${m.estoque} / mín. ${m.estoque_minimo})</span>
        </div>`
      ).join("");
      document.getElementById("stat-alerts").textContent = alertas.length;
    } catch {}

    document.getElementById("stat-total").textContent = materiais.length;

    const hoje  = new Date().toDateString();
    const ent   = historico.filter(h => h.tipo === "entrada" && new Date(h.data_hora).toDateString() === hoje);
    const sai   = historico.filter(h => h.tipo === "saida"   && new Date(h.data_hora).toDateString() === hoje);
    document.getElementById("stat-ent").textContent = ent.length;
    document.getElementById("stat-sai").textContent = sai.length;

    const list = document.getElementById("home-stock-list");
    if (!materiais.length) { list.innerHTML = '<div class="empty">Nenhum material cadastrado</div>'; return; }
    list.innerHTML = materiais.map(m => {
      const low   = m.estoque < m.estoque_minimo;
      const badge = low ? '<span class="badge badge-low">Baixo</span>' : '<span class="badge badge-ok">OK</span>';
      return `<div class="material-row">
        <div><div class="mat-name">${m.nome}</div>${badge}</div>
        <div class="mat-qty ${low ? "low" : "ok"}">${m.estoque}</div>
      </div>`;
    }).join("");
  }

  /* ── Render: Forms ────────────────────────────────── */
  function renderForms() {
    const opts = materiais.map(m =>
      `<option value="${m.id}">${m.nome} (${m.estoque})</option>`
    ).join("");
    document.getElementById("ent-mat").innerHTML = opts;
    document.getElementById("sai-mat").innerHTML = opts;
    updateSaiInfo();
  }

  function updateSaiInfo() {
    const sel  = document.getElementById("sai-mat");
    const idx  = parseInt(sel.value);
    const mat  = materiais.find(m => m.id === idx);
    const info = document.getElementById("sai-estoque-info");
    const span = document.getElementById("sai-estoque-atual");
    if (mat) {
      info.style.display  = "block";
      span.textContent    = mat.estoque + " unidades";
      span.style.color    = mat.estoque < mat.estoque_minimo ? "var(--danger)" : "var(--green)";
    }
  }

  /* ── Render: Histórico ────────────────────────────── */
  function renderHist(filtro) {
    histFiltro = filtro;
    const itens = filtro === "todos"
      ? historico
      : historico.filter(h => h.tipo === filtro);

    const el = document.getElementById("hist-list");
    if (!itens.length) { el.innerHTML = '<div class="empty">Nenhum registro encontrado</div>'; return; }

    el.innerHTML = [...itens].reverse().map(h => {
      const icone = h.tipo === "entrada" ? "ti-arrow-down-circle"
                  : h.tipo === "saida"   ? "ti-arrow-up-circle"
                  :                        "ti-adjustments";
      const sign  = h.tipo === "entrada" ? "+" : h.tipo === "saida" ? "−" : "~";
      const qcls  = h.tipo === "entrada" ? "pos" : h.tipo === "saida" ? "neg" : "";
      const d     = new Date(h.data_hora);
      const ds    = d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const mat   = materiais.find(m => m.id === h.material_id);
      const obs   = h.observacao ? ` · ${h.observacao}` : "";

      return `<div class="hist-item">
        <div class="hist-icon ${h.tipo}"><i class="ti ${icone}"></i></div>
        <div style="flex:1;min-width:0">
          <div class="hist-mat">${mat ? mat.nome : "—"}</div>
          <div class="hist-meta">${h.turno || ""}${obs}</div>
          <div class="hist-ts">${ds}</div>
        </div>
        <div class="hist-qty ${qcls}">${sign}${h.quantidade}</div>
      </div>`;
    }).join("");
  }

  function filterHist(filtro, btn) {
    document.querySelectorAll("#hist-filters .filter-chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    renderHist(filtro);
  }

  /* ── Render: Materiais ────────────────────────────── */
  function renderMateriais() {
    const card = document.getElementById("mat-list-card");
    if (!materiais.length) { card.innerHTML = '<div class="empty">Nenhum material cadastrado</div>'; return; }
    card.innerHTML = materiais.map(m => {
      const low   = m.estoque < m.estoque_minimo;
      const badge = low ? '<span class="badge badge-low">Baixo</span>' : '<span class="badge badge-ok">OK</span>';
      return `<div class="material-row">
        <div style="flex:1">
          <div class="mat-name">${m.nome}</div>
          <div style="font-size:12px;color:var(--muted);margin-top:2px">Estoque: ${m.estoque} | Mín: ${m.estoque_minimo}</div>
          ${badge}
        </div>
        <button class="btn btn-outline btn-sm" onclick="App.openAjuste(${m.id})">
          <i class="ti ti-adjustments-horizontal" style="font-size:14px"></i> Ajustar
        </button>
      </div>`;
    }).join("");
  }

  /* ── Ações ────────────────────────────────────────── */
  async function registrarEntrada() {
    const mat_id = parseInt(document.getElementById("ent-mat").value);
    const qty    = parseInt(document.getElementById("ent-qty").value) || 0;
    const turno  = document.getElementById("ent-turno").value;
    const obs    = document.getElementById("ent-obs").value;
    if (qty <= 0) { toast("Informe uma quantidade válida", true); return; }
    try {
      await post("/movimentacoes/entrada", {
        material_id: mat_id, quantidade: qty,
        usuario_id: currentUser.id, turno, observacao: obs
      });
      document.getElementById("ent-qty").value = 1;
      document.getElementById("ent-obs").value = "";
      await carregarTudo();
      renderForms();
      toast("✅ Entrada registrada!");
    } catch (e) { toast(e.detail || "Erro ao registrar entrada", true); }
  }

  async function registrarSaida() {
    const mat_id = parseInt(document.getElementById("sai-mat").value);
    const qty    = parseInt(document.getElementById("sai-qty").value) || 0;
    const turno  = document.getElementById("sai-turno").value;
    const obs    = document.getElementById("sai-obs").value;
    if (qty <= 0) { toast("Informe uma quantidade válida", true); return; }
    try {
      await post("/movimentacoes/saida", {
        material_id: mat_id, quantidade: qty,
        usuario_id: currentUser.id, turno, observacao: obs
      });
      document.getElementById("sai-qty").value = 1;
      document.getElementById("sai-obs").value = "";
      await carregarTudo();
      renderForms();
      toast("✅ Saída registrada!");
    } catch (e) { toast(e.detail || "Erro: " + (e.detail || "estoque insuficiente"), true); }
  }

  async function cadastrarMaterial() {
    const nome = document.getElementById("new-mat-nome").value.trim();
    const qty  = parseInt(document.getElementById("new-mat-qty").value) || 0;
    const min  = parseInt(document.getElementById("new-mat-min").value) || 0;
    if (!nome) { toast("Informe o nome do material", true); return; }
    try {
      await post("/materiais", { nome, estoque: qty, estoque_minimo: min });
      document.getElementById("new-mat-nome").value = "";
      document.getElementById("new-mat-qty").value  = 0;
      document.getElementById("new-mat-min").value  = 5;
      await carregarTudo();
      renderMateriais();
      toast("✅ Material cadastrado!");
    } catch (e) { toast(e.detail || "Erro ao cadastrar", true); }
  }

  /* ── Ajuste ───────────────────────────────────────── */
  function openAjuste(id) {
    ajusteIdx = id;
    const m = materiais.find(m => m.id === id);
    document.getElementById("ajuste-mat-nome").value = m.nome;
    document.getElementById("ajuste-atual").value    = m.estoque;
    document.getElementById("ajuste-nova").value     = m.estoque;
    document.getElementById("ajuste-motivo").value   = "";
    document.getElementById("ajuste-modal").classList.add("open");
  }

  function closeModal() {
    document.getElementById("ajuste-modal").classList.remove("open");
  }

  async function confirmarAjuste() {
    const nova   = parseInt(document.getElementById("ajuste-nova").value) || 0;
    const motivo = document.getElementById("ajuste-motivo").value.trim();
    if (!motivo) { toast("Informe o motivo do ajuste", true); return; }
    try {
      await post("/movimentacoes/ajuste", {
        material_id: ajusteIdx, nova_quantidade: nova,
        usuario_id: currentUser.id, motivo
      });
      closeModal();
      await carregarTudo();
      renderMateriais();
      renderHome();
      toast("✅ Ajuste registrado!");
    } catch (e) { toast(e.detail || "Erro no ajuste", true); }
  }

  /* ── Init ─────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    carregarUsuarios();
  });

  /* ── API pública ──────────────────────────────────── */
  return {
    login, goTo, updateSaiInfo,
    registrarEntrada, registrarSaida,
    cadastrarMaterial, filterHist,
    openAjuste, closeModal, confirmarAjuste,
  };

})();
