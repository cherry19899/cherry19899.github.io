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

export const getApiBase = () => API_BASE;

// ── Jobs ─────────────────────────────────────────────────────────────────────
export const getJobs = (params = '') => apiFetch(`/api/jobs${params ? '?' + params : ''}`);
export const getJob = (id: string | number) => apiFetch(`/api/jobs/${id}`);
export const createJob = (data: any) => apiFetch('/api/jobs', { method: 'POST', body: JSON.stringify(data) });
export const updateJob = (id: string | number, data: any) => apiFetch(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteJob = (id: string | number) => apiFetch(`/api/jobs/${id}`, { method: 'DELETE' });
export const getUserJobs = (userId: string) => apiFetch(`/api/jobs/user/${userId}`);
export const getMyJobs = () => apiFetch('/api/jobs/my');
export const getMyJobsAsFreelancer = () => apiFetch('/api/jobs/as-freelancer');

// ── Applications ─────────────────────────────────────────────────────────────
export async function checkApplication(jobId: string | number) {
  try { return await apiFetch(`/api/jobs/${jobId}/check-applied`); }
  catch { return { applied: false }; }
}

export async function applyToJob(jobId: string | number, data: { message?: string; bid_amount?: number; cover_letter?: string }) {
  try {
    return await apiFetch(`/api/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (e: any) {
    const msg = (e.message || '').toLowerCase();
    if (msg.includes('already applied') || msg.includes('already')) {
      throw Object.assign(new Error('Already applied'), { alreadyApplied: true });
    }
    throw e;
  }
}

export const getApplicationsForJob = (jobId: string | number) =>
  apiFetch(`/api/jobs/${jobId}/applications`);

export const myApplications = () => apiFetch('/api/jobs/as-freelancer');

export const updateApplicationStatus = (appId: string | number, status: string) =>
  apiFetch(`/api/applications/${appId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });

export const hireApplication = (appId: string | number, data: any) =>
  apiFetch(`/api/applications/${appId}/hire`, { method: 'POST', body: JSON.stringify(data) });

// ── Escrow ────────────────────────────────────────────────────────────────────
export const createEscrow = (data: any) =>
  apiFetch('/api/escrows', { method: 'POST', body: JSON.stringify(data) });
export const getEscrows = () => apiFetch('/api/escrows');
export const getEscrow = (id: string | number) => apiFetch(`/api/escrows/${id}`);
export const fundEscrow = (id: string | number, data: any) =>
  apiFetch(`/api/escrows/${id}/fund`, { method: 'POST', body: JSON.stringify(data) });
export const releaseEscrow = (id: string | number) =>
  apiFetch(`/api/escrows/${id}/release`, { method: 'POST' });
export const refundEscrow = (id: string | number) =>
  apiFetch(`/api/escrow/${id}/refund`, { method: 'POST' });
export const cancelEscrow = (id: string | number) =>
  apiFetch(`/api/escrows/${id}/cancel`, { method: 'POST' });

// ── Payments ──────────────────────────────────────────────────────────────────
export const approvePayment = (data: any) =>
  apiFetch('/api/payments/approve', { method: 'POST', body: JSON.stringify(data) });
export const completePayment = (data: any) =>
  apiFetch('/api/payments/complete', { method: 'POST', body: JSON.stringify(data) });

// ── Connects ──────────────────────────────────────────────────────────────────
export const getConnectsBalance = () => apiFetch('/api/connects/balance');
export const buyConnects = (quantity: number, payment_id: string, txid: string) =>
  apiFetch('/api/connects/purchase', { method: 'POST', body: JSON.stringify({ quantity, payment_id, txid }) });

// ── Chat ──────────────────────────────────────────────────────────────────────
export const getChatRooms = () => apiFetch('/api/chat/rooms');
export const getChatRoom = (id: string | number) => apiFetch(`/api/chat/rooms/${id}`);
export const getChatMessages = (roomId: string | number) => apiFetch(`/api/chat/rooms/${roomId}/messages`);
export const sendChatMessage = (roomId: string | number, content: string) =>
  apiFetch(`/api/chat/rooms/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
export const startChat = (data: any) =>
  apiFetch('/api/chat/start', { method: 'POST', body: JSON.stringify(data) });
export const getChatUnread = () => apiFetch('/api/chat/unread');
export const markChatRead = (roomId: string | number) =>
  apiFetch('/api/chat/read-all', { method: 'POST', body: JSON.stringify({ room_id: roomId }) });

// Keep legacy aliases used in old components
export const getConversations = getChatRooms;
export const getMessages = getChatMessages;
export const sendMessage = sendChatMessage;

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = () => apiFetch('/api/notifications');
export const markNotificationsRead = () => apiFetch('/api/notifications/mark-read', { method: 'POST' });
export const getUnreadNotifCount = () => apiFetch('/api/notifications/unread-count');

// ── Reviews ───────────────────────────────────────────────────────────────────
export const submitReview = (data: any) =>
  apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify(data) });
export const getUserReviews = (userId: string) => apiFetch(`/api/reviews/user/${userId}`);
export const getReviewStats = (userId: string) => apiFetch(`/api/reviews/stats/${userId}`);

// ── Users / Profile ───────────────────────────────────────────────────────────
export const getUser = () => apiFetch('/api/users/me');
export const getUserProfile = (id: string) => apiFetch(`/api/users/${id}`);
export const updateUser = (data: any) =>
  apiFetch('/api/users/me', { method: 'PUT', body: JSON.stringify(data) });
export const getPortfolio = (userId: string) => apiFetch(`/api/users/${userId}/portfolio`);

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminStats = () => apiFetch('/api/admin/stats');
export const getAdminUsers = () => apiFetch('/api/admin/users');
export const banUser = (userId: string) =>
  apiFetch(`/api/admin/users/${userId}/block`, { method: 'POST' });
export const unbanUser = (userId: string) =>
  apiFetch(`/api/admin/users/${userId}/unblock`, { method: 'POST' });
export const grantConnects = (userId: string, amount: number) =>
  apiFetch(`/api/admin/users/${userId}/grant-connects`, { method: 'POST', body: JSON.stringify({ amount }) });
