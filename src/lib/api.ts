import { API_BASE } from './constants';

function getAuth() {
  const token = localStorage.getItem('workpro_token') || '';
  let user = null;
  try { user = JSON.parse(localStorage.getItem('workpro_user') || 'null'); } catch { user = null; }
  return { token, uid: user?.uid || '' };
}

export async function apiFetch(path: string, opts: RequestInit = {}): Promise<any> {
  const { token, uid } = getAuth();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
    headers['x-user-id'] = uid;
  }
  const res = await fetch(API_BASE + path, { ...opts, headers });
  if (res.status === 401 && path !== '/api/me') {
    clearAuth();
    window.location.hash = '#/login';
    throw new Error('Session expired — please log in again');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || err?.message || res.statusText);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/csv') || ct.includes('text/plain')) return res.text();
  return res.json().catch(() => null);
}

// Upload a file to a chat room (multipart; must NOT set JSON Content-Type).
export async function uploadChatFile(roomId: string | number, file: File): Promise<any> {
  const { token, uid } = getAuth();
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(API_BASE + `/api/chat/rooms/${roomId}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: 'Bearer ' + token, 'x-user-id': uid } : {},
    body: fd,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error || res.statusText);
  }
  return res.json();
}

// Attachment GET requires auth, so fetch with the token and return a blob URL.
export async function fetchAttachmentBlobUrl(path: string): Promise<string> {
  const { token, uid } = getAuth();
  const res = await fetch(API_BASE + path, {
    headers: token ? { Authorization: 'Bearer ' + token, 'x-user-id': uid } : {},
  });
  if (!res.ok) throw new Error('Failed to load attachment');
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function saveAuth(token: string, user: any) {
  localStorage.setItem('workpro_token', token);
  localStorage.setItem('workpro_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('workpro_token');
  localStorage.removeItem('workpro_user');
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('workpro_user') || 'null'); } catch { return null; }
}

export function getToken() {
  return localStorage.getItem('workpro_token') || '';
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const getJobs = (qs = '') => apiFetch(`/api/jobs?${qs}`);
export const getJob  = (id: string | number) => apiFetch(`/api/jobs/${id}`);
export const createJob = (data: any) =>
  apiFetch('/api/jobs', { method: 'POST', body: JSON.stringify(data) });
export const completeJob = (id: string | number) =>
  apiFetch(`/api/jobs/${id}/complete`, { method: 'POST' });
export const submitWork = (id: string | number) =>
  apiFetch(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'submitted' }) });
export const getMyJobs = () => apiFetch('/api/jobs/my');
export const getMyJobsAsFreelancer = () => apiFetch('/api/jobs/as-freelancer');
export const autocompleteJobs = (q: string) =>
  apiFetch(`/api/jobs/search/autocomplete?q=${encodeURIComponent(q)}`);

// ─── Applications ────────────────────────────────────────────────────────────

export const getJobApplications = (jobId: string | number) =>
  apiFetch(`/api/jobs/${jobId}/applications`);
export const getMyApplications = () => apiFetch('/api/applications/my');
export const applyToJob = (jobId: string | number, data: any) =>
  apiFetch(`/api/jobs/${jobId}/apply`, { method: 'POST', body: JSON.stringify({ message: data.proposal }) });
export const acceptApplication = (appId: string | number) =>
  apiFetch(`/api/applications/${appId}/accept`, { method: 'POST' });
export const rejectApplication = (appId: string | number) =>
  apiFetch(`/api/applications/${appId}/reject`, { method: 'POST' });

// ─── Escrow ──────────────────────────────────────────────────────────────────

export const getEscrows = () => apiFetch('/api/escrows');
export const createEscrow = (data: any) =>
  apiFetch('/api/escrows', { method: 'POST', body: JSON.stringify(data) });
export const fundEscrow = (id: number, data: any) =>
  apiFetch(`/api/escrows/${id}/fund`, { method: 'POST', body: JSON.stringify(data) });
export const releaseEscrow = (id: number) =>
  apiFetch(`/api/escrows/${id}/release`, { method: 'POST' });
export const cancelEscrow = (id: number) =>
  apiFetch(`/api/escrows/${id}/cancel`, { method: 'POST' });
export const disputeEscrow = (id: number, reason: string) =>
  apiFetch(`/api/escrows/${id}/dispute`, { method: 'POST', body: JSON.stringify({ reason }) });

// Milestones
export const getMilestones = (id: number) => apiFetch(`/api/escrows/${id}/milestones`);
export const saveMilestones = (id: number, milestones: any[]) =>
  apiFetch(`/api/escrows/${id}/milestones`, { method: 'POST', body: JSON.stringify({ milestones }) });
export const requestMilestone = (escrowId: number, milestoneId: number) =>
  apiFetch(`/api/escrows/${escrowId}/milestone/${milestoneId}/request`, { method: 'POST' });
export const approveMilestone = (escrowId: number, milestoneId: number) =>
  apiFetch(`/api/escrows/${escrowId}/milestone/${milestoneId}/approve`, { method: 'POST' });

// Admin analytics
export const getAdminAnalytics = (type: string, days = 30) =>
  apiFetch(`/api/admin/analytics/${type}?days=${days}`);
export const getAdminRealtime = () => apiFetch('/api/admin/realtime');
export const exportAdminCSV = (table: string) =>
  apiFetch(`/api/admin/export/${table}`);

// Reviews v2
export const getReviewsV2 = (userId: string) => apiFetch(`/api/reviews/v2/user/${userId}`);
export const submitReviewV2 = (data: any) =>
  apiFetch('/api/reviews/v2', { method: 'POST', body: JSON.stringify(data) });

// Saved searches
export const getSavedSearches = () => apiFetch('/api/saved-searches');
export const createSavedSearch = (data: any) =>
  apiFetch('/api/saved-searches', { method: 'POST', body: JSON.stringify(data) });
export const deleteSavedSearch = (id: number) =>
  apiFetch(`/api/saved-searches/${id}`, { method: 'DELETE' });

// Full-text search
export const fulltextSearch = (q: string, extra = '') =>
  apiFetch(`/api/jobs/search/fulltext?q=${encodeURIComponent(q)}&${extra}`);

// ─── Chat ────────────────────────────────────────────────────────────────────

export const getChatRooms = () => apiFetch('/api/chat/rooms');
export const getChatRoom = (roomId: string | number) =>
  apiFetch(`/api/chat/rooms/${roomId}`);
export const getChatMessages = (roomId: string | number) =>
  apiFetch(`/api/chat/rooms/${roomId}/messages`);
export const sendMessage = (roomId: string | number, content: string) =>
  apiFetch(`/api/chat/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
export const startChat = (data: any) =>
  apiFetch('/api/chat/start', { method: 'POST', body: JSON.stringify(data) });
export const markChatRead = (roomId: string | number) =>
  apiFetch('/api/chat/read-all', { method: 'POST', body: JSON.stringify({ room_id: roomId }) });

// ─── Ratings / Reviews ───────────────────────────────────────────────────────

export const submitRating = (data: { to_user_id: string; job_id: number; rating: number; comment?: string }) =>
  apiFetch('/api/ratings', { method: 'POST', body: JSON.stringify(data) });
export const getUserRatings = (userId: string) =>
  apiFetch(`/api/users/${userId}/ratings`);
export const getUserLevel = (userId: string) =>
  apiFetch(`/api/users/${userId}/level`);

// ─── Users ───────────────────────────────────────────────────────────────────

export const getUser = (id: string) => apiFetch(`/api/users/${id}`);
export const updateMe = (data: any) =>
  apiFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) });
export const updateAvailability = (userId: string, available: boolean) =>
  apiFetch(`/api/users/${userId}/availability`, { method: 'POST', body: JSON.stringify({ available }) });

// ─── Notifications ───────────────────────────────────────────────────────────

export const getNotifications = () => apiFetch('/api/notifications');
export const markNotifRead = (id: number) =>
  apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
export const markAllNotifsRead = () =>
  apiFetch('/api/notifications/read-all', { method: 'POST' });

// ─── Admin ───────────────────────────────────────────────────────────────────

export const getAdminStats = () => apiFetch('/api/admin/stats');
export const getAdminUsers = (page = 1) => apiFetch(`/api/admin/users?page=${page}&limit=50`);
export const getAdminJobs = () => apiFetch('/api/admin/jobs/all?limit=100');
export const getAdminEscrows = () => apiFetch('/api/admin/escrows?limit=100');
export const getAdminEarnings = () => apiFetch('/api/admin/earnings');
export const adminDeleteJob = (id: string | number) =>
  apiFetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
export const adminResolveEscrow = (id: string | number, resolution: 'release_to_freelancer' | 'refund_to_client') =>
  apiFetch(`/api/admin/escrows/${id}/resolve`, { method: 'POST', body: JSON.stringify({ action: resolution }) });
export const adminGrantConnects = (userId: string, amount: number) =>
  apiFetch(`/api/admin/users/${userId}/grant-connects`, { method: 'POST', body: JSON.stringify({ amount }) });
export const adminBlockUser = (uid: string, block: boolean) =>
  apiFetch(`/api/admin/users/${uid}/${block ? 'block' : 'unblock'}`, { method: 'POST' });
