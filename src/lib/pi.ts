import { apiFetch, saveAuth } from './api';
import { APP_URL } from './constants';

declare global {
  interface Window { Pi?: any; }
}

export function isPiBrowser(): boolean {
  return typeof window.Pi !== 'undefined';
}

// Sandbox (testnet) by default — must match the backend's SANDBOX_MODE.
// Flip to mainnet later by setting VITE_PI_MODE=production AND SANDBOX_MODE=false together.
export const PI_MODE = import.meta.env.VITE_PI_MODE || 'sandbox';

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
  const url = `${APP_URL}/#/job/${jobId}`;
  try {
    if (navigator.share) {
      await navigator.share({ title, text: title, url });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      window.__wpToast?.('Link copied', 'success');
    }
  } catch { /* user cancelled */ }
}

// Report an incomplete/unfinished Pi payment so the backend can approve/complete or
// cancel it via the Pi API (unblocks the SDK). Uses the no-auth resolver endpoint
// that is purpose-built for onIncompletePaymentFound.
async function reportIncompletePayment(payment: any) {
  const paymentId = payment?.identifier || payment?.paymentId;
  const txid = payment?.transaction?.txid;
  if (!paymentId) return;
  try {
    await apiFetch(`/api/payments/${paymentId}/resolve-incomplete`, {
      method: 'POST',
      body: JSON.stringify({ txid }),
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
      // wallet_address is required for A2U payouts (the backend needs the user's
      // public wallet key to send real Pi to them).
      ['username', 'payments', 'wallet_address'],
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
  // The Pi SDK auth session (and its scopes) only lives for the current page load.
  // A cached JWT keeps the user "logged in" without Pi.authenticate() having run this
  // session, so createPayment would fail with "Cannot create a payment without
  // 'payments' scope". Re-authenticate to (re)establish the payments scope first.
  console.log('[pay] createPiPayment', { amount, memo, meta: metadata, scopeAuthed });
  ensurePaymentsScope()
    .then(() => { console.log('[pay] scope ok → startPayment'); startPayment(amount, memo, metadata, callbacks); })
    .catch((e: any) => { console.error('[pay] scope auth failed', e?.message || e); callbacks.onError(new Error(e?.message || 'Pi authentication failed')); });
}

let scopeAuthed = false;
async function ensurePaymentsScope() {
  if (scopeAuthed) { console.log('[pay] scope cached'); return; }
  console.log('[pay] authenticate(payments)…');
  const auth = await window.Pi!.authenticate(['username', 'payments', 'wallet_address'], (p: any) => reportIncompletePayment(p));
  console.log('[pay] authenticate ok, scopes=', auth?.scopes || auth?.user?.scopes || '?');
  scopeAuthed = true;
}

function startPayment(
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
  window.Pi!.createPayment(
    { amount, memo, metadata },
    {
      onIncompletePaymentFound: (payment: any) => { reportIncompletePayment(payment); },
      onReadyForServerApproval: async (paymentId: string) => {
        try {
          // Send metadata so the backend can store payment type at approve time.
          // Without this, the backend has no metadata and falls back to type='connects'
          // for ALL payments — hire payments accidentally credit connects to the employer.
          await apiFetch(`/api/payments/${paymentId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ metadata }),
          });
          if (callbacks.onApproval) await callbacks.onApproval(paymentId);
        } catch {}
      },
      onReadyForServerCompletion: (paymentId: string, txid: string) => {
        apiFetch(`/api/payments/${paymentId}/complete`, {
          method: 'POST',
          body: JSON.stringify({ txid }),
        }).then(() => callbacks.onCompleted(paymentId, txid)).catch(callbacks.onError);
      },
      onCancel: (_paymentId: string) => { callbacks.onCancelled(); },
      onError: (error: any, _payment: any) => {
        console.error('Pi payment error:', error);
        const msg = error?.message || error?.toString() || 'Payment failed';
        callbacks.onError(new Error(msg));
      },
    }
  );
}
