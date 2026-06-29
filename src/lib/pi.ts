import api from './api';

declare global {
  interface Window {
    Pi: {
      init: (config: { version: string; sandbox?: boolean }) => Promise<void>;
      authenticate: (
        scopes: string[],
        onIncompletePayment: (payment: any) => void
      ) => Promise<{
        accessToken: string;
        user: {
          uid: string;
          username: string;
        };
      }>;
      createPayment: (payment: any) => Promise<any>;
      completePayment: (paymentId: string) => Promise<any>;
    };
  }
}

const isPiBrowser = () => typeof window !== 'undefined' && window.Pi != null;

// Poll until window.Pi is available (SDK loads synchronously but in case of delay)
const waitForPi = (timeoutMs = 10000): Promise<boolean> =>
  new Promise((resolve) => {
    if (isPiBrowser()) { resolve(true); return; }
    const start = Date.now();
    const id = setInterval(() => {
      if (isPiBrowser()) { clearInterval(id); resolve(true); }
      else if (Date.now() - start > timeoutMs) { clearInterval(id); resolve(false); }
    }, 100);
  });

let piInitPromise: Promise<boolean> | null = null;

export const initPi = async () => {
  const ready = await waitForPi();
  if (!ready) {
    console.warn('[Pi] SDK not available — not in Pi Browser');
    return false;
  }
  // Singleton: prevent multiple parallel init() calls
  if (piInitPromise) return piInitPromise;

  piInitPromise = (async () => {
    try {
      const sandbox = /github\.io|localhost|127\.0\.0\.1/.test(window.location.hostname);
      const token = localStorage.getItem('workpro_token') || '';
      await window.Pi.init({
        version: '2.0',
        sandbox,
        onIncompletePayment: (p: any) => {
          try {
            const pid = p && (p.identifier || p.paymentId || p.id);
            if (!pid) return;
            const st = p.status;
            const done = typeof st === 'string'
              ? st === 'developer_completed' || st === 'completed'
              : !!(st && (st.developer_completed || st.transaction_verified));
            const ep = done ? '/resolve-complete' : '/cancelled';
            const h: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) h['Authorization'] = `Bearer ${token}`;
            fetch(`https://workpro-api.onrender.com/api/payments/${pid}${ep}`, {
              method: 'POST', headers: h,
            }).catch(() => {});
          } catch {}
        },
      } as any);
      console.log('[Pi] SDK initialized, sandbox:', sandbox);
      return true;
    } catch (err: any) {
      console.error('[Pi] init failed:', err.message || err);
      return false;
    }
  })();

  return piInitPromise;
};

export const ensurePiInit = async () => {
  const ok = await initPi();
  if (!ok) throw new Error('Pi Browser required');
};

export const authenticatePi = async () => {
  await ensurePiInit();

  const auth = await window.Pi.authenticate(
    ['username', 'payments'],
    (payment) => {
      console.log('Incomplete payment:', payment);
    }
  );

  // Normalize user ID
  let uid = auth.user.uid;
  if (!uid.startsWith('pi_')) {
    uid = `pi_${uid}`;
  }

  // Register/login with backend
  const { data } = await api.post('/api/me', {
    accessToken: auth.accessToken,
    uid: uid,
    username: auth.user.username,
  });

  localStorage.setItem('workpro_token', data.token);
  localStorage.setItem('workpro_user', JSON.stringify(data.user));

  return data.user;
};

export const createPiPayment = async (amount: number, memo: string) => {
  await ensurePiInit();

  const payment = await window.Pi.createPayment({
    amount,
    memo,
    metadata: { type: 'escrow' },
  });

  return payment;
};

export { isPiBrowser };
