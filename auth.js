/* ═══════════════════════════════════════════════════════════
   GR7 — auth.js  v3.0  •  Sistema de Autenticação Central
   Login: usuário (texto) + senha SHA-256
   Fallback: pin_hash (compatibilidade v2)
   ═══════════════════════════════════════════════════════════ */
(function(){

  const SURL = 'https://nhzjkahbkeusgntheyug.supabase.co';
  const SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oemprYWhia2V1c2dudGhleXVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjYwMDQsImV4cCI6MjA4ODg0MjAwNH0.hB2bJBMoJoztuNrb4xCRIgWmwMlayBpVOMWq3mI4nH4';
  const SH   = {
    'Content-Type'  : 'application/json',
    'apikey'        : SKEY,
    'Authorization' : 'Bearer ' + SKEY,
  };

  const SESSION_KEY = 'gr7_session';
  const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 horas

  /* ── SHA-256 nativo do browser ── */
  async function sha256(txt) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  /* ── Iniciais do nome ── */
  function ini(n) {
    const p = (n || '').trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (n || '??').slice(0,2).toUpperCase();
  }

  /* ── Sessão (sessionStorage — expira ao fechar o navegador) ── */
  function getSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (!s) return null;
      if (Date.now() - s.ts > SESSION_TTL) { sessionStorage.removeItem(SESSION_KEY); return null; }
      return s;
    } catch { return null; }
  }
  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, ts: Date.now() }));
  }
  function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

  /* ═══════════════════════════════════════════════
     API PÚBLICA — window.GR7Auth
  ═══════════════════════════════════════════════ */
  window.GR7Auth = {

    /* Expõe constantes para outros scripts usarem */
    SURL, SKEY, SH,

    /* Utilitários de sessão */
    getSession,
    sha256,
    isAdmin  : () => (getSession() || {}).perfil === 'admin',
    isLogged : () => !!getSession(),

    /* Logout e limpeza */
    logout() {
      clearSession();
      window.location.href = 'login.html';
    },

    /* Protege a página — redireciona se não logado (ou não admin) */
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

    /* Oculta elementos [data-admin-only] para colaboradores */
    applyPermissions() {
      const admin = this.isAdmin();
      document.querySelectorAll('[data-admin-only]').forEach(el => {
        el.style.display = admin ? '' : 'none';
      });
      document.querySelectorAll('[data-colab-only]').forEach(el => {
        el.style.display = admin ? 'none' : '';
      });
    },

    /* Injeta barra de sessão no topo (usada em páginas sem sidebar) */
    injectSessionBar() {
      const s = getSession();
      if (!s) return;
      if (document.getElementById('gr7-session-bar')) return; // evita duplicata
      const bar = document.createElement('div');
      bar.id = 'gr7-session-bar';
      bar.innerHTML = `
        <div class="gsb-inner">
          <div class="gsb-av" style="background:${s.cor}22;color:${s.cor}">${ini(s.nome)}</div>
          <div class="gsb-info">
            <span class="gsb-name">${s.nome}</span>
            <span class="gsb-role">${s.cargo || ''}</span>
          </div>
          <div class="gsb-badge ${s.perfil === 'admin' ? 'admin' : 'colab'}">
            ${s.perfil === 'admin' ? '👑 Admin' : '👤 Colaborador'}
          </div>
          <button class="gsb-logout" onclick="GR7Auth.logout()">Sair →</button>
        </div>`;
      const style = document.createElement('style');
      style.textContent = `
        #gr7-session-bar{position:fixed;top:0;left:0;right:0;z-index:9000;background:#0e1018;border-bottom:1px solid #252738;padding:0 24px}
        .gsb-inner{display:flex;align-items:center;gap:12px;height:44px;max-width:1400px;margin:0 auto}
        .gsb-av{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:11px;font-weight:800;flex-shrink:0}
        .gsb-name{font-size:13px;font-weight:600;color:#dde1f0}
        .gsb-role{font-size:11px;color:#5a5e78;margin-left:8px}
        .gsb-badge{padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;letter-spacing:.5px;flex-shrink:0}
        .gsb-badge.admin{background:rgba(232,121,249,.12);color:#e879f9;border:1px solid rgba(232,121,249,.2)}
        .gsb-badge.colab{background:rgba(56,189,248,.1);color:#38bdf8;border:1px solid rgba(56,189,248,.2)}
        .gsb-logout{margin-left:auto;padding:5px 12px;border-radius:7px;border:1px solid #252738;background:transparent;color:#5a5e78;font-size:11px;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .15s}
        .gsb-logout:hover{border-color:#f87171;color:#f87171}
        body{padding-top:44px!important}`;
      document.head.appendChild(style);
      document.body.prepend(bar);
    },

    /* ── Login v3: usuario + senha (SHA-256) com fallback pin_hash ── */
    async doLogin(usuario, senha) {
      const hash = await sha256(senha);
      const u    = (usuario || '').trim();

      /* Busca por campo `usuario` ou `nome` (case-insensitive) */
      const url = `${SURL}/rest/v1/colaboradores`
        + `?or=(usuario.ilike.${encodeURIComponent(u)},nome.ilike.${encodeURIComponent(u)})`
        + `&ativo=eq.true`
        + `&select=id,nome,cargo,cor,perfil,usuario,senha_hash,pin_hash`;

      const r    = await fetch(url, { headers: SH });
      const data = await r.json();
      if (!Array.isArray(data) || !data.length) return null;

      const colab = data[0];

      /* Verifica senha_hash (v3) → fallback pin_hash (v2) */
      if (colab.senha_hash === hash || colab.pin_hash === hash) {
        const sess = {
          id      : colab.id,
          nome    : colab.nome,
          cargo   : colab.cargo   || '',
          cor     : colab.cor     || '#818cf8',
          perfil  : colab.perfil  || 'colaborador',
          usuario : colab.usuario || '',
        };
        setSession(sess);
        return sess;
      }
      return null;
    },

    /* Carrega lista de colaboradores ativos (usado em selects) */
    async loadColaboradores() {
      const r = await fetch(
        `${SURL}/rest/v1/colaboradores?ativo=eq.true&select=id,nome,cargo,cor,perfil,usuario&order=nome`,
        { headers: SH }
      );
      return r.json();
    },
  };

})();
