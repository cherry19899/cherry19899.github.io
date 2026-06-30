import { apiFetch } from './api';
import { API_BASE, OWNER_USERNAME } from './constants';
import type { User } from '../types';

export const isPiBrowser = (): boolean =>
  typeof window !== 'undefined' && typeof window.Pi !== 'undefined';

let _initDone = false;

/** Initialise Pi SDK with sandbox:true (testnet). Safe to call multiple times. */
export function initPiSdk(): void {
  if (_initDone || !isPiBrowser()) return;
  _initDone = true;
  try {
    window.Pi.init({
      version: '2.0',
      sandbox: true,               // TESTNET — always true
      onIncompletePaymentFound: handleIncompletePayment,
    });
    window._piSdkReady = true;
    console.log('[Pi] SDK init — sandbox:true (testnet)');
  } catch (e: any) {
    console.error('[Pi] init error:', e?.message);
  }
}

async function handleIncompletePayment(payment: any): Promise<void> {
  try {
    const pid = payment?.identifier || payment?.paymentId || payment?.id;
    if (!pid) return;
    const st = payment?.status;
    const completed = typeof st === 'string'
      ? (st === 'developer_completed' || st === 'completed')
      : !!(st?.developer_completed || st?.transaction_verified);
    const endpoint = completed ? '/resolve-complete' : '/cancelled';
    const token = localStorage.getItem('workpro_token') || '';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    await fetch(`${API_BASE}/api/payments/${pid}${endpoint}`, {
      method: 'POST', headers,
    }).catch(() => {});
  } catch {}
}

export async function piAuthenticate(): Promise<User> {
  if (!isPiBrowser()) {
    throw new Error('Pi Browser required. Please open this app in Pi Browser.');
  }
  initPiSdk();

  // Wait up to 8 s for Pi.init to complete
  await new Promise<void>((res, rej) => {
    if (window._piSdkReady) { res(); return; }
    let n = 0;
    const id = setInterval(() => {
      if (window._piSdkReady) { clearInterval(id); res(); }
      else if (++n > 80) { clearInterval(id); rej(new Error('Pi SDK timeout')); }
    }, 100);
  });

  const auth = await window.Pi.authenticate(
    ['username', 'payments'],
    handleIncompletePayment
  );
  if (!auth?.user?.uid) throw new Error('Pi authentication failed');

  const uid = auth.user.uid.startsWith('pi_')
    ? auth.user.uid
    : `pi_${auth.user.uid}`;

  const data = await apiFetch('/api/me', {
    method: 'POST',
    body: JSON.stringify({ uid, username: auth.user.username, accessToken: auth.accessToken }),
  });

  if (data?.token) {
    localStorage.setItem('workpro_token', data.token);
    localStorage.setItem('workpro_jwt', data.token);
  }

  const user: User = {
    id: uid,
    uid,
    username: auth.user.username,
    role: data?.role || 'freelancer',
    bio: data?.bio || '',
    skills: data?.skills || '',
    avatar: data?.avatar || '',
    kyc_verified: data?.kyc_verified || false,
    balance_pi: Number(data?.balance_pi) || 0,
    balance_connects: Number(data?.balance_connects ?? data?.connects) || 0,
    rating: Number(data?.rating) || 0,
  };
  if (user.username?.toLowerCase() === OWNER_USERNAME) user.role = 'admin';

  localStorage.setItem('workpro_user', JSON.stringify(user));
  localStorage.setItem('workpro_uid', uid);
  return user;
}

export interface PiPaymentCallbacks {
  onApproved?: (paymentId: string) => void;
  onCompleted?: (paymentId: string, txid: string) => void;
  onCancelled?: (paymentId: string) => void;
  onError?: (err: Error) => void;
}

export function createPiPayment(
  amount: number,
  memo: string,
  metadata: Record<string, any>,
  cbs: PiPaymentCallbacks
): void {
  window.Pi.createPayment(
    { amount, memo, metadata },
    {
      onReadyForServerApproval: (paymentId) => {
        apiFetch('/api/payments/approve', {
          method: 'POST',
          body: JSON.stringify({ paymentId }),
        }).then(() => cbs.onApproved?.(paymentId)).catch(console.error);
      },
      onReadyForServerCompletion: (paymentId, txid) => {
        apiFetch('/api/payments/complete', {
          method: 'POST',
          body: JSON.stringify({ paymentId, txid }),
        }).then(() => cbs.onCompleted?.(paymentId, txid)).catch(console.error);
      },
      onCancel: (paymentId) => cbs.onCancelled?.(paymentId),
      onError: (error) => cbs.onError?.(error),
    }
  );
}
