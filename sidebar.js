/* ═══════════════════════════════════════════════════════════════
   GR7 — sidebar.js  v3.0
   Menu lateral responsivo + utilitários globais (toast, modais,
   skeletons, dirty-guard) + helper de realtime por polling.
   Depende de auth.js (deve ser carregado antes).
   ═══════════════════════════════════════════════════════════════ */
(function(){

/* ══════════════════════════════════════════
   1. UTILITÁRIOS GLOBAIS
══════════════════════════════════════════ */

window.humanizeError = function(e) {
  if (!e) return 'Erro desconhecido';
  const msg = e.message || e.hint || e.details || String(e);
  if (msg.includes('Failed to fetch'))                          return 'Sem conexão com o servidor.';
  if (msg.includes('column') && msg.includes('does not exist')) return 'Coluna não encontrada — execute o SQL de migração no Supabase.';
  if (msg.includes('JWT'))                                      return 'Chave de API inválida.';
  if (msg.includes('permission denied'))                        return 'Sem permissão — verifique as políticas RLS no Supabase.';
  return msg.slice(0, 120);
};

/* ── Toast ── */
window.toast = function(msg, type) {
  let el = document.getElementById('gr7-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'gr7-toast';
    el.style.cssText = [
      'position:fixed;bottom:24px;right:24px',
      'background:#161820;border:1px solid #252738;border-radius:12px',
      'padding:13px 18px;font-size:13px;color:#dde1f0',
      'z-index:99999;opacity:0;transform:translateY(10px)',
      'transition:all .3s;max-width:340px',
      'font-family:Outfit,sans-serif;pointer-events:none;line-height:1.5',
    ].join(';');
    document.body.appendChild(el);
  }
  el.textContent    = msg;
  el.style.borderColor = type === 'success' ? 'rgba(0,229,160,.4)'  : type === 'error' ? 'rgba(248,113,113,.4)' : '#252738';
  el.style.color       = type === 'success' ? '#00e5a0'             : type === 'error' ? '#f87171'              : '#dde1f0';
  el.style.opacity     = '1';
  el.style.transform   = 'translateY(0)';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(10px)'; }, 3200);
};

/* ── Modal alerta ── */
window.gr7Alert = function({ title = '', message = '', icon = 'ℹ️' } = {}) {
  return new Promise(resolve => {
    const bg = _makeModalBg();
    bg.innerHTML = `<div style="${_modalBox()}">
      <div style="font-size:32px;margin-bottom:12px">${icon}</div>
      <div style="font-family:Syne,sans-serif;font-size:17px;font-weight:700;margin-bottom:8px">${title}</div>
      <div style="font-size:13px;color:#8a8faa;margin-bottom:22px;line-height:1.6">${message}</div>
      <div style="display:flex;justify-content:flex-end">
        <button id="_gr7ok" style="${_btnStyle('#818cf8')}">OK</button>
      </div></div>`;
    document.body.appendChild(bg);
    bg.querySelector('#_gr7ok').onclick = () => { bg.remove(); resolve(); };
  });
};

/* ── Modal confirmação ── */
window.gr7Confirm = function({ title = '', message = '', confirmText = 'Confirmar', cancelText = 'Cancelar', danger = false, icon = '❓' } = {}) {
  return new Promise(resolve => {
    const bg       = _makeModalBg();
    const btnColor = danger ? '#f87171' : '#818cf8';
    bg.innerHTML = `<div style="${_modalBox()}">
      <div style="font-size:32px;margin-bottom:12px">${icon}</div>
      <div style="font-family:Syne,sans-serif;font-size:17px;font-weight:700;margin-bottom:8px">${title}</div>
      <div style="font-size:13px;color:#8a8faa;margin-bottom:22px;line-height:1.6">${message}</div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="_gr7no"  style="${_btnStyle('#252738', true)}">${cancelText}</button>
        <button id="_gr7yes" style="${_btnStyle(btnColor)}">${confirmText}</button>
      </div></div>`;
    document.body.appendChild(bg);
    bg.querySelector('#_gr7yes').onclick = () => { bg.remove(); resolve(true);  };
    bg.querySelector('#_gr7no').onclick  = () => { bg.remove(); resolve(false); };
  });
};

/* ── Guard de alterações não salvas ── */
window.gr7DirtyGuard = function({ fieldIds = [], closeFn = () => {}, interceptEl = [], confirmOpts = {} } = {}) {
  const initVals = {};
  fieldIds.forEach(id => { const el = document.getElementById(id); if (el) initVals[id] = el.value; });

  function isDirty() {
    return fieldIds.some(id => { const el = document.getElementById(id); return el && el.value !== initVals[id]; });
  }

  async function intercept(e) {
    if (e && e.target !== e.currentTarget) return;
    if (!isDirty()) { closeFn(); return; }
    e && e.preventDefault && e.preventDefault();
    const ok = await gr7Confirm({
      title: 'Descartar?', message: 'Alterações serão perdidas.',
      confirmText: 'Descartar', cancelText: 'Continuar',
      ...confirmOpts,
    });
    if (ok) closeFn();
  }

  const handlers = [];
  interceptEl.forEach(el => {
    if (!el) return;
    const fn = e => intercept(e);
    el.addEventListener('click', fn);
    handlers.push({ el, fn });
  });
  return { destroy() { handlers.forEach(({ el, fn }) => el.removeEventListener('click', fn)); } };
};

/* ── Skeletons de loading ── */
function _sk(w, h, r = 8) {
  return `<div style="width:${w};height:${h}px;border-radius:${r}px;background:linear-gradient(90deg,#161820 25%,#1e2030 50%,#161820 75%);background-size:200% 100%;animation:skshimmer 1.4s infinite;flex-shrink:0"></div>`;
}
/* Injeta keyframe uma vez */
if (!document.getElementById('_skshimmer-style')) {
  const s = document.createElement('style');
  s.id = '_skshimmer-style';
  s.textContent = '@keyframes skshimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
  document.head.appendChild(s);
}
window.gr7Skeletons = {
  userPills(n = 4)         { return Array(n).fill(0).map(() => `<div style="display:flex;align-items:center;gap:12px;background:#161820;border:1px solid #252738;border-radius:12px;padding:12px 14px">${_sk('38px',38,10)}${_sk('60%',14)}</div>`).join(''); },
  clientRows(n = 5)        { return Array(n).fill(0).map(() => `<div style="display:grid;grid-template-columns:1fr 120px 130px 110px;gap:12px;padding:13px 24px;border-bottom:1px solid #252738">${_sk('180px',14)}${_sk('80px',14)}${_sk('110px',10,99)}${_sk('60px',5,99)}</div>`).join(''); },
  clientTable(n = 5)       { return Array(n).fill(0).map(() => `<div style="display:grid;grid-template-columns:1fr 100px 120px 80px 60px;gap:12px;padding:13px 18px;border-bottom:1px solid #252738;align-items:center">${_sk('160px',14)}${_sk('70px',12)}${_sk('90px',10,99)}${_sk('50px',5,99)}${_sk('50px',14)}</div>`).join(''); },
  implantCards(n = 8)      { return Array(n).fill(0).map(() => `<div style="background:#0e1018;border:1.5px solid #252738;border-radius:18px;padding:28px 16px 18px;display:flex;flex-direction:column;align-items:center;gap:12px">${_sk('80px',80,99)}${_sk('100px',14)}${_sk('60px',10,99)}</div>`).join(''); },
  projetoShell()           { return `<div style="padding:40px;text-align:center;color:#5a5e78">Carregando projeto...</div>`; },
  colabCols(n = 3)         { return Array(n).fill(0).map(() => `<div style="background:#0e1018;border:1px solid #252738;border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:10px">${_sk('80%',16)}${_sk('100%',8,99)}${_sk('60%',12)}</div>`).join(''); },
  rankingRows(n = 5)       { return Array(n).fill(0).map(() => `<div style="display:grid;grid-template-columns:46px 44px 1fr 200px 64px;gap:12px;padding:14px 24px;border-bottom:1px solid #252738;align-items:center">${_sk('30px',30,8)}${_sk('36px',36,10)}${_sk('140px',14)}${_sk('100%',7,99)}${_sk('40px',14)}</div>`).join(''); },
  collaboratorCards(n = 3) { return Array(n).fill(0).map(() => `<div style="background:#0e1018;border:1px solid #252738;border-radius:14px;overflow:hidden"><div style="padding:20px 20px 16px;display:flex;align-items:center;gap:14px;border-bottom:1px solid #252738">${_sk('48px',48,14)}${_sk('120px',16)}</div><div style="padding:16px 20px">${_sk('100%',7,99)}</div></div>`).join(''); },
};

/* ── Helpers internos de modal ── */
function _makeModalBg() {
  const bg = document.createElement('div');
  bg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:99000;backdrop-filter:blur(4px);padding:20px';
  return bg;
}
function _modalBox()                     { return 'background:#0e1018;border:1px solid #252738;border-radius:20px;padding:32px;width:100%;max-width:420px;text-align:center;color:#dde1f0;font-family:Outfit,sans-serif'; }
function _btnStyle(bg, outline = false)  { return `padding:9px 22px;border-radius:9px;border:1px solid ${bg};background:${outline?'transparent':bg};color:${outline?'#8a8faa':'#fff'};font-family:Outfit,sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s`; }

/* ══════════════════════════════════════════
   2. REALTIME HELPER (polling)
   Uso: gr7Realtime.watch(table, callback, intervalMs)
        gr7Realtime.stop(table)
══════════════════════════════════════════ */
window.gr7Realtime = (function() {
  const _timers  = {};
  const _hashes  = {};

  return {
    watch(table, callback, ms = 15000) {
      this.stop(table);
      const SURL = window.GR7Auth && GR7Auth.SURL;
      const SH   = window.GR7Auth && GR7Auth.SH;
      if (!SURL) return;

      async function poll() {
        try {
          const r = await fetch(`${SURL}/rest/v1/${table}?select=id&order=id.desc&limit=1`, { headers: SH });
          if (!r.ok) return;
          const d = await r.json();
          const h = JSON.stringify(d);
          if (_hashes[table] && h !== _hashes[table]) {
            callback();
          }
          _hashes[table] = h;
        } catch { /* silently ignore */ }
      }

      poll(); // imediato na primeira vez
      _timers[table] = setInterval(poll, ms);
    },
    stop(table) {
      if (_timers[table]) { clearInterval(_timers[table]); delete _timers[table]; }
    },
    stopAll() {
      Object.keys(_timers).forEach(t => this.stop(t));
    },
  };
})();

/* ══════════════════════════════════════════
   3. SIDEBAR — HTML + CSS injetados no DOM
══════════════════════════════════════════ */
const NAV_ITEMS = [
  { href: 'index.html',               icon: '🏠', label: 'Dashboard'   },
  { href: 'clientes.html',            icon: '🏢', label: 'Clientes'    },
  { href: 'implantacao.html',         icon: '🚀', label: 'Implantação' },
  { href: 'tarefas.html',             icon: '📌', label: 'Tarefas'     },
  { href: 'Checklist.html',           icon: '✅', label: 'Checklist'   },
  { href: 'relatorios-checklist.html',icon: '📊', label: 'Relatórios'  },
  { href: 'colaboradores.html',       icon: '👥', label: 'Colaboradores'},
];


/* ══════════════════════════════════════════
   3. SIDEBAR — Colapsada por padrão, expande no hover
   Largura colapsada : 56px (só ícones)
   Largura expandida : 200px (ícones + labels)
   Comportamento     : hover expande, mouse fora colapsa
   Mobile (<900px)   : slide-in via botão hamburguer
══════════════════════════════════════════ */
const NAV_ITEMS = [
  { href: 'index.html',               icon: '🏠', label: 'Dashboard'    },
  { href: 'clientes.html',            icon: '🏢', label: 'Clientes'     },
  { href: 'implantacao.html',         icon: '🚀', label: 'Implantação'  },
  { href: 'tarefas.html',             icon: '📌', label: 'Tarefas'      },
  { href: 'Checklist.html',           icon: '✅', label: 'Checklist'    },
  { href: 'relatorios-checklist.html',icon: '📊', label: 'Relatórios'   },
  { href: 'colaboradores.html',       icon: '👥', label: 'Colaboradores'},
];

/* ── Larguras ── */
const W_COLLAPSED = 56;   /* px — só ícone */
const W_EXPANDED  = 200;  /* px — ícone + label */

const SIDEBAR_CSS = `
  /* ── Reset e base ── */
  #gr7-sidebar-overlay{
    position:fixed;inset:0;background:rgba(0,0,0,.5);
    z-index:1099;display:none;
  }
  #gr7-sidebar-overlay.open{ display:block; }

  /* ── Sidebar principal ── */
  #gr7-sidebar{
    position:fixed;top:0;left:0;bottom:0;
    width:${W_COLLAPSED}px;
    background:#0e1018;
    border-right:1px solid #252738;
    z-index:1100;
    display:flex;flex-direction:column;
    overflow:hidden;
    transition:width .25s cubic-bezier(.4,0,.2,1),
               box-shadow .25s ease;
    will-change:width;
  }

  /* Expandido por hover (desktop) */
  #gr7-sidebar.expanded{
    width:${W_EXPANDED}px;
    box-shadow:4px 0 32px rgba(0,0,0,.45);
  }

  /* Mobile: slide-in via classe .open (override tudo) */
  @media(max-width:899px){
    #gr7-sidebar{
      width:${W_EXPANDED}px !important;
      transform:translateX(-100%);
      transition:transform .28s cubic-bezier(.4,0,.2,1) !important;
      box-shadow:none !important;
    }
    #gr7-sidebar.open{
      transform:translateX(0) !important;
      box-shadow:4px 0 32px rgba(0,0,0,.6) !important;
    }
  }

  /* ── Logo / marca ── */
  .gsb-logo{
    display:flex;align-items:center;gap:12px;
    padding:14px 9px 14px;
    border-bottom:1px solid #252738;
    flex-shrink:0;min-height:56px;
    overflow:hidden;
  }
  .gsb-mark{
    width:38px;height:38px;flex-shrink:0;
    background:linear-gradient(135deg,#818cf8,#e879f9);
    border-radius:11px;
    display:flex;align-items:center;justify-content:center;
    font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:13px;color:#fff;
  }
  .gsb-brand-wrap{
    opacity:0;transform:translateX(-6px);
    transition:opacity .2s ease .05s, transform .2s ease .05s;
    white-space:nowrap;overflow:hidden;
  }
  #gr7-sidebar.expanded .gsb-brand-wrap{
    opacity:1;transform:translateX(0);
  }
  .gsb-brand    {font-family:'Syne',sans-serif;font-size:16px;font-weight:800;color:#dde1f0;}
  .gsb-brand-sub{font-size:10px;color:#5a5e78;margin-top:1px;}

  /* ── Navegação ── */
  .gsb-nav{
    padding:10px 0;flex:1;
    overflow-y:auto;overflow-x:hidden;
    display:flex;flex-direction:column;gap:2px;
    scrollbar-width:none;
  }
  .gsb-nav::-webkit-scrollbar{display:none;}

  .gsb-section{
    font-family:'IBM Plex Mono',monospace;font-size:9px;
    letter-spacing:2px;text-transform:uppercase;
    color:#5a5e78;
    padding:10px 0 4px;
    text-align:center;
    opacity:0;
    transition:opacity .15s ease;
    white-space:nowrap;overflow:hidden;
  }
  #gr7-sidebar.expanded .gsb-section{
    opacity:1;
    padding:10px 18px 4px;
    text-align:left;
  }

  /* ── Item de menu ── */
  .gsb-item{
    display:flex;align-items:center;gap:0;
    padding:10px 0;
    justify-content:center;
    border-radius:0;
    text-decoration:none;
    color:#8a8faa;
    font-size:13px;font-weight:500;
    transition:background .15s,color .15s,padding .25s,gap .25s,justify-content .25s;
    font-family:'Outfit',sans-serif;
    white-space:nowrap;
    overflow:hidden;
    position:relative;
  }
  .gsb-item:hover{ background:#161820; color:#dde1f0; }
  .gsb-item.active{
    background:rgba(129,140,248,.12);
    color:#818cf8;font-weight:600;
  }
  /* Linha indicadora ativa (esquerda) */
  .gsb-item.active::before{
    content:'';
    position:absolute;left:0;top:6px;bottom:6px;
    width:3px;border-radius:0 3px 3px 0;
    background:#818cf8;
  }

  /* Ícone */
  .gsb-item-icon{
    font-size:18px;flex-shrink:0;
    width:${W_COLLAPSED}px;
    text-align:center;
    transition:width .25s;
  }

  /* Label — oculto colapsado, visível expandido */
  .gsb-item-label{
    flex:1;
    opacity:0;
    transform:translateX(-4px);
    transition:opacity .18s ease .04s, transform .18s ease .04s;
    overflow:hidden;
  }
  #gr7-sidebar.expanded .gsb-item-label{
    opacity:1;transform:translateX(0);
  }
  #gr7-sidebar.expanded .gsb-item{
    justify-content:flex-start;
    padding:10px 0;
    gap:0;
  }
  #gr7-sidebar.expanded .gsb-item-icon{
    width:${W_COLLAPSED}px;
  }

  /* Tooltip no modo colapsado */
  .gsb-item[data-tip]{position:relative;}
  .gsb-item[data-tip]:not(.gsb-expanded-mode)::after{
    content:attr(data-tip);
    position:absolute;left:calc(100% + 10px);top:50%;
    transform:translateY(-50%);
    background:#161820;border:1px solid #252738;
    color:#dde1f0;font-size:12px;
    padding:5px 10px;border-radius:8px;
    white-space:nowrap;pointer-events:none;
    opacity:0;transition:opacity .15s;
    z-index:9999;font-family:'Outfit',sans-serif;
  }
  .gsb-item[data-tip]:hover::after{opacity:1;}
  /* Oculta tooltip quando expandido */
  #gr7-sidebar.expanded .gsb-item[data-tip]::after{display:none;}

  /* ── Rodapé / usuário ── */
  .gsb-footer{
    padding:10px 0 10px;
    border-top:1px solid #252738;
    flex-shrink:0;overflow:hidden;
  }
  .gsb-user{
    display:flex;align-items:center;gap:0;
    padding:8px 0;justify-content:center;
    border-radius:0;background:#161820;
    margin:0 0 6px;
    overflow:hidden;transition:padding .25s,gap .25s,justify-content .25s;
  }
  #gr7-sidebar.expanded .gsb-user{
    gap:10px;padding:8px 10px;justify-content:flex-start;
    border-radius:10px;margin:0 8px 6px;
  }
  .gsb-user-av{
    width:30px;height:30px;border-radius:8px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-family:'Syne',sans-serif;font-size:11px;font-weight:800;
  }
  .gsb-user-info{
    flex:1;min-width:0;
    opacity:0;transform:translateX(-4px);
    transition:opacity .18s ease .05s,transform .18s ease .05s;
  }
  #gr7-sidebar.expanded .gsb-user-info{opacity:1;transform:translateX(0);}
  .gsb-user-name{font-size:12px;font-weight:600;color:#dde1f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .gsb-user-role{font-size:10px;color:#5a5e78;margin-top:1px;}

  /* Botão sair */
  .gsb-logout{
    display:flex;align-items:center;justify-content:center;gap:6px;
    width:calc(100% - 0px);padding:8px 0;
    border-radius:0;border:none;
    border-top:1px solid #252738;
    background:transparent;color:#5a5e78;
    font-size:12px;cursor:pointer;
    font-family:'Outfit',sans-serif;transition:color .15s, background .15s;
    overflow:hidden;
  }
  .gsb-logout:hover{background:#161820;color:#f87171;}
  .gsb-logout-label{
    opacity:0;transform:translateX(-4px);
    transition:opacity .18s ease .05s,transform .18s ease .05s;
    white-space:nowrap;
  }
  #gr7-sidebar.expanded .gsb-logout-label{opacity:1;transform:translateX(0);}
  #gr7-sidebar.expanded .gsb-logout{
    width:calc(100% - 16px);margin:0 8px;
    border-radius:8px;border:1px solid #252738;
    border-top:none;padding:7px 12px;
  }

  /* ── Hamburguer (mobile) ── */
  #gr7-menu-btn{
    position:fixed;top:14px;left:14px;z-index:1200;
    width:38px;height:38px;border-radius:10px;
    background:#0e1018;border:1px solid #252738;
    display:none; /* oculto em desktop */
    flex-direction:column;align-items:center;justify-content:center;gap:5px;
    cursor:pointer;transition:border-color .15s;
  }
  #gr7-menu-btn:hover{border-color:#818cf8;}
  #gr7-menu-btn span{
    display:block;width:18px;height:2px;
    background:#8a8faa;border-radius:2px;transition:all .2s;
  }

  /* ── Body offset ── */
  body{ padding-left:${W_COLLAPSED}px !important; }

  @media(max-width:899px){
    #gr7-menu-btn{ display:flex !important; }
    body{ padding-left:0 !important; }
  }
`;

/* ── Iniciais ── */
function ini(n) {
  const p = (n || '').trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (n || '?').slice(0,2).toUpperCase();
}

function injectSidebar() {
  if (document.getElementById('gr7-sidebar')) return;

  /* Estilos */
  const styleEl = document.createElement('style');
  styleEl.textContent = SIDEBAR_CSS;
  document.head.appendChild(styleEl);

  const session = (window.GR7Auth && GR7Auth.getSession()) || null;
  const isAdmin = session && session.perfil === 'admin';
  const curPage = location.pathname.split('/').pop() || 'index.html';

  /* Nav items */
  const navHTML = NAV_ITEMS.map(item => {
    const active = curPage === item.href ? ' active' : '';
    return `<a class="gsb-item${active}" href="${item.href}" data-tip="${item.label}">
      <span class="gsb-item-icon">${item.icon}</span>
      <span class="gsb-item-label">${item.label}</span>
    </a>`;
  }).join('');

  /* Bloco do usuário */
  const userBlock = session ? `
    <div class="gsb-user">
      <div class="gsb-user-av" style="background:${(session.cor||'#818cf8')}22;color:${session.cor||'#818cf8'}">${ini(session.nome)}</div>
      <div class="gsb-user-info">
        <div class="gsb-user-name">${session.nome}</div>
        <div class="gsb-user-role">${isAdmin ? '👑 Admin' : '👤 Colaborador'}</div>
      </div>
    </div>
    <button class="gsb-logout" onclick="GR7Auth&&GR7Auth.logout()">
      <span>⬅</span>
      <span class="gsb-logout-label">Sair do sistema</span>
    </button>
  ` : `
    <button class="gsb-logout" onclick="window.location.href='login.html'">
      <span>⬅</span>
      <span class="gsb-logout-label">Fazer login</span>
    </button>
  `;

  /* Sidebar DOM */
  const sidebar = document.createElement('div');
  sidebar.id = 'gr7-sidebar';
  sidebar.innerHTML = `
    <div class="gsb-logo">
      <div class="gsb-mark">GR7</div>
      <div class="gsb-brand-wrap">
        <div class="gsb-brand">GR7</div>
        <div class="gsb-brand-sub">Sistema de Instalações</div>
      </div>
    </div>
    <nav class="gsb-nav">
      <div class="gsb-section">Menu</div>
      ${navHTML}
    </nav>
    <div class="gsb-footer">${userBlock}</div>
  `;

  /* Overlay (mobile) */
  const overlay = document.createElement('div');
  overlay.id = 'gr7-sidebar-overlay';
  overlay.onclick = closeSidebar;

  /* Hamburguer (mobile) */
  const menuBtn = document.createElement('div');
  menuBtn.id = 'gr7-menu-btn';
  menuBtn.setAttribute('aria-label', 'Abrir menu');
  menuBtn.innerHTML = '<span></span><span></span><span></span>';
  menuBtn.onclick = toggleSidebar;

  document.body.prepend(menuBtn);
  document.body.prepend(overlay);
  document.body.prepend(sidebar);

  /* ── Hover expand/collapse (desktop) ── */
  let _hoverTimer = null;

  sidebar.addEventListener('mouseenter', () => {
    clearTimeout(_hoverTimer);
    sidebar.classList.add('expanded');
  });

  sidebar.addEventListener('mouseleave', () => {
    /* Pequeno delay para não piscar ao mover entre itens */
    _hoverTimer = setTimeout(() => {
      /* Só colapsa no modo desktop */
      if (window.innerWidth >= 900) {
        sidebar.classList.remove('expanded');
      }
    }, 80);
  });
}

/* ── Toggle mobile ── */
function toggleSidebar() {
  const sb = document.getElementById('gr7-sidebar');
  const ov = document.getElementById('gr7-sidebar-overlay');
  sb.classList.toggle('open');
  ov.classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('gr7-sidebar').classList.remove('open');
  document.getElementById('gr7-sidebar-overlay').classList.remove('open');
}

/* Auto-inject */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSidebar);
} else {
  injectSidebar();
}

})();
