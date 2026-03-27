/* ═══════════════════════════════════════════════════════════
   GR7 — auth.js  v3.2  •  Autenticação Central
   Login: usuario (texto) + senha SHA-256
   Fallback: pin_hash legado (v2)
   Sessão: sessionStorage 8h
   ═══════════════════════════════════════════════════════════ */
(function () {

  const SURL = 'https://nhzjkahbkeusgntheyug.supabase.co';
  const SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oemprYWhia2V1c2dudGhleXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjYwMDQsImV4cCI6MjA4ODg0MjAwNH0.hB2bJBMoJoztuNrb4xCRIgWmwMlayBpVOMWq3mI4nH4';
  const SH   = {
    'Content-Type'  : 'application/json',
    'apikey'        : SKEY,
    'Authorization' : 'Bearer ' + SKEY,
  };

  const SESSION_KEY = 'gr7_session';
  const SESSION_TTL = 8 * 60 * 60 * 1000; // 8h

  /* ── SHA-256 ── */
  async function sha256(txt) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  /* ── Normaliza: remove acento, espaço, maiúscula ── */
  function norm(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '').trim();
  }

  /* ── Iniciais ── */
  function ini(n) {
    const p = (n || '').trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (n||'??').slice(0,2).toUpperCase();
  }

  /* ── Sessão ── */
  function getSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (!s) return null;
      if (Date.now() - s.ts > SESSION_TTL) { sessionStorage.removeItem(SESSION_KEY); return null; }
      return s;
    } catch { return null; }
  }
  function setSession(u) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...u, ts: Date.now() }));
  }
  function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

  /* ── Encontra colaborador (busca todos, filtra localmente) ── */
  async function encontrar(login) {
    const loginNorm = norm(login);
    const r = await fetch(
      `${SURL}/rest/v1/colaboradores?ativo=eq.true&select=id,nome,cargo,cor,perfil,usuario,senha_hash,pin_hash`,
      { headers: SH }
    );
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const lista = await r.json();
    if (!Array.isArray(lista)) return null;

    // 1º campo usuario
    let m = lista.find(c => c.usuario && norm(c.usuario) === loginNorm);
    if (m) return m;
    // 2º nome completo
    m = lista.find(c => norm(c.nome) === loginNorm);
    if (m) return m;
    // 3º primeiro nome
    m = lista.find(c => norm(c.nome).startsWith(loginNorm) && loginNorm.length >= 3);
    return m || null;
  }

  /* ── Verifica senha ── */
  async function verificar(colab, senha) {
    const h = await sha256(senha);
    if (colab.senha_hash && colab.senha_hash === h) return true;
    if (colab.pin_hash   && colab.pin_hash   === h) return true;
    // Tenta também sem espaços extras
    const h2 = await sha256(senha.trim());
    if (colab.senha_hash && colab.senha_hash === h2) return true;
    if (colab.pin_hash   && colab.pin_hash   === h2) return true;
    return false;
  }

  /* ════════════════════════════
     API PÚBLICA — window.GR7Auth
  ════════════════════════════ */
  window.GR7Auth = {
    SURL, SKEY, SH,
    getSession,
    sha256,
    isAdmin  : () => (getSession() || {}).perfil === 'admin',
    isLogged : () => !!getSession(),

    logout() { clearSession(); window.location.href = 'login.html'; },

    require(adminOnly) {
      const s = getSession();
      if (!s) {
        sessionStorage.setItem('gr7_redirect', window.location.href);
        window.location.href = 'login.html';
        return false;
      }
      if (adminOnly && s.perfil !== 'admin') {
        window.location.href = 'login.html?denied=1';
        return false;
      }
      return true;
    },

    applyPermissions() {
      const a = this.isAdmin();
      document.querySelectorAll('[data-admin-only]').forEach(el => el.style.display = a ? '' : 'none');
      document.querySelectorAll('[data-colab-only]').forEach(el  => el.style.display = a ? 'none' : '');
    },

    injectSessionBar() {
      const s = getSession();
      if (!s || document.getElementById('gr7-session-bar')) return;
      const bar = document.createElement('div');
      bar.id = 'gr7-session-bar';
      bar.innerHTML = `<div class="gsb-inner">
        <div class="gsb-av" style="background:${s.cor}22;color:${s.cor}">${ini(s.nome)}</div>
        <div class="gsb-info">
          <span class="gsb-name">${s.nome}</span>
          <span class="gsb-role">${s.cargo || ''}</span>
        </div>
        <div class="gsb-badge ${s.perfil==='admin'?'admin':'colab'}">
          ${s.perfil==='admin' ? '👑 Admin' : '👤 Colaborador'}
        </div>
        <button class="gsb-logout" onclick="GR7Auth.logout()">Sair →</button>
      </div>`;
      const st = document.createElement('style');
      st.textContent = `
        #gr7-session-bar{position:fixed;top:0;left:0;right:0;z-index:9000;background:#0e1018;border-bottom:1px solid #252738;padding:0 24px}
        .gsb-inner{display:flex;align-items:center;gap:12px;height:44px;max-width:1400px;margin:0 auto}
        .gsb-av{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:11px;font-weight:800;flex-shrink:0}
        .gsb-name{font-size:13px;font-weight:600;color:#dde1f0}
        .gsb-role{font-size:11px;color:#5a5e78;margin-left:8px}
        .gsb-badge{padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;flex-shrink:0}
        .gsb-badge.admin{background:rgba(232,121,249,.12);color:#e879f9;border:1px solid rgba(232,121,249,.2)}
        .gsb-badge.colab{background:rgba(56,189,248,.1);color:#38bdf8;border:1px solid rgba(56,189,248,.2)}
        .gsb-logout{margin-left:auto;padding:5px 12px;border-radius:7px;border:1px solid #252738;background:transparent;color:#5a5e78;font-size:11px;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .15s}
        .gsb-logout:hover{border-color:#f87171;color:#f87171}
        body{padding-top:44px!important}`;
      document.head.appendChild(st);
      document.body.prepend(bar);
    },

    /* ── doLogin: retorna {sucesso, usuario} ou {erro, msg} ── */
    async doLogin(login, senha) {
      try {
        const colab = await encontrar(login);
        if (!colab)
          return { erro: 'nao_encontrado', msg: 'Usuário não encontrado.' };
        if (!colab.senha_hash && !colab.pin_hash)
          return { erro: 'sem_senha',      msg: 'Sem senha cadastrada. Peça ao administrador.' };
        const ok = await verificar(colab, senha);
        if (!ok)
          return { erro: 'senha_errada',   msg: 'Senha incorreta.' };
        const sess = {
          id      : colab.id,
          nome    : colab.nome,
          cargo   : colab.cargo  || '',
          cor     : colab.cor    || '#818cf8',
          perfil  : colab.perfil || 'colaborador',
          usuario : colab.usuario || colab.nome,
        };
        setSession(sess);
        return { sucesso: true, usuario: sess };
      } catch (e) {
        return { erro: 'conexao', msg: 'Erro de conexão: ' + e.message };
      }
    },

    async loadColaboradores() {
      const r = await fetch(
        `${SURL}/rest/v1/colaboradores?ativo=eq.true&select=id,nome,cargo,cor,perfil,usuario&order=nome`,
        { headers: SH }
      );
      return r.json();
    },
  };

})();
