import { apiFetch, saveAuth } from './api';

declare global {
  interface Window { Pi?: any; }
}

export function isPiBrowser(): boolean {
  return typeof window.Pi !== 'undefined';
}

// Sandbox in dev, real mainnet in production build. Override with VITE_PI_MODE.
const PI_MODE = import.meta.env.VITE_PI_MODE || (import.meta.env.PROD ? 'production' : 'sandbox');

let piInitialized = false;
export function ensurePiInit() {
  if (piInitialized || !isPiBrowser()) return;
  try {
    window.Pi.init({ version: '2.0', sandbox: PI_MODE === 'sandbox' });
    piInitialized = true;
  } catch {}
}

// Share a job. Uses the Web Share API (Pi SDK v2.0 has no share method).
export async function shareJob(jobId: string, title: string) {
  const url = `https://cherry19899.github.io/#/job/${jobId}`;
  try {
    if (navigator.share) {
      await navigator.share({ title, text: title, url });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      window.__wpToast?.('Link copied', 'success');
    }
  } catch { /* user cancelled */ }
}

// Report an incomplete/unfinished Pi payment to the backend so it can be resolved.
async function reportIncompletePayment(payment: any) {
  const paymentId = payment?.identifier || payment?.paymentId;
  const txid = payment?.transaction?.txid;
  if (!paymentId) return;
  try {
    await apiFetch('/api/payments/incomplete', {
      method: 'POST',
      body: JSON.stringify({ paymentId, txid }),
    });
  } catch {}
}

export async function piAuthenticate(onRetry?: (attempt: number) => void): Promise<any> {
  ensurePiInit();
  if (!isPiBrowser()) {
    throw new Error('Open in Pi Browser to authenticate');
  }
  return new Promise((resolve, reject) => {
    window.Pi!.authenticate(
      ['username', 'payments'],
      (payment: any) => { reportIncompletePayment(payment); }
    ).then(async (auth: any) => {
      try {
        // Backend v3.2 uses POST /api/me with Pi credentials directly
        const data = await apiFetch('/api/me', {
          method: 'POST',
          body: JSON.stringify({
            accessToken: auth.accessToken,
            uid: auth.user?.uid,
            username: auth.user?.username,
          }),
        });
        // Response is the user object with token embedded
        const { token, ...user } = data;
        saveAuth(token, user);
        resolve(user);
      } catch (e) { reject(e); }
    }).catch(reject);
  });
}

export function createPiPayment(
  amount: number,
  memo: string,
  metadata: any,
  callbacks: {
    onApproval?: (paymentId: string) => Promise<void>;
    onCompleted: (paymentId: string, txid: string) => void;
    onCancelled: () => void;
    onError: (e: Error) => void;
  }
) {
  ensurePiInit();
  if (!isPiBrowser()) {
    callbacks.onError(new Error('Open in Pi Browser'));
    return;
  }
  window.Pi!.createPayment(
    { amount, memo, metadata },
    {
      onIncompletePaymentFound: (payment: any) => { reportIncompletePayment(payment); },
      onReadyForServerApproval: async (paymentId: string) => {
        try {
          await apiFetch(`/api/payments/${paymentId}/approve`, { method: 'POST' });
          if (callbacks.onApproval) await callbacks.onApproval(paymentId);
        } catch {}
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        apiFetch(`/api/payments/${paymentId}/complete`, {
          method: 'POST',
          body: JSON.stringify({ txid }),
        }).then(() => callbacks.onCompleted(paymentId, txid)).catch(callbacks.onError);
      },
      onCancelled: callbacks.onCancelled,
      onError: (error: any, _payment: any) => {
        console.error('Pi payment error:', error);
        const msg = error?.message || error?.toString() || 'Payment failed';
        callbacks.onError(new Error(msg));
      },
    }
  );
}
