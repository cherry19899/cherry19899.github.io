const API_BASE = (window as any).__WP_API_BASE__ || 'https://workpro-api.onrender.com';

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem('workpro_token') || localStorage.getItem('workpro_jwt') || '';
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

let _refreshPromise: Promise<boolean> | null = null;

async function _refreshToken(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = (async () => {
    try {
      const u = JSON.parse(localStorage.getItem('workpro_user') || 'null');
      if (!u?.uid) return false;
      const r = await fetch(`${API_BASE}/api/me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: u.uid, username: u.username || '' }),
      });
      if (!r.ok) return false;
      const d = await r.json();
      if (d?.token) { localStorage.setItem('workpro_token', d.token); return true; }
    } catch {}
    return false;
  })().finally(() => { _refreshPromise = null; });
  return _refreshPromise;
}

export async function apiFetch(path: string, options: RequestInit = {}, _retry = true): Promise<any> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers as Record<string, string> || {}) },
  });
  if (response.status === 401 && _retry) {
    const ok = await _refreshToken();
    if (ok) return apiFetch(path, options, false);
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  const ct = response.headers.get('content-type');
  return ct?.includes('application/json') ? response.json() : response.text();
}

// Jobs
export const getJobs = (params = '') => apiFetch(`/api/jobs${params ? '?' + params : ''}`);
export const getJob = (id: string | number) => apiFetch(`/api/jobs/${id}`);
export const createJob = (data: any) => apiFetch('/api/jobs', { method: 'POST', body: JSON.stringify(data) });
export const updateJob = (id: string | number, data: any) => apiFetch(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteJob = (id: string | number) => apiFetch(`/api/jobs/${id}`, { method: 'DELETE' });

// Applications
export async function checkApplication(jobId: string | number) {
  try { return await apiFetch(`/api/jobs/${jobId}/check-applied`); }
  catch { return { applied: false }; }
}
export async function applyToJob(data: any) {
  try { return await apiFetch('/api/applications', { method: 'POST', body: JSON.stringify(data) }); }
  catch (e: any) {
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('already applied') || msg.includes('already')) {
      const err = Object.assign(new Error('Already applied'), { alreadyApplied: true });
      throw err;
    }
    throw e;
  }
}
export const getApplicationsForJob = (jobId: string | number) => apiFetch(`/api/applications/job/${jobId}`);
export const myApplications = () => apiFetch('/api/applications/my');
export const updateApplicationStatus = (appId: string | number, status: string) =>
  apiFetch(`/api/applications/${appId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const hireApplication = (appId: string | number, data: any) =>
  apiFetch(`/api/applications/${appId}/hire`, { method: 'POST', body: JSON.stringify(data) });

// Escrow
export const createEscrow = (data: any) => apiFetch('/api/escrow', { method: 'POST', body: JSON.stringify(data) });
export const getEscrows = () => apiFetch('/api/escrow');
export const fundEscrow = (escrowId: string | number, data: any) =>
  apiFetch(`/api/escrows/${escrowId}/fund`, { method: 'POST', body: JSON.stringify(data) });
export const releaseEscrow = (escrowId: string | number) =>
  apiFetch(`/api/escrow/${escrowId}/release`, { method: 'POST' });
export const refundEscrow = (escrowId: string | number) =>
  apiFetch(`/api/escrow/${escrowId}/refund`, { method: 'POST' });

// Payments
export const approvePayment = (data: any) => apiFetch('/api/payments/approve', { method: 'POST', body: JSON.stringify(data) });
export const completePayment = (data: any) => apiFetch('/api/payments/complete', { method: 'POST', body: JSON.stringify(data) });

// Chat
export const getConversations = () => apiFetch('/api/chat/conversations');
export const getMessages = (roomId: string | number) => apiFetch(`/api/chat/${roomId}/messages`);
export const sendMessage = (roomId: string | number, content: string) =>
  apiFetch(`/api/chat/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
export const createConversation = (data: any) =>
  apiFetch('/api/chat/conversations', { method: 'POST', body: JSON.stringify(data) });
export const getUnreadCount = () => apiFetch('/api/chat/unread');

// Connects
export const buyConnects = (quantity: number, payment_id: string, txid: string, status: string) =>
  apiFetch('/api/connects/buy', { method: 'POST', body: JSON.stringify({ quantity, payment_id, txid, status }) });

// Reviews
export const submitReview = (data: any) => apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify(data) });
export const getUserReviews = (userId: string) => apiFetch(`/api/reviews/user/${userId}`);
export const getReviewStats = (userId: string) => apiFetch(`/api/reviews/user/${userId}/stats`);

// User / Profile
export const getUser = () => apiFetch('/api/users/me');
export const getUserJobs = (username: string) => apiFetch(`/api/users/${username}/jobs`);
export const updateUser = (data: any) => apiFetch('/api/users/me', { method: 'PUT', body: JSON.stringify(data) });
export const getPortfolio = (userId: string) => apiFetch(`/api/users/${userId}/portfolio`);
export const getNotifications = () => apiFetch('/api/notifications');
export const markNotificationsRead = () => apiFetch('/api/notifications/read', { method: 'POST' });

// Admin
export const getAdminSettings = () => apiFetch('/api/admin/settings');
export const updateAdminSetting = (key: string, value: any) =>
  apiFetch('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ key, value }) });
export const getAdminStats = () => apiFetch('/api/admin/stats');
export const getAdminUsers = () => apiFetch('/api/admin/users');
export const banUser = (userId: string, banned: boolean) =>
  apiFetch(`/api/admin/users/${userId}/ban`, { method: 'POST', body: JSON.stringify({ banned }) });
