import { API_BASE } from './constants';

function getAuth() {
  const token = localStorage.getItem('workpro_token') || '';
  const user  = JSON.parse(localStorage.getItem('workpro_user') || 'null');
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || err?.message || res.statusText);
  }
  return res.json().catch(() => null);
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
  return JSON.parse(localStorage.getItem('workpro_user') || 'null');
}

// ─── API helpers ────────────────────────────────────────────────────────────

export const getJobs = (qs = '') => apiFetch(`/api/jobs?${qs}`);
export const getJob  = (id: string | number) => apiFetch(`/api/jobs/${id}`);
export const createJob = (data: any) => apiFetch('/api/jobs', { method: 'POST', body: JSON.stringify(data) });
export const applyToJob = (id: string | number, data: any) => apiFetch(`/api/jobs/${id}/apply`, { method: 'POST', body: JSON.stringify(data) });

export const getMyJobs = () => apiFetch('/api/jobs/my');
export const getMyJobsAsFreelancer = () => apiFetch('/api/jobs/hired');

export const getChatRooms = () => apiFetch('/api/chat/rooms');
export const getChatMessages = (roomId: string | number) => apiFetch(`/api/chat/${roomId}/messages`);
export const sendMessage = (roomId: string | number, content: string) =>
  apiFetch(`/api/chat/${roomId}/messages`, { method: 'POST', body: JSON.stringify({ content }) });
export const markChatRead = (roomId: string | number) =>
  apiFetch(`/api/chat/${roomId}/read`, { method: 'POST' });

export const getEscrows = () => apiFetch('/api/escrows');
export const releaseEscrow = (id: number) =>
  apiFetch(`/api/escrows/${id}/release`, { method: 'POST' });
export const cancelEscrow = (id: number) =>
  apiFetch(`/api/escrows/${id}/cancel`, { method: 'POST' });

export const getNotifications = () => apiFetch('/api/notifications');
export const markNotifRead = (id: number) =>
  apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });

export const getAdminStats = () => apiFetch('/api/admin/stats');
export const getAdminUsers = () => apiFetch('/api/admin/users');

export const updateMe = (data: any) =>
  apiFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify(data) });
