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

export const initPi = async () => {
  if (!isPiBrowser()) {
    console.warn('Pi SDK not available');
    return false;
  }
  try {
    const sandbox = import.meta.env.VITE_PI_SANDBOX === 'true';
    await window.Pi.init({ version: '2.0', sandbox });
    return true;
  } catch (err) {
    console.error('Pi init failed:', err);
    return false;
  }
};

export const authenticatePi = async () => {
  if (!isPiBrowser()) {
    throw new Error('Pi Browser required');
  }

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
  if (!isPiBrowser()) throw new Error('Pi Browser required');

  const payment = await window.Pi.createPayment({
    amount,
    memo,
    metadata: { type: 'escrow' },
  });

  return payment;
};

export { isPiBrowser };
