(function () {
  // ─── 1. CSS ─────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --sb-w: 220px;
      --sb-w-col: 56px;
      --sb-dur: .22s;
    }

    body {
      padding-left: var(--sb-w-col);
      transition: padding-left var(--sb-dur) cubic-bezier(.4,0,.2,1);
    }
    body.sb-expanded {
      padding-left: var(--sb-w);
    }

    /* ── Sidebar ── */
    .sidebar {
      position: fixed; top: 0; left: 0; height: 100vh;
      width: var(--sb-w-col);
      background: #0e1018;
      border-right: 1px solid #1e2030;
      display: flex; flex-direction: column;
      z-index: 999;
      transition: width var(--sb-dur) cubic-bezier(.4,0,.2,1),
                  box-shadow var(--sb-dur) ease;
      overflow: hidden;
      will-change: width;
    }
    .sidebar.expanded {
      width: var(--sb-w);
      box-shadow: 4px 0 32px rgba(0,0,0,.55);
    }

    /* ── Logo ── */
    .sb-logo {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 10px;
      height: 56px;
      border-bottom: 1px solid #1e2030;
      flex-shrink: 0; overflow: hidden;
    }
    .sb-logo-mark {
      width: 36px; height: 36px; flex-shrink: 0;
      background: linear-gradient(135deg, #818cf8, #e879f9);
      border-radius: 10px; display: flex; align-items: center;
      justify-content: center; font-family: 'IBM Plex Mono', monospace;
      font-weight: 600; font-size: 13px; color: #fff;
      box-shadow: 0 0 20px rgba(129,140,248,.35);
    }
    .sb-logo-text {
      opacity: 0; transform: translateX(-6px);
      transition: opacity .18s .03s, transform .18s .03s;
      white-space: nowrap; overflow: hidden;
    }
    .sidebar.expanded .sb-logo-text {
      opacity: 1; transform: translateX(0);
    }
    .sb-logo-text h2 {
      font-family: 'Syne', sans-serif; font-size: 16px;
      font-weight: 800; letter-spacing: -.3px; color: #fff;
    }
    .sb-logo-text p { font-size: 10px; color: #5a5e78; margin-top: 2px; }

    /* ── Nav ── */
    .sb-nav {
      flex: 1; padding: 8px 0;
      overflow-y: auto; overflow-x: hidden;
      scrollbar-width: none;
    }
    .sb-nav::-webkit-scrollbar { display: none; }

    .sb-label {
      font-family: 'IBM Plex Mono', monospace; font-size: 9px;
      letter-spacing: 2px; text-transform: uppercase; color: #3a3e58;
      padding: 10px 0 4px;
      text-align: center;
      opacity: 0;
      transition: opacity .15s, padding .22s, text-align .22s;
      white-space: nowrap; overflow: hidden;
    }
    .sidebar.expanded .sb-label {
      opacity: 1;
      padding: 10px 18px 4px;
      text-align: left;
    }

    /* ── Item ── */
    .sb-item {
      display: flex; align-items: center;
      height: 44px;
      padding: 0;
      color: #5a5e78; font-size: 13px; font-weight: 500;
      cursor: pointer; text-decoration: none;
      transition: background .13s, color .13s;
      white-space: nowrap; overflow: hidden;
      border-left: 2px solid transparent;
      position: relative;
    }
    .sb-item:hover { color: #dde1f0; background: rgba(255,255,255,.04); }
    .sb-item.active {
      color: #00e5a0; background: rgba(0,229,160,.07);
      border-left-color: #00e5a0;
    }

    /* Ícone — sempre centrado na faixa colapsada */
    .sb-icon {
      width: var(--sb-w-col); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
    }

    /* Texto — fade-in ao expandir */
    .sb-text {
      flex: 1; overflow: hidden;
      opacity: 0; transform: translateX(-4px);
      transition: opacity .16s .03s, transform .16s .03s;
    }
    .sidebar.expanded .sb-text {
      opacity: 1; transform: translateX(0);
    }

    /* Tooltip quando colapsado */
    .sb-item[data-tip]::after {
      content: attr(data-tip);
      position: absolute; left: calc(var(--sb-w-col) + 8px); top: 50%;
      transform: translateY(-50%);
      background: #161820; border: 1px solid #252738;
      color: #dde1f0; font-size: 12px; font-family: 'Outfit', sans-serif;
      padding: 5px 10px; border-radius: 8px;
      white-space: nowrap; pointer-events: none;
      opacity: 0; transition: opacity .15s;
      z-index: 9999;
    }
    .sidebar:not(.expanded) .sb-item[data-tip]:hover::after { opacity: 1; }
    .sidebar.expanded .sb-item[data-tip]::after { display: none; }

    /* ── Footer / usuário ── */
    .sb-footer {
      border-top: 1px solid #1e2030;
      padding: 10px 0;
      flex-shrink: 0; overflow: hidden;
    }
    .sb-user {
      display: flex; align-items: center;
      height: 44px; overflow: hidden;
    }
    .sb-user-av {
      width: var(--sb-w-col); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .sb-user-av-inner {
      width: 30px; height: 30px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 800;
    }
    .sb-user-info {
      flex: 1; min-width: 0;
      opacity: 0; transform: translateX(-4px);
      transition: opacity .16s .03s, transform .16s .03s;
    }
    .sidebar.expanded .sb-user-info { opacity: 1; transform: translateX(0); }
    .sb-user-name {
      font-size: 12px; font-weight: 600; color: #dde1f0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .sb-user-role { font-size: 10px; color: #5a5e78; margin-top: 1px; }

    .sb-logout {
      display: flex; align-items: center;
      height: 36px; width: 100%;
      border: none; border-top: 1px solid #1e2030;
      background: transparent; color: #5a5e78;
      font-size: 12px; cursor: pointer;
      font-family: 'Outfit', sans-serif;
      gap: 0; overflow: hidden;
      transition: color .13s, background .13s;
    }
    .sb-logout:hover { background: rgba(248,113,113,.08); color: #f87171; }
    .sb-logout-icon {
      width: var(--sb-w-col); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }
    .sb-logout-text {
      opacity: 0; transform: translateX(-4px);
      transition: opacity .16s .03s, transform .16s .03s;
      white-space: nowrap;
    }
    .sidebar.expanded .sb-logout-text { opacity: 1; transform: translateX(0); }

    /* ── Mobile ── */
    @media (max-width: 700px) {
      body { padding-left: 0 !important; }
      .sidebar {
        width: var(--sb-w) !important;
        transform: translateX(-100%);
        transition: transform var(--sb-dur) cubic-bezier(.4,0,.2,1) !important;
        box-shadow: none !important;
      }
      .sidebar.mobile-open {
        transform: translateX(0) !important;
        box-shadow: 4px 0 32px rgba(0,0,0,.65) !important;
      }
      .sidebar.mobile-open .sb-text,
      .sidebar.mobile-open .sb-logo-text,
      .sidebar.mobile-open .sb-user-info,
      .sidebar.mobile-open .sb-logout-text {
        opacity: 1 !important; transform: none !important;
      }
      .sidebar.mobile-open .sb-label {
        opacity: 1 !important; padding: 10px 18px 4px !important; text-align: left !important;
      }
      .sb-overlay {
        display: none; position: fixed; inset: 0;
        background: rgba(0,0,0,.5); z-index: 998;
      }
      .sb-overlay.visible { display: block; }
      .sb-mobile-btn {
        position: fixed; top: 12px; left: 12px; z-index: 997;
        width: 36px; height: 36px; border-radius: 9px;
        background: #0e1018; border: 1px solid #1e2030;
        color: #5a5e78; font-size: 18px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all .15s;
      }
      .sb-mobile-btn:hover { border-color: #3a3e58; color: #dde1f0; }
    }
  `;
  document.head.appendChild(style);

  // ─── 2. DADOS ────────────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { href: 'index.html',               icon: '🏠', label: 'Dashboard'   },
    { href: 'clientes.html',            icon: '🏢', label: 'Clientes'    },
    { href: 'implantacao.html',         icon: '🚀', label: 'Implantação' },
    { href: 'tarefas.html',             icon: '📌', label: 'Tarefas'     },
    { href: 'Checklist.html',           icon: '✅', label: 'Checklist'   },
    { href: 'relatorios-checklist.html',icon: '📊', label: 'Relatórios'  },
  ];

  const currentFile = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const activeMap   = { 'projeto.html': 'implantacao.html' };
  const activePage  = activeMap[currentFile] || currentFile;

  function ini(n) {
    const p = (n || '').trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : (n || '?').slice(0, 2).toUpperCase();
  }

  // ─── 3. HTML ─────────────────────────────────────────────────────────────────
  function buildSidebar() {
    const session = window.GR7Auth ? GR7Auth.getSession() : null;
    const isAdmin = session && session.perfil === 'admin';

    const navHTML = NAV_ITEMS.map(item => {
      const active = item.href.toLowerCase() === activePage ? ' active' : '';
      return `<a class="sb-item${active}" href="${item.href}" data-tip="${item.label}">
        <span class="sb-icon">${item.icon}</span>
        <span class="sb-text">${item.label}</span>
      </a>`;
    }).join('\n');

    const userBlock = session ? `
      <div class="sb-user">
        <div class="sb-user-av">
          <div class="sb-user-av-inner" style="background:${(session.cor||'#818cf8')}22;color:${session.cor||'#818cf8'}">${ini(session.nome)}</div>
        </div>
        <div class="sb-user-info">
          <div class="sb-user-name">${session.nome}</div>
          <div class="sb-user-role">${isAdmin ? '👑 Admin' : '👤 Colaborador'}</div>
        </div>
      </div>
      <button class="sb-logout" onclick="window.GR7Auth&&GR7Auth.logout()">
        <span class="sb-logout-icon">⬅</span>
        <span class="sb-logout-text">Sair do sistema</span>
      </button>
    ` : '';

    const aside = document.createElement('aside');
    aside.className = 'sidebar';
    aside.id = 'sidebar';
    aside.innerHTML = `
      <div class="sb-logo">
        <div class="sb-logo-mark">GR7</div>
        <div class="sb-logo-text">
          <h2>GR7</h2>
          <p>Sistema de Instalações</p>
        </div>
      </div>
      <nav class="sb-nav">
        <div class="sb-label">Menu</div>
        ${navHTML}
      </nav>
      <div class="sb-footer">${userBlock}</div>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'sb-overlay';
    overlay.id = 'sbOverlay';
    overlay.onclick = () => closeMobileSidebar();

    const mobileBtn = document.createElement('button');
    mobileBtn.className = 'sb-mobile-btn';
    mobileBtn.id = 'sbMobileBtn';
    mobileBtn.innerHTML = '☰';
    mobileBtn.onclick = () => openMobileSidebar();

    document.body.prepend(mobileBtn);
    document.body.prepend(overlay);
    document.body.prepend(aside);

    // ── Hover expand/collapse (desktop) ──
    let _timer = null;

    aside.addEventListener('mouseenter', () => {
      clearTimeout(_timer);
      aside.classList.add('expanded');
      document.body.classList.add('sb-expanded');
    });

    aside.addEventListener('mouseleave', () => {
      _timer = setTimeout(() => {
        if (window.innerWidth > 700) {
          aside.classList.remove('expanded');
          document.body.classList.remove('sb-expanded');
        }
      }, 80);
    });
  }

  // ─── 4. MOBILE ───────────────────────────────────────────────────────────────
  function openMobileSidebar() {
    const aside = document.getElementById('sidebar');
    aside.classList.add('mobile-open');
    document.getElementById('sbOverlay').classList.add('visible');
  }
  function closeMobileSidebar() {
    const aside = document.getElementById('sidebar');
    aside.classList.remove('mobile-open');
    document.getElementById('sbOverlay').classList.remove('visible');
  }

  // Expõe toggle para compatibilidade
  window.toggleSidebar = function () {
    const aside = document.getElementById('sidebar');
    if (window.innerWidth <= 700) {
      aside.classList.contains('mobile-open') ? closeMobileSidebar() : openMobileSidebar();
    }
  };

  // Injeta quando DOM estiver pronto
  if (document.body) {
    buildSidebar();
  } else {
    document.addEventListener('DOMContentLoaded', buildSidebar);
  }

  // ─── 5. HUMANIZADOR DE ERROS ─────────────────────────────────────────────────
    const ERROR_MAP = [
    { match: /relation .* does not exist/i,         msg: 'Tabela não encontrada. Verifique a configuração do banco.' },
    { match: /column .* does not exist/i,            msg: 'Campo não encontrado. A estrutura do banco pode estar desatualizada.' },
    { match: /permission denied/i,                   msg: 'Sem permissão para realizar esta ação.' },
    { match: /JWTExpired|invalid.*JWT|jwt/i,         msg: 'Sessão expirada. Recarregue a página.' },
    { match: /duplicate key|unique.*violation/i,     msg: 'Este registro já existe. Verifique os dados.' },
    { match: /violates foreign key/i,                msg: 'Este item está vinculado a outros dados e não pode ser removido.' },
    { match: /null value.*violates not-null/i,       msg: 'Campo obrigatório não preenchido.' },
    { match: /value too long/i,                      msg: 'Um campo excede o tamanho máximo permitido.' },
    { match: /invalid input syntax/i,                msg: 'Formato de dado inválido. Verifique os campos.' },
    { match: /PGRST\d{3}/,                           msg: 'Erro na consulta ao banco de dados. Tente novamente.' },
    { match: /fetch|network|Failed to fetch/i,       msg: 'Sem conexão com o servidor. Verifique sua internet.' },
    { match: /timeout|timed? out/i,                  msg: 'O servidor demorou muito para responder. Tente novamente.' },
    { match: /5\d\d|Internal Server Error/i,         msg: 'Erro interno do servidor. Tente novamente em instantes.' },
    { match: /404|Not Found/i,                       msg: 'Recurso não encontrado.' },
    { match: /401|403|Unauthorized|Forbidden/i,      msg: 'Acesso não autorizado.' },
  ];

  window.humanizeError = function (e) {
    const raw = (typeof e === 'string' ? e : '') ||
      (e && e.message) || (e && e.error_description) ||
      (e && e.hint) || JSON.stringify(e) || '';
    for (var i = 0; i < ERROR_MAP.length; i++) {
      if (ERROR_MAP[i].match.test(raw)) return ERROR_MAP[i].msg;
    }
    return 'Algo deu errado. Tente novamente ou recarregue a página.';
  };

  // ─── 5. SKELETON LOADING ────────────────────────────────────────────────────
  (function () {
    var skStyle = document.createElement('style');
    skStyle.textContent = [
      '.sk{background:var(--s2);border-radius:6px;position:relative;overflow:hidden;flex-shrink:0}',
      '.sk::after{content:"";position:absolute;inset:0;',
        'background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.045) 50%,transparent 100%);',
        'animation:sk-shim 1.6s ease-in-out infinite}',
      '@keyframes sk-shim{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}',
      /* Preset dimensions */
      '.sk-circle{border-radius:50%}',
      '.sk-r{border-radius:var(--r,14px)}',
    ].join('');
    document.head.appendChild(skStyle);
  })();

  /**
   * sk(w, h, extra)  →  '<div class="sk" style="width:W;height:H;EXTRA"></div>'
   * Helper inline para construir blocos skeleton.
   */
  window.sk = function (w, h, extra) {
    return '<div class="sk" style="width:' + w + ';height:' + h + (extra ? ';' + extra : '') + '"></div>';
  };

  /**
   * gr7Skeletons — HTML strings prontos para cada zona de loading do sistema.
   * Cada função retorna uma string HTML que imita a forma do componente real.
   */
  window.gr7Skeletons = {

    /* ── Painel de equipe (users-grid-list) ── */
    userPills: function (n) {
      n = n || 6;
      var pill = '<div style="display:flex;align-items:center;gap:12px;background:var(--s2);border:1px solid var(--bdr);border-radius:12px;padding:12px 14px">'
        + sk('38px', '38px', 'border-radius:10px')
        + '<div style="flex:1;display:flex;flex-direction:column;gap:6px">'
        + sk('60%', '12px') + sk('40%', '10px') + '</div>'
        + sk('24px', '24px', 'border-radius:7px') + sk('24px', '24px', 'border-radius:7px')
        + '</div>';
      return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;padding:20px 24px">'
        + pill.repeat(n) + '</div>';
    },

    /* ── Summary cards (4 blocos de número) ── */
    summaryCards: function () {
      var card = '<div style="background:var(--s2);border:1px solid var(--bdr);border-radius:14px;padding:24px;position:relative;overflow:hidden">'
        + '<div class="sk" style="position:absolute;top:0;left:0;right:0;height:2px;background:var(--s3)"></div>'
        + '<div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">'
        + sk('50%', '42px', 'border-radius:8px') + sk('65%', '12px') + '</div></div>';
      return card.repeat(4);
    },

    /* ── Tabela de clientes recentes (cl-row) ── */
    clientRows: function (n) {
      n = n || 7;
      var row = '<div style="display:grid;grid-template-columns:1fr 120px 130px 110px 90px;align-items:center;gap:12px;padding:14px 24px;border-bottom:1px solid var(--bdr)">'
        + '<div style="display:flex;flex-direction:column;gap:6px">' + sk('55%', '13px') + '</div>'
        + sk('80px', '12px', 'border-radius:4px')
        + sk('90px', '20px', 'border-radius:99px')
        + '<div style="display:flex;align-items:center;gap:8px">' + sk('1fr', '5px', 'flex:1;border-radius:99px') + sk('32px', '11px', 'border-radius:4px') + '</div>'
        + sk('70px', '12px', 'border-radius:4px')
        + '</div>';
      return row.repeat(n);
    },

    /* ── Ranking de colaboradores (rk-row) ── */
    rankingRows: function (n) {
      n = n || 5;
      var row = '<div style="display:grid;grid-template-columns:46px 44px 1fr 220px 64px 90px;align-items:center;gap:12px;padding:14px 24px;border-bottom:1px solid var(--bdr)">'
        + sk('24px', '24px', 'border-radius:6px;margin:auto')
        + sk('36px', '36px', 'border-radius:10px')
        + sk('45%', '14px')
        + '<div style="height:7px;background:var(--s3);border-radius:99px;overflow:hidden">'
          + '<div class="sk" style="width:60%;height:100%;border-radius:99px"></div></div>'
        + sk('36px', '14px', 'margin-left:auto;border-radius:4px')
        + sk('64px', '12px', 'margin-left:auto;border-radius:4px')
        + '</div>';
      return row.repeat(n);
    },

    /* ── Cards de colaboradores (ucard — grid 3 colunas) ── */
    collaboratorCards: function (n) {
      n = n || 3;
      var card = '<div style="background:var(--s1);border:1px solid var(--bdr);border-radius:14px;overflow:hidden">'
        // top
        + '<div style="padding:20px 20px 16px;display:flex;align-items:center;gap:14px;border-bottom:1px solid var(--bdr)">'
          + sk('48px', '48px', 'border-radius:14px')
          + '<div style="flex:1;display:flex;flex-direction:column;gap:7px">' + sk('55%', '14px') + sk('45%', '18px', 'border-radius:99px') + '</div>'
          + '<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">' + sk('48px', '28px') + sk('48px', '10px') + '</div>'
        + '</div>'
        // progress
        + '<div style="padding:14px 20px 10px;display:flex;flex-direction:column;gap:7px">'
          + '<div style="height:7px;background:var(--s3);border-radius:99px;overflow:hidden"><div class="sk" style="width:70%;height:100%;border-radius:99px"></div></div>'
        + '</div>'
        // stats
        + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 20px 14px">'
          + [0,0,0].map(function(){return '<div style="background:var(--s2);border-radius:10px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:6px">'+sk('70%','22px')+sk('80%','9px')+'</div>';}).join('')
        + '</div>'
        // bars
        + '<div style="padding:0 20px 18px;display:flex;flex-direction:column;gap:8px">'
          + [0,0,0].map(function(){return '<div style="display:flex;align-items:center;gap:10px">'+sk('80px','10px')+'<div style="flex:1;height:6px;background:var(--s3);border-radius:99px;overflow:hidden"><div class="sk" style="width:'+(40+Math.random()*40|0)+'%;height:100%;border-radius:99px"></div></div>'+sk('28px','10px')+'</div>';}).join('')
        + '</div>'
      + '</div>';
      return card.repeat(n);
    },

    /* ── Tabela de clientes (clientes.html — tbl-row 7 colunas) ── */
    clientTable: function (n) {
      n = n || 8;
      var row = '<div style="display:grid;grid-template-columns:2fr 1.5fr 130px 120px 100px 90px 60px;align-items:center;gap:12px;padding:15px 20px;border-bottom:1px solid var(--bdr)">'
        + '<div style="display:flex;flex-direction:column;gap:6px">' + sk('60%', '13px') + sk('40%', '10px') + '</div>'
        + sk('75%', '11px', 'border-radius:4px')
        + sk('80%', '13px', 'border-radius:4px')
        + sk('80%', '13px', 'border-radius:4px')
        + sk('70%', '20px', 'border-radius:99px')
        + '<div style="display:flex;gap:3px">' + sk('60px', '18px', 'border-radius:4px') + '</div>'
        + '<div style="display:flex;gap:5px;justify-content:flex-end">' + sk('26px', '26px', 'border-radius:7px') + sk('26px', '26px', 'border-radius:7px') + '</div>'
        + '</div>';
      return row.repeat(n);
    },

    /* ── Cards de implantação (cli-card circular — minmax 170px) ── */
    implantCards: function (n) {
      n = n || 8;
      var card = '<div style="background:var(--s1);border:1.5px solid var(--bdr);border-radius:18px;display:flex;flex-direction:column;align-items:center;padding:28px 16px 18px;position:relative;overflow:hidden">'
        + '<div class="sk" style="position:absolute;top:0;left:0;right:0;height:3px"></div>'
        + sk('90px', '90px', 'border-radius:50%;margin-bottom:13px')
        + sk('70%', '13px', 'border-radius:6px;margin-bottom:6px')
        + sk('50%', '10px', 'border-radius:99px;margin-bottom:9px')
        + sk('60px', '20px', 'border-radius:99px')
        + '</div>';
      return card.repeat(n);
    },

    /* ── Colunas de relatório (colab-col) ── */
    colabCols: function (n) {
      n = n || 3;
      var col = '<div style="background:var(--s1);border:1px solid var(--bdr);border-radius:14px;overflow:hidden">'
        // header
        + '<div style="padding:18px 20px;display:flex;align-items:center;gap:12px;border-bottom:1px solid var(--bdr)">'
          + sk('42px', '42px', 'border-radius:12px')
          + '<div style="flex:1;display:flex;flex-direction:column;gap:7px">' + sk('55%', '14px') + sk('40%', '10px') + '</div>'
          + '<div style="display:flex;gap:16px">'
            + '<div style="display:flex;flex-direction:column;align-items:center;gap:5px">' + sk('28px', '16px') + sk('28px', '9px') + '</div>'
            + '<div style="display:flex;flex-direction:column;align-items:center;gap:5px">' + sk('28px', '16px') + sk('28px', '9px') + '</div>'
          + '</div>'
        + '</div>'
        // rows
        + ['', ''].map(function () {
          return '<div style="padding:10px 20px;border-top:1px solid var(--bdr);display:flex;align-items:center;gap:10px">'
            + sk('15px', '15px', 'border-radius:3px') + '<div style="flex:1;display:flex;flex-direction:column;gap:5px">' + sk('60%', '12px') + sk('40%', '10px') + '</div>'
            + '<div style="display:flex;align-items:center;gap:6px">' + sk('40px', '4px', 'border-radius:99px') + sk('26px', '10px') + '</div>'
            + sk('16px', '16px', 'border-radius:3px')
            + '</div>';
        }).join('')
      + '</div>';
      return col.repeat(n);
    },

    /* ── Projeto (shell completo) ── */
    projetoShell: function () {
      return ''
        // breadcrumb
        + '<div style="display:flex;align-items:center;gap:8px;padding:20px 0 0">'
          + sk('80px', '11px', 'border-radius:4px') + sk('8px', '8px', 'border-radius:2px') + sk('140px', '11px', 'border-radius:4px')
        + '</div>'
        // hero
        + '<div style="display:flex;align-items:center;gap:22px;padding:28px 0 22px">'
          + sk('68px', '68px', 'border-radius:50%')
          + '<div style="flex:1;display:flex;flex-direction:column;gap:10px">'
            + sk('45%', '22px') + sk('30%', '12px')
            + '<div style="display:flex;gap:7px">' + sk('90px', '20px', 'border-radius:99px') + sk('70px', '20px', 'border-radius:99px') + '</div>'
          + '</div>'
          + '<div style="display:flex;gap:8px">' + sk('80px', '34px', 'border-radius:9px') + sk('80px', '34px', 'border-radius:9px') + '</div>'
        + '</div>'
        // progress bar
        + '<div style="background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:18px 22px;margin-bottom:24px;display:flex;align-items:center;gap:20px">'
          + '<div style="flex:1;display:flex;flex-direction:column;gap:8px">'
            + '<div style="display:flex;justify-content:space-between">' + sk('100px', '11px') + sk('40px', '14px') + '</div>'
            + '<div style="height:10px;background:var(--s3);border-radius:99px;overflow:hidden"><div class="sk" style="width:65%;height:100%;border-radius:99px"></div></div>'
          + '</div>'
          + '<div style="display:flex;gap:18px">'
            + [0,0,0].map(function(){return '<div style="display:flex;flex-direction:column;align-items:center;gap:5px">'+sk('32px','20px')+sk('40px','9px')+'</div>';}).join('')
          + '</div>'
        + '</div>'
        // main grid
        + '<div style="display:grid;grid-template-columns:1fr 300px;gap:20px;align-items:start">'
          // left col
          + '<div>'
            + ['🖥️ Instalações', '🧩 Módulos', '📋 Tarefas'].map(function(title, i) {
              return '<div style="background:var(--s1);border:1px solid var(--bdr);border-radius:14px;overflow:hidden;margin-bottom:20px">'
                + '<div style="padding:15px 20px;border-bottom:1px solid var(--bdr);display:flex;justify-content:space-between">'
                  + sk('120px', '14px') + sk('60px', '11px')
                + '</div>'
                + [0,0].map(function(){return '<div style="padding:13px 20px;border-bottom:1px solid var(--bdr);display:flex;align-items:center;gap:12px">'+sk('36px','36px','border-radius:9px')+'<div style="flex:1;display:flex;flex-direction:column;gap:6px">'+sk('40%','13px')+sk('55%','10px')+'</div>'+sk('40px','12px')+'</div>';}).join('')
              + '</div>';
            }).join('')
          + '</div>'
          // right col
          + '<div>'
            + [120, 180, 80, 80].map(function(h) {
              return '<div style="background:var(--s1);border:1px solid var(--bdr);border-radius:14px;padding:16px 18px;margin-bottom:20px;display:flex;flex-direction:column;gap:12px">'
                + sk('60%', '14px') + sk('100%', String(h - 40) + 'px', 'border-radius:10px')
              + '</div>';
            }).join('')
          + '</div>'
        + '</div>';
    },

  };

  // ─── 6. DIRTY GUARD ──────────────────────────────────────────────────────────
  /**
   * gr7DirtyGuard(config)
   *
   * Protege qualquer conjunto de campos contra fechamento acidental com dados não salvos.
   * Retorna uma função `destroy()` para remover os listeners quando o modal fechar de verdade.
   *
   * config = {
   *   fieldIds   : string[]   — IDs dos inputs/selects/textareas a monitorar
   *   closeFn    : Function   — função que realmente fecha o modal
   *   confirmOpts: Object     — opções para gr7Confirm (title, message, etc.)
   *   interceptEl: Element[]  — elementos cujo click deve ser interceptado (X, Cancelar, fundo)
   * }
   */
  window.gr7DirtyGuard = function (config) {
    var fieldIds    = config.fieldIds    || [];
    var closeFn     = config.closeFn     || function(){};
    var interceptEl = config.interceptEl || [];
    var confirmOpts = Object.assign({
      title:       'Descartar alterações?',
      message:     'Você tem dados não salvos. Sair agora vai apagar o que foi preenchido.',
      confirmText: 'Sim, descartar',
      cancelText:  'Continuar editando',
      danger:      true,
      icon:        '⚠️',
    }, config.confirmOpts || {});

    // Captura snapshot dos valores actuais no momento da abertura
    function snapshot() {
      var s = {};
      fieldIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox' || el.type === 'radio') s[id] = el.checked;
        else s[id] = el.value;
      });
      return JSON.stringify(s);
    }

    // Lê estado atual dos campos e compara com o snapshot
    var _baseline = snapshot();
    function isDirty() { return snapshot() !== _baseline; }

    // Função de fechamento com confirmação se sujo
    async function guardedClose(e) {
      if (!isDirty()) { destroy(); closeFn(); return; }
      if (e) { e.preventDefault(); e.stopPropagation(); }
      var ok = await gr7Confirm(confirmOpts);
      if (ok) { destroy(); closeFn(); }
    }

    // Intercepta cada elemento de fechamento
    interceptEl.forEach(function (el) {
      if (el) el.addEventListener('click', guardedClose, true);
    });

    // Atualiza o baseline depois de um save bem-sucedido
    function refresh() { _baseline = snapshot(); }

    function destroy() {
      interceptEl.forEach(function (el) {
        if (el) el.removeEventListener('click', guardedClose, true);
      });
    }

    return { destroy: destroy, refresh: refresh, isDirty: isDirty };
  };

  // ─── 5. MODAL DE CONFIRMAÇÃO ───────────────────────────────────────────────
  // Injeta CSS do modal uma única vez
  const confirmStyle = document.createElement('style');
  confirmStyle.textContent = `
    .gr7-modal-bg {
      position: fixed; inset: 0; z-index: 2000;
      background: rgba(0,0,0,.65);
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      backdrop-filter: blur(4px);
      opacity: 0; pointer-events: none;
      transition: opacity .18s ease;
    }
    .gr7-modal-bg.open { opacity: 1; pointer-events: auto; }

    .gr7-modal {
      background: #0e1018; border: 1px solid #252738;
      border-radius: 16px; padding: 28px 28px 24px;
      width: 100%; max-width: 420px;
      transform: translateY(12px); transition: transform .18s ease;
      font-family: 'Outfit', sans-serif;
    }
    .gr7-modal-bg.open .gr7-modal { transform: translateY(0); }

    .gr7-modal-icon {
      font-size: 28px; margin-bottom: 14px; display: block;
      line-height: 1;
    }
    .gr7-modal-title {
      font-family: 'Syne', sans-serif;
      font-size: 17px; font-weight: 700;
      color: #dde1f0; margin-bottom: 8px;
    }
    .gr7-modal-msg {
      font-size: 13px; color: #5a5e78;
      line-height: 1.55; margin-bottom: 24px;
    }
    .gr7-modal-actions {
      display: flex; gap: 10px; justify-content: flex-end;
    }
    .gr7-btn {
      padding: 9px 22px; border-radius: 9px;
      font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all .15s; border: 1.5px solid;
      font-family: 'Outfit', sans-serif;
    }
    .gr7-btn-cancel {
      background: transparent; border-color: #252738; color: #5a5e78;
    }
    .gr7-btn-cancel:hover { border-color: #666; color: #dde1f0; }

    .gr7-btn-confirm {
      background: rgba(248,113,113,.12);
      border-color: rgba(248,113,113,.4);
      color: #f87171;
    }
    .gr7-btn-confirm:hover {
      background: rgba(248,113,113,.22);
      border-color: rgba(248,113,113,.7);
    }
    .gr7-btn-confirm.safe {
      background: rgba(0,229,160,.1);
      border-color: rgba(0,229,160,.35);
      color: #00e5a0;
    }
    .gr7-btn-confirm.safe:hover {
      background: rgba(0,229,160,.2);
      border-color: rgba(0,229,160,.6);
    }

    .gr7-modal-info {
      background: #161820; border: 1px solid #252738;
      border-radius: 9px; padding: 14px 18px;
    }
    .gr7-modal-info .gr7-modal-title { font-size: 16px; margin-bottom: 6px; }
    .gr7-modal-info .gr7-modal-actions { margin-top: 20px; }
    .gr7-modal-info .gr7-btn-confirm.safe { min-width: 80px; }
  `;
  document.head.appendChild(confirmStyle);

  // Cria e reutiliza o mesmo nó de background
  const modalBg = document.createElement('div');
  modalBg.className = 'gr7-modal-bg';
  modalBg.innerHTML = '<div class="gr7-modal" id="gr7ModalBox"></div>';

  // Fecha ao clicar no fundo
  modalBg.addEventListener('click', function (e) {
    if (e.target === modalBg) _rejectFn && _rejectFn();
  });

  // Fecha com Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalBg.classList.contains('open')) {
      _rejectFn && _rejectFn();
    }
  });

  // Injetar o modal no body (com guard para quando sidebar.js roda no <head>)
  function injectModal() { document.body.appendChild(modalBg); }
  if (document.body) { injectModal(); }
  else { document.addEventListener('DOMContentLoaded', injectModal); }

  let _resolveFn = null;
  let _rejectFn  = null;

  function _openModal(html) {
    document.getElementById('gr7ModalBox').innerHTML = html;
    modalBg.offsetHeight; // força reflow para a transição funcionar
    modalBg.classList.add('open');
    // Foca o botão cancelar por padrão (segurança: não confirma com Enter acidental)
    setTimeout(() => {
      const cancel = modalBg.querySelector('.gr7-btn-cancel');
      if (cancel) cancel.focus();
    }, 20);
  }

  function _closeModal() {
    modalBg.classList.remove('open');
    _resolveFn = null;
    _rejectFn  = null;
  }

  /**
   * gr7Confirm({ title, message, confirmText, cancelText, danger })
   * Retorna Promise<boolean> — true se confirmado, false se cancelado.
   *
   * Exemplo:
   *   if (!await gr7Confirm({ title: 'Excluir cliente?', message: 'Esta ação não pode ser desfeita.' })) return;
   */
  window.gr7Confirm = function ({
    title       = 'Tem certeza?',
    message     = 'Esta ação não pode ser desfeita.',
    confirmText = 'Confirmar',
    cancelText  = 'Cancelar',
    danger      = true,
    icon        = danger ? '🗑️' : '⚠️',
  } = {}) {
    return new Promise((resolve) => {
      _resolveFn = resolve;
      _rejectFn  = () => { _closeModal(); resolve(false); };

      _openModal(`
        <span class="gr7-modal-icon">${icon}</span>
        <div class="gr7-modal-title">${title}</div>
        <div class="gr7-modal-msg">${message}</div>
        <div class="gr7-modal-actions">
          <button class="gr7-btn gr7-btn-cancel"
            onclick="(function(){document.querySelector('.gr7-modal-bg').classList.remove('open');})();
                     window._gr7Resolve && window._gr7Resolve(false)">
            ${cancelText}
          </button>
          <button class="gr7-btn gr7-btn-confirm ${danger ? '' : 'safe'}"
            onclick="(function(){document.querySelector('.gr7-modal-bg').classList.remove('open');})();
                     window._gr7Resolve && window._gr7Resolve(true)">
            ${confirmText}
          </button>
        </div>
      `);

      // Expõe o resolve para os botões inline conseguirem chamar
      window._gr7Resolve = (val) => {
        _closeModal();
        resolve(val);
        window._gr7Resolve = null;
      };
    });
  };

  /**
   * gr7Alert({ title, message, buttonText })
   * Substitui o alert() nativo. Retorna Promise<void>.
   */
  window.gr7Alert = function ({
    title      = 'Atenção',
    message    = '',
    buttonText = 'OK',
    icon       = 'ℹ️',
  } = {}) {
    return new Promise((resolve) => {
      _resolveFn = resolve;
      _rejectFn  = () => { _closeModal(); resolve(); };

      _openModal(`
        <div class="gr7-modal gr7-modal-info" style="padding:0">
          <div style="padding:24px 24px 0">
            <span class="gr7-modal-icon">${icon}</span>
            <div class="gr7-modal-title">${title}</div>
            ${message ? `<div class="gr7-modal-msg">${message}</div>` : ''}
          </div>
          <div class="gr7-modal-actions" style="padding:0 24px 20px">
            <button class="gr7-btn gr7-btn-confirm safe" style="min-width:80px"
              onclick="window._gr7Resolve && window._gr7Resolve()">
              ${buttonText}
            </button>
          </div>
        </div>
      `);

      window._gr7Resolve = () => {
        _closeModal();
        resolve();
        window._gr7Resolve = null;
      };
    });
  };

})();
