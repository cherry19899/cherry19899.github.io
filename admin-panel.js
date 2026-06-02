(function() {
  'use strict';
  const API_BASE = 'https://workpro-api.onrender.com';
  const ADMIN_USER = 'cherry19899';
  let panelEl = null, currentTab = 'stats';
  let jobsData=[], usersData=[], escrowsData=[], earningsData=[];

  function getHeaders() {
    const user = localStorage.getItem('workpro_user');
    let username = ADMIN_USER;
    if (user) { try { username = JSON.parse(user).username || username; } catch(e){} }
    return { 'Content-Type': 'application/json', 'x-user-id': username };
  }

  async function api(path) {
    const res = await fetch(API_BASE + path, { headers: getHeaders() });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    return res.json();
  }
  async function apiDelete(path) {
    const res = await fetch(API_BASE + path, { method: 'DELETE', headers: getHeaders() });
    if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
    return res.json();
  }

  function createStyles() {
    if (document.getElementById('wp-admin-styles')) return;
    const style = document.createElement('style');
    style.id = 'wp-admin-styles';
    style.textContent = `
      #wp-admin-panel { position:fixed; top:0; left:0; width:100%; height:100%; background:#f5f5f5; z-index:99999; overflow-y:auto; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; display:none; }
      #wp-admin-panel.active { display:block; }
      .wp-admin-header { background:#10b981; color:white; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:10; }
      .wp-admin-header h2 { margin:0; font-size:18px; }
      .wp-admin-close { background:rgba(255,255,255,0.2); border:none; color:white; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:14px; }
      .wp-admin-tabs { display:flex; gap:8px; padding:12px 16px; overflow-x:auto; background:white; border-bottom:1px solid #e5e7eb; }
      .wp-admin-tab { padding:8px 16px; border:none; background:#f3f4f6; color:#374151; border-radius:20px; white-space:nowrap; cursor:pointer; font-size:14px; }
      .wp-admin-tab.active { background:#10b981; color:white; }
      .wp-admin-content { padding:16px; }
      .wp-admin-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px; }
      .wp-admin-card { background:white; border-radius:12px; padding:16px; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
      .wp-admin-card-num { font-size:28px; font-weight:700; color:#10b981; }
      .wp-admin-card-label { font-size:12px; color:#6b7280; margin-top:4px; }
      .wp-admin-list { display:flex; flex-direction:column; gap:10px; }
      .wp-admin-item { background:white; border-radius:10px; padding:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); display:flex; justify-content:space-between; align-items:center; }
      .wp-admin-item-info { flex:1; min-width:0; }
      .wp-admin-item-title { font-weight:600; font-size:15px; color:#111; }
      .wp-admin-item-meta { font-size:12px; color:#6b7280; margin-top:2px; }
      .wp-admin-delete { background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; font-size:13px; cursor:pointer; margin-left:8px; }
      .wp-admin-delete:disabled { opacity:0.5; }
      .wp-admin-empty { text-align:center; color:#9ca3af; padding:40px; font-size:14px; }
      .wp-admin-loading { text-align:center; padding:40px; color:#6b7280; }
      @media(min-width:768px) { .wp-admin-grid { grid-template-columns:1fr 1fr 1fr 1fr; } }
    `;
    document.head.appendChild(style);
  }

  function createPanel() {
    if (panelEl) return panelEl;
    createStyles();
    panelEl = document.createElement('div');
    panelEl.id = 'wp-admin-panel';
    panelEl.innerHTML = `
      <div class="wp-admin-header"><h2>Admin</h2><button class="wp-admin-close" onclick="WorkProAdmin.hide()">Close</button></div>
      <div class="wp-admin-tabs">
        <button class="wp-admin-tab active" data-tab="stats">Stats</button>
        <button class="wp-admin-tab" data-tab="users">Users</button>
        <button class="wp-admin-tab" data-tab="jobs">All Jobs</button>
        <button class="wp-admin-tab" data-tab="escrows">All Escrows</button>
        <button class="wp-admin-tab" data-tab="earnings">Earnings</button>
      </div>
      <div class="wp-admin-content" id="wp-admin-content"><div class="wp-admin-loading">Loading...</div></div>
    `;
    document.body.appendChild(panelEl);
    panelEl.querySelectorAll('.wp-admin-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currentTab = btn.dataset.tab;
        panelEl.querySelectorAll('.wp-admin-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render();
      });
    });
    return panelEl;
  }

  function extractArray(resp, key) {
    if (Array.isArray(resp)) return resp;
    if (resp && typeof resp === 'object' && Array.isArray(resp[key])) return resp[key];
    return [];
  }

  async function loadData() {
    try {
      if (currentTab === 'stats') { const stats = await api('/api/admin/stats'); return { stats }; }
      if (currentTab === 'users') { if (!usersData.length) { const resp = await api('/api/admin/users'); usersData = extractArray(resp, 'users'); } return { users: usersData }; }
      if (currentTab === 'jobs') { if (!jobsData.length) { const resp = await api('/api/admin/jobs/all'); jobsData = extractArray(resp, 'jobs'); } return { jobs: jobsData }; }
      if (currentTab === 'escrows') { if (!escrowsData.length) { const resp = await api('/api/admin/escrows'); escrowsData = extractArray(resp, 'escrows'); } return { escrows: escrowsData }; }
      if (currentTab === 'earnings') { if (!earningsData.length) { const resp = await api('/api/admin/earnings'); earningsData = extractArray(resp, 'payments'); } return { earnings: earningsData }; }
    } catch(e) { return { error: e.message }; }
    return {};
  }

  async function render() {
    const content = document.getElementById('wp-admin-content');
    content.innerHTML = '<div class="wp-admin-loading">Loading...</div>';
    const data = await loadData();
    if (data.error) { content.innerHTML = '<div class="wp-admin-empty">Error: '+data.error+'</div>'; return; }

    if (currentTab === 'stats') {
      const s = data.stats || {};
      content.innerHTML = `
        <div class="wp-admin-grid">
          <div class="wp-admin-card"><div class="wp-admin-card-num">${s.total_jobs||0}</div><div class="wp-admin-card-label">Total Jobs</div></div>
          <div class="wp-admin-card"><div class="wp-admin-card-num">${s.total_users||0}</div><div class="wp-admin-card-label">Total Users</div></div>
          <div class="wp-admin-card"><div class="wp-admin-card-num">${s.total_applications||0}</div><div class="wp-admin-card-label">Applications</div></div>
          <div class="wp-admin-card"><div class="wp-admin-card-num">${s.total_escrows||0}</div><div class="wp-admin-card-label">Escrows</div></div>
        </div>`;
    }
    else if (currentTab === 'users') {
      const users = data.users || [];
      if (!users.length) { content.innerHTML = '<div class="wp-admin-empty">No users</div>'; return; }
      content.innerHTML = '<div class="wp-admin-list">' + users.map(u => `
        <div class="wp-admin-item"><div class="wp-admin-item-info">
          <div class="wp-admin-item-title">${u.username||'User '+u.id}</div>
          <div class="wp-admin-item-meta">ID: ${u.id} | Role: ${u.role||'-'} | Connects: ${u.balance_connects||0}</div>
        </div></div>`).join('') + '</div>';
    }
    else if (currentTab === 'jobs') {
      const jobs = data.jobs || [];
      if (!jobs.length) { content.innerHTML = '<div class="wp-admin-empty">No jobs</div>'; return; }
      content.innerHTML = '<div class="wp-admin-list">' + jobs.map(j => `
        <div class="wp-admin-item" data-job-id="${j.id}"><div class="wp-admin-item-info">
          <div class="wp-admin-item-title">${j.title||'Job '+j.id}</div>
          <div class="wp-admin-item-meta">${j.username||j.user_id||'-'} &bull; ${j.pi_amount||'-'}&pi; &bull; ${j.status||'open'}</div>
        </div>
        <button class="wp-admin-delete" onclick="WorkProAdmin.deleteJob(${j.id},this)">Delete</button></div>`).join('') + '</div>';
    }
    else if (currentTab === 'escrows') {
      const escrows = data.escrows || [];
      if (!escrows.length) { content.innerHTML = '<div class="wp-admin-empty">No escrows</div>'; return; }
      content.innerHTML = '<div class="wp-admin-list">' + escrows.map(e => `
        <div class="wp-admin-item"><div class="wp-admin-item-info">
          <div class="wp-admin-item-title">Escrow #${e.id||'-'}</div>
          <div class="wp-admin-item-meta">Job: ${e.job_id||'-'} | ${e.amount||'-'}&pi; | ${e.status||'-'}</div>
        </div></div>`).join('') + '</div>';
    }
    else if (currentTab === 'earnings') {
      const earnings = data.payments || [];
      if (!earnings.length) { content.innerHTML = '<div class="wp-admin-empty">No transactions</div>'; return; }
      content.innerHTML = '<div class="wp-admin-list">' + earnings.map(t => `
        <div class="wp-admin-item"><div class="wp-admin-item-info">
          <div class="wp-admin-item-title">${t.type||'Transaction'} &mdash; ${t.amount||0}&pi;</div>
          <div class="wp-admin-item-meta">${t.username||t.user_id||'-'} | ${t.status||'-'} | ${t.created_at||'-'}</div>
        </div></div>`).join('') + '</div>';
    }
  }

  async function deleteJob(id, btn) {
    if (!confirm('Delete job #' + id + '?')) return;
    btn.disabled = true; btn.textContent = '...';
    try { await apiDelete('/api/admin/jobs/' + id); jobsData = jobsData.filter(j => j.id !== id); render(); }
    catch(e) { alert('Error: ' + e.message); btn.disabled = false; btn.textContent = 'Delete'; }
  }

  function show() {
    createPanel(); panelEl.classList.add('active'); document.body.style.overflow = 'hidden';
    currentTab = 'stats';
    panelEl.querySelectorAll('.wp-admin-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === 'stats'));
    jobsData=[]; usersData=[]; escrowsData=[]; earningsData=[]; render();
  }
  function hide() { if (panelEl) { panelEl.classList.remove('active'); document.body.style.overflow = ''; } }

  function addAdminButton() {
    const tryInsert = () => {
      const headers = document.querySelectorAll('header, [class*="header"], [class*="Header"]');
      for (const h of headers) {
        if (h.textContent.includes('Work Pro') || h.textContent.includes('Admin')) {
          const btn = document.createElement('button'); btn.textContent = 'Admin';
          btn.style.cssText = 'background:#10b981;color:white;border:none;border-radius:6px;padding:4px 10px;font-size:13px;cursor:pointer;margin-left:8px;';
          btn.onclick = show; h.appendChild(btn); return true;
        }
      }
      if (!document.getElementById('wp-admin-floating-btn')) {
        const btn = document.createElement('button'); btn.id = 'wp-admin-floating-btn'; btn.textContent = 'Admin';
        btn.style.cssText = 'position:fixed;bottom:80px;right:16px;z-index:99998;background:#10b981;color:white;border:none;border-radius:50%;width:48px;height:48px;font-size:12px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
        btn.onclick = show; document.body.appendChild(btn);
      }
      return true;
    };
    setTimeout(tryInsert, 2000); setTimeout(tryInsert, 5000);
  }

  window.WorkProAdmin = { show, hide, deleteJob };
  const userStr = localStorage.getItem('workpro_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.username === ADMIN_USER || user.role === 'admin' || user.is_admin) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addAdminButton);
        else addAdminButton();
      }
    } catch(e){}
  }
})();