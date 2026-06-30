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

export async function piAuthenticate(): Promise<any> {
  ensurePiInit();
  if (!isPiBrowser()) {
    throw new Error('Open in Pi Browser to authenticate');
  }
  return new Promise((resolve, reject) => {
    window.Pi!.authenticate(
      ['username', 'payments'],
      (inc: any) => {
        apiFetch('/api/auth/incomplete', {
          method: 'POST',
          body: JSON.stringify({ paymentId: inc.paymentId }),
        }).catch(() => {});
      }
    ).then(async (auth: any) => {
      try {
        const data = await apiFetch('/api/auth/pi', {
          method: 'POST',
          body: JSON.stringify({ auth }),
        });
        saveAuth(data.token, data.user);
        resolve(data.user);
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
      onError: callbacks.onError,
    }
  );
}
