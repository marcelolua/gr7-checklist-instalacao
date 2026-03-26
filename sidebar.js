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
   3. SIDEBAR — Colapsada + hover expande + dropdowns por grupo
   Colapsada  : 56px (só ícones)
   Expandida  : 220px (ícones + labels + setas)
   Dropdown   : submenu abre no hover do item pai
   Mobile     : slide-in via hamburguer
══════════════════════════════════════════ */

const W_COL = 56;
const W_EXP = 220;

/* Estrutura de navegação com submenus */
const NAV_ITEMS = [
  {
    icon: '🏠', label: 'Dashboard', href: 'index.html',
  },
  {
    icon: '📁', label: 'Projetos', group: true,
    children: [
      { href: 'clientes.html',     icon: '🏢', label: 'Clientes'    },
      { href: 'implantacao.html',  icon: '🚀', label: 'Implantação' },
      { href: 'projeto.html',      icon: '📋', label: 'Projeto'     },
    ],
  },
  {
    icon: '✅', label: 'Instalação', group: true,
    children: [
      { href: 'Checklist.html',            icon: '☑️', label: 'Checklist'  },
      { href: 'relatorios-checklist.html', icon: '📊', label: 'Relatórios' },
    ],
  },
  {
    icon: '📌', label: 'Tarefas', href: 'tarefas.html',
  },
  {
    icon: '👥', label: 'Equipe', href: 'colaboradores.html',
  },
];

const SIDEBAR_CSS = `
  /* ── Overlay mobile ── */
  #gr7-sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1099;display:none}
  #gr7-sidebar-overlay.open{display:block}

  /* ── Sidebar ── */
  #gr7-sidebar{
    position:fixed;top:0;left:0;bottom:0;
    width:${W_COL}px;
    background:#0e1018;
    border-right:1px solid #252738;
    z-index:1100;
    display:flex;flex-direction:column;
    overflow:visible;
    transition:width .22s cubic-bezier(.4,0,.2,1), box-shadow .22s ease;
    will-change:width;
  }
  #gr7-sidebar.expanded{
    width:${W_EXP}px;
    box-shadow:6px 0 40px rgba(0,0,0,.5);
  }

  /* ── Logo ── */
  .gsb-logo{
    display:flex;align-items:center;
    padding:10px 9px;height:56px;
    border-bottom:1px solid #252738;
    flex-shrink:0;overflow:hidden;
  }
  .gsb-mark{
    width:38px;height:38px;flex-shrink:0;
    background:linear-gradient(135deg,#818cf8,#e879f9);
    border-radius:11px;
    display:flex;align-items:center;justify-content:center;
    font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:13px;color:#fff;
    transition:transform .2s;
  }
  #gr7-sidebar.expanded .gsb-mark{ transform:scale(.92); }
  .gsb-brand-wrap{
    margin-left:12px;opacity:0;transform:translateX(-6px);
    transition:opacity .18s .04s, transform .18s .04s;
    white-space:nowrap;overflow:hidden;flex:1;min-width:0;
  }
  #gr7-sidebar.expanded .gsb-brand-wrap{opacity:1;transform:translateX(0);}
  .gsb-brand    {font-family:'Syne',sans-serif;font-size:15px;font-weight:800;color:#dde1f0;}
  .gsb-brand-sub{font-size:9px;color:#5a5e78;margin-top:1px;letter-spacing:.3px;}

  /* ── Scroll área ── */
  .gsb-nav{
    padding:8px 0;flex:1;
    overflow-y:auto;overflow-x:visible;
    display:flex;flex-direction:column;
    scrollbar-width:none;
  }
  .gsb-nav::-webkit-scrollbar{display:none;}

  /* ── Item simples ── */
  .gsb-item{
    position:relative;
    display:flex;align-items:center;
    height:44px;
    text-decoration:none;
    color:#8a8faa;
    font-size:13px;font-weight:500;
    font-family:'Outfit',sans-serif;
    cursor:pointer;
    overflow:visible;
    transition:background .14s, color .14s;
    white-space:nowrap;
  }
  .gsb-item:hover,.gsb-item.submenu-open{ background:#161820; color:#dde1f0; }
  .gsb-item.active{ background:rgba(129,140,248,.12); color:#818cf8; font-weight:600; }
  .gsb-item.active::before{
    content:'';position:absolute;left:0;top:6px;bottom:6px;
    width:3px;border-radius:0 3px 3px 0;background:#818cf8;
  }

  /* Ícone */
  .gsb-item-icon{
    width:${W_COL}px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
    font-size:17px;
  }

  /* Label */
  .gsb-item-label{
    flex:1;min-width:0;overflow:hidden;
    opacity:0;transform:translateX(-5px);
    transition:opacity .16s .03s, transform .16s .03s;
  }
  #gr7-sidebar.expanded .gsb-item-label{opacity:1;transform:translateX(0);}

  /* Seta grupo */
  .gsb-item-arrow{
    width:20px;flex-shrink:0;margin-right:8px;
    font-size:10px;color:#5a5e78;
    opacity:0;transition:opacity .16s, transform .18s;
    display:flex;align-items:center;justify-content:center;
  }
  #gr7-sidebar.expanded .gsb-item-arrow{opacity:1;}
  .gsb-item.submenu-open .gsb-item-arrow{transform:rotate(90deg);color:#818cf8;}

  /* ── Tooltip colapsado ── */
  .gsb-item::after{
    content:attr(data-tip);
    position:absolute;left:calc(100% + 10px);top:50%;
    transform:translateY(-50%);
    background:#161820;border:1px solid #252738;
    color:#dde1f0;font-size:12px;
    padding:5px 10px;border-radius:8px;
    white-space:nowrap;pointer-events:none;
    opacity:0;transition:opacity .15s;
    z-index:9999;font-family:'Outfit',sans-serif;
    display:none;
  }
  #gr7-sidebar:not(.expanded) .gsb-item[data-tip]:not(.has-children)::after{ display:block; }
  #gr7-sidebar:not(.expanded) .gsb-item[data-tip]:hover::after{ opacity:1; }

  /* ── Submenu dropdown ── */
  .gsb-submenu{
    position:absolute;
    left:${W_COL}px;
    top:0;
    min-width:180px;
    background:#0e1018;
    border:1px solid #252738;
    border-radius:0 12px 12px 0;
    padding:6px 0;
    z-index:9998;
    box-shadow:8px 4px 32px rgba(0,0,0,.6);
    opacity:0;pointer-events:none;
    transform:translateX(-6px);
    transition:opacity .16s, transform .16s;
  }
  /* Quando expandido, submenu aparece ancorado à largura do sidebar */
  #gr7-sidebar.expanded .gsb-submenu{
    left:${W_EXP}px;
    border-radius:12px;
  }
  .gsb-item.submenu-open .gsb-submenu{
    opacity:1;pointer-events:auto;transform:translateX(0);
  }
  .gsb-sub-item{
    display:flex;align-items:center;gap:10px;
    padding:9px 16px;
    text-decoration:none;
    color:#8a8faa;font-size:13px;font-family:'Outfit',sans-serif;
    transition:background .12s, color .12s;
    white-space:nowrap;
  }
  .gsb-sub-item:hover{ background:#161820; color:#dde1f0; }
  .gsb-sub-item.active{ color:#818cf8; background:rgba(129,140,248,.1); }
  .gsb-sub-item-icon{ font-size:15px;width:20px;text-align:center;flex-shrink:0; }
  /* Título do grupo no topo do submenu */
  .gsb-sub-title{
    font-family:'IBM Plex Mono',monospace;font-size:9px;
    letter-spacing:1.5px;text-transform:uppercase;
    color:#5a5e78;padding:6px 16px 4px;
    border-bottom:1px solid #1e2030;margin-bottom:2px;
  }

  /* ── Rodapé ── */
  .gsb-footer{
    padding:8px 0 8px;border-top:1px solid #252738;
    flex-shrink:0;overflow:hidden;
  }
  .gsb-user{
    display:flex;align-items:center;
    height:44px;padding:0;
    overflow:hidden;
  }
  .gsb-user-av{
    width:${W_COL}px;height:44px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;
  }
  .gsb-av-inner{
    width:30px;height:30px;border-radius:8px;
    display:flex;align-items:center;justify-content:center;
    font-family:'Syne',sans-serif;font-size:11px;font-weight:800;
  }
  .gsb-user-info{
    flex:1;min-width:0;
    opacity:0;transform:translateX(-4px);
    transition:opacity .16s .04s, transform .16s .04s;
  }
  #gr7-sidebar.expanded .gsb-user-info{opacity:1;transform:translateX(0);}
  .gsb-user-name{font-size:12px;font-weight:600;color:#dde1f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .gsb-user-role{font-size:10px;color:#5a5e78;margin-top:1px;}
  .gsb-logout-btn{
    display:flex;align-items:center;justify-content:center;
    height:36px;width:100%;
    border:none;border-top:1px solid #252738;
    background:transparent;color:#5a5e78;
    font-size:12px;cursor:pointer;
    font-family:'Outfit',sans-serif;
    transition:color .14s, background .14s;
    gap:6px;
  }
  .gsb-logout-btn:hover{background:#161820;color:#f87171;}
  .gsb-logout-lbl{
    opacity:0;transform:translateX(-4px);
    transition:opacity .16s .04s, transform .16s .04s;
    white-space:nowrap;
  }
  #gr7-sidebar.expanded .gsb-logout-lbl{opacity:1;transform:translateX(0);}

  /* ── Hamburguer mobile ── */
  #gr7-menu-btn{
    position:fixed;top:14px;left:14px;z-index:1200;
    width:38px;height:38px;border-radius:10px;
    background:#0e1018;border:1px solid #252738;
    display:none;flex-direction:column;
    align-items:center;justify-content:center;gap:5px;
    cursor:pointer;transition:border-color .15s;
  }
  #gr7-menu-btn:hover{border-color:#818cf8;}
  #gr7-menu-btn span{display:block;width:18px;height:2px;background:#8a8faa;border-radius:2px;}

  /* ── Body offset ── */
  body{padding-left:${W_COL}px !important;}

  @media(max-width:899px){
    #gr7-menu-btn{display:flex !important;}
    body{padding-left:0 !important;}
    #gr7-sidebar{
      width:${W_EXP}px !important;
      transform:translateX(-100%);
      transition:transform .25s cubic-bezier(.4,0,.2,1) !important;
      box-shadow:none !important;overflow:hidden !important;
    }
    #gr7-sidebar.open{
      transform:translateX(0) !important;
      box-shadow:6px 0 40px rgba(0,0,0,.6) !important;
    }
    /* Mobile: labels sempre visíveis */
    .gsb-item-label,.gsb-brand-wrap,.gsb-user-info,.gsb-logout-lbl,.gsb-item-arrow{
      opacity:1 !important;transform:none !important;
    }
    /* Submenu mobile: posicionado abaixo do item */
    .gsb-submenu{
      position:static !important;
      border-radius:0 !important;
      border:none !important;
      box-shadow:none !important;
      background:#161820 !important;
      padding:0 !important;
      left:auto !important;
      display:none;
    }
    .gsb-item.submenu-open .gsb-submenu{
      display:block;
      opacity:1 !important;pointer-events:auto !important;transform:none !important;
    }
    .gsb-sub-item{padding-left:${W_COL}px !important;}
  }
`;

function ini(n) {
  const p = (n || '').trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (n || '?').slice(0, 2).toUpperCase();
}

function injectSidebar() {
  if (document.getElementById('gr7-sidebar')) return;

  const styleEl = document.createElement('style');
  styleEl.textContent = SIDEBAR_CSS;
  document.head.appendChild(styleEl);

  const session = (window.GR7Auth && GR7Auth.getSession()) || null;
  const isAdmin = session && session.perfil === 'admin';
  const curPage = location.pathname.split('/').pop() || 'index.html';

  /* Verifica se algum filho está ativo */
  function childActive(item) {
    return item.children && item.children.some(c => c.href === curPage);
  }

  /* Monta HTML dos itens */
  const navHTML = NAV_ITEMS.map(item => {
    if (item.group) {
      const active = childActive(item) ? ' active' : '';
      const childrenHTML = item.children.map(ch => {
        const ca = ch.href === curPage ? ' active' : '';
        return `<a class="gsb-sub-item${ca}" href="${ch.href}">
          <span class="gsb-sub-item-icon">${ch.icon}</span>${ch.label}
        </a>`;
      }).join('');
      return `<div class="gsb-item has-children${active}" data-tip="${item.label}" tabindex="0">
        <span class="gsb-item-icon">${item.icon}</span>
        <span class="gsb-item-label">${item.label}</span>
        <span class="gsb-item-arrow">›</span>
        <div class="gsb-submenu">
          <div class="gsb-sub-title">${item.label}</div>
          ${childrenHTML}
        </div>
      </div>`;
    }
    const active = curPage === item.href ? ' active' : '';
    return `<a class="gsb-item${active}" href="${item.href}" data-tip="${item.label}">
      <span class="gsb-item-icon">${item.icon}</span>
      <span class="gsb-item-label">${item.label}</span>
    </a>`;
  }).join('');

  const userBlock = session ? `
    <div class="gsb-user">
      <div class="gsb-user-av">
        <div class="gsb-av-inner" style="background:${(session.cor||'#818cf8')}22;color:${session.cor||'#818cf8'}">${ini(session.nome)}</div>
      </div>
      <div class="gsb-user-info">
        <div class="gsb-user-name">${session.nome}</div>
        <div class="gsb-user-role">${isAdmin ? '👑 Admin' : '👤 Colaborador'}</div>
      </div>
    </div>
    <button class="gsb-logout-btn" onclick="GR7Auth&&GR7Auth.logout()">
      <span>⬅</span><span class="gsb-logout-lbl">Sair do sistema</span>
    </button>
  ` : '';

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
    <nav class="gsb-nav">${navHTML}</nav>
    <div class="gsb-footer">${userBlock}</div>
  `;

  const overlay = document.createElement('div');
  overlay.id = 'gr7-sidebar-overlay';
  overlay.onclick = closeSidebar;

  const menuBtn = document.createElement('div');
  menuBtn.id = 'gr7-menu-btn';
  menuBtn.setAttribute('aria-label', 'Abrir menu');
  menuBtn.innerHTML = '<span></span><span></span><span></span>';
  menuBtn.onclick = toggleSidebar;

  document.body.prepend(menuBtn);
  document.body.prepend(overlay);
  document.body.prepend(sidebar);

  /* ══ Lógica de interação ══ */
  let _expandTimer   = null;
  let _collapseTimer = null;
  let _openGroup     = null;

  /* Expand/colapsa sidebar no hover (desktop) */
  sidebar.addEventListener('mouseenter', () => {
    clearTimeout(_collapseTimer);
    _expandTimer = setTimeout(() => sidebar.classList.add('expanded'), 0);
  });
  sidebar.addEventListener('mouseleave', () => {
    clearTimeout(_expandTimer);
    _collapseTimer = setTimeout(() => {
      if (window.innerWidth >= 900) {
        sidebar.classList.remove('expanded');
        closeAllSubmenus();
      }
    }, 100);
  });

  /* Dropdown por hover nos itens com filhos */
  sidebar.querySelectorAll('.gsb-item.has-children').forEach(item => {
    let _subTimer = null;

    item.addEventListener('mouseenter', () => {
      clearTimeout(_subTimer);
      closeAllSubmenus();
      item.classList.add('submenu-open');
      _openGroup = item;
    });

    item.addEventListener('mouseleave', e => {
      /* Se o mouse foi para o submenu, mantém aberto */
      const sub = item.querySelector('.gsb-submenu');
      if (sub && sub.contains(e.relatedTarget)) return;
      _subTimer = setTimeout(() => {
        item.classList.remove('submenu-open');
        if (_openGroup === item) _openGroup = null;
      }, 120);
    });

    /* Submenu: mantém aberto enquanto mouse está nele */
    const sub = item.querySelector('.gsb-submenu');
    if (sub) {
      sub.addEventListener('mouseenter', () => clearTimeout(_subTimer));
      sub.addEventListener('mouseleave', e => {
        if (item.contains(e.relatedTarget)) return;
        _subTimer = setTimeout(() => {
          item.classList.remove('submenu-open');
        }, 80);
      });
    }

    /* Mobile/teclado: toggle no click */
    item.addEventListener('click', e => {
      if (window.innerWidth < 900) {
        e.preventDefault();
        item.classList.toggle('submenu-open');
      }
    });
  });

  function closeAllSubmenus() {
    sidebar.querySelectorAll('.gsb-item.submenu-open').forEach(el => {
      el.classList.remove('submenu-open');
    });
    _openGroup = null;
  }
}

function toggleSidebar() {
  const sb = document.getElementById('gr7-sidebar');
  const ov = document.getElementById('gr7-sidebar-overlay');
  sb.classList.toggle('open');
  ov.classList.toggle('open');
  if (!sb.classList.contains('open')) {
    sb.querySelectorAll('.gsb-item.submenu-open').forEach(el => el.classList.remove('submenu-open'));
  }
}
function closeSidebar() {
  const sb = document.getElementById('gr7-sidebar');
  sb.classList.remove('open');
  document.getElementById('gr7-sidebar-overlay').classList.remove('open');
  sb.querySelectorAll('.gsb-item.submenu-open').forEach(el => el.classList.remove('submenu-open'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSidebar);
} else {
  injectSidebar();
}

})();
