import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { approvePayment, completePayment } from '../lib/api';

interface PiPaymentModalProps {
  t: TFunction;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  onSuccess: (paymentId: string, txid: string) => void;
  onCancel: () => void;
}

declare const Pi: any;

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function PiPaymentModal({ t, amount, memo, metadata, onSuccess, onCancel }: PiPaymentModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    initPayment();
  }, []);

  const initPayment = async () => {
    setStatus('loading');
    try {
      if (typeof Pi === 'undefined') {
        setStatus('error');
        setError(t('piBrowserRequired'));
        return;
      }
      await Pi.createPayment(
        { amount, memo, metadata },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            await approvePayment({ payment_id: paymentId, metadata });
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            await completePayment({ payment_id: paymentId, txid, metadata });
            setStatus('success');
            onSuccess(paymentId, txid);
          },
          onCancel: onCancel,
          onError: (err: any) => {
            setStatus('error');
            setError(err?.message || t('paymentFailed'));
          },
        }
      );
    } catch (e: any) {
      setStatus('error');
      setError(e.message || t('paymentFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-4 text-center">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">{t('piPaymentHint')}</p>
            <p className="font-bold text-lg">π{amount}</p>
            <p className="text-xs text-muted-foreground">{memo}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="text-4xl">✅</div>
            <p className="font-bold">{t('paymentSuccess')}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl">❌</div>
            <p className="font-bold text-destructive">{t('paymentFailed')}</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-3">
              <button onClick={initPayment}
                className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold">
                {t('retry')}
              </button>
              <button onClick={onCancel}
                className="flex-1 py-2 rounded-xl bg-muted text-foreground font-bold">
                {t('cancel')}
              </button>
            </div>
          </>
        )}
        {status === 'idle' && (
          <button onClick={initPayment}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold">
            {t('payNow')} π{amount}
          </button>
        )}
      </div>
    </div>
  );
}
