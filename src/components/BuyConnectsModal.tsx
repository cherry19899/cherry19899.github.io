import React, { useState } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { buyConnects } from '../lib/api';

interface BuyConnectsModalProps {
  t: TFunction;
  onClose: () => void;
  onSuccess?: (qty: number) => void;
}

const PACKAGES = [
  { qty: 10, price: 1 },
  { qty: 30, price: 2.5, best: true },
  { qty: 100, price: 7 },
];

declare const Pi: any;

export default function BuyConnectsModal({ t, onClose, onSuccess }: BuyConnectsModalProps) {
  const [selected, setSelected] = useState(1);
  const [loading, setLoading] = useState(false);

  const pkg = PACKAGES[selected];

  const handleBuy = async () => {
    setLoading(true);
    try {
      if (typeof Pi === 'undefined' || typeof Pi.createPayment !== 'function') {
        alert(t('piBrowserRequired') || 'Pi Browser required');
        return;
      }
      await Pi.createPayment(
        { amount: pkg.price, memo: `WorkPro: ${pkg.qty} Connects`, metadata: { type: 'connects', qty: pkg.qty } },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            await fetch('/api/payments/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ payment_id: paymentId }),
            });
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            await buyConnects(pkg.qty, paymentId, txid, 'completed');
            const current = parseInt(localStorage.getItem('workpro_connects') || '0');
            localStorage.setItem('workpro_connects', String(current + pkg.qty));
            window.dispatchEvent(new Event('storage'));
            onSuccess?.(pkg.qty);
            onClose();
          },
          onCancel: () => setLoading(false),
          onError: () => setLoading(false),
        }
      );
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg bg-card rounded-t-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold">{t('buyConnects')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {PACKAGES.map((p, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-colors ${
                selected === i ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-muted'
              }`}
            >
              {p.best && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-emerald-500 text-white px-2 rounded-full">
                  {t('bestValue') || 'Best value'}
                </span>
              )}
              <span className="text-2xl font-black">{p.qty}</span>
              <span className="text-xs text-muted-foreground">connects</span>
              <span className="text-sm font-bold text-emerald-500 mt-1">π{p.price}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleBuy}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold bg-emerald-500 text-white disabled:opacity-60"
        >
          {loading ? t('processing') : `${t('buy') || 'Buy'} π${pkg.price}`}
        </button>
        <button onClick={onClose} className="w-full py-2 text-muted-foreground text-sm">
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
