import { apiFetch, saveAuth } from './api';

declare global {
  interface Window { Pi?: any; }
}

export function isPiBrowser(): boolean {
  return typeof window.Pi !== 'undefined';
}

let piInitialized = false;
export function ensurePiInit() {
  if (piInitialized || !isPiBrowser()) return;
  try {
    window.Pi.init({ version: '2.0', sandbox: true });
    piInitialized = true;
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
      (_inc: any) => { /* incomplete payments handled server-side */ }
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
      onReadyForServerApproval: (paymentId: string) => {
        apiFetch(`/api/payments/${paymentId}/approve`, { method: 'POST' }).catch(() => {});
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
