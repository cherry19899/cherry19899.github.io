import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';
import { getEscrows, releaseEscrow, refundEscrow, approvePayment, completePayment, fundEscrow } from '../lib/api';
import { formatBudget, timeAgo } from '../lib/utils';
import { Badge } from '../components/ui/badge';

interface EscrowScreenProps {
  t: TFunction;
  user: { uid: string; username: string };
}

declare const Pi: any;

type EscrowTab = 'all' | 'as_client' | 'as_freelancer';

export default function EscrowScreen({ t, user }: EscrowScreenProps) {
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EscrowTab>('all');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const d = await getEscrows();
      setEscrows(d.escrows || d || []);
    } catch {}
    finally { setLoading(false); }
  };

  const handleFund = async (escrow: any) => {
    if (typeof Pi === 'undefined') { alert(t('piBrowserRequired') || 'Pi Browser required'); return; }
    setProcessingId(escrow.id);
    try {
      const amount = parseFloat(escrow.amount);
      const metadata = { type: 'escrow_fund', escrow_id: escrow.id, job_id: escrow.job_id };
      await Pi.createPayment(
        { amount, memo: `WorkPro Escrow: ${escrow.job_title || `Job #${escrow.job_id}`}`, metadata },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            await approvePayment({ payment_id: paymentId, metadata });
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            await completePayment({ payment_id: paymentId, txid, metadata });
            await fundEscrow(escrow.id, { payment_id: paymentId, txid });
            await load();
          },
          onCancel: () => setProcessingId(null),
          onError: (e: any) => { setProcessingId(null); alert(e?.message || t('paymentFailed')); },
        }
      );
    } catch (e: any) { alert(e.message); }
    finally { setProcessingId(null); }
  };

  const handleRelease = async (id: number) => {
    if (!confirm(t('confirmRelease') || 'Release funds to freelancer?')) return;
    setProcessingId(id);
    try { await releaseEscrow(id); await load(); }
    catch (e: any) { alert(e.message); }
    finally { setProcessingId(null); }
  };

  const handleRefund = async (id: number) => {
    if (!confirm(t('confirmRefund') || 'Refund escrow to client?')) return;
    setProcessingId(id);
    try { await refundEscrow(id); await load(); }
    catch (e: any) { alert(e.message); }
    finally { setProcessingId(null); }
  };

  const badgeVariant = (s: string): 'default' | 'secondary' | 'success' | 'destructive' => {
    if (s === 'funded') return 'default';
    if (s === 'released') return 'success';
    if (s === 'disputed') return 'destructive';
    if (s === 'cancelled') return 'destructive';
    return 'secondary';
  };

  const TABS: { key: EscrowTab; label: string }[] = [
    { key: 'all', label: t('all') || 'All' },
    { key: 'as_client', label: t('asClient') || 'As Client' },
    { key: 'as_freelancer', label: t('asFreelancer') || 'As Freelancer' },
  ];

  const filtered = escrows.filter(e => {
    if (activeTab === 'as_client') return e.client_uid === user.uid;
    if (activeTab === 'as_freelancer') return e.freelancer_uid === user.uid;
    return true;
  });

  return (
    <div className="animate-fade-in pb-20">
      <div className="sticky top-0 z-10 glass border-b border-border px-4 h-14 flex items-center">
        <h1 className="font-bold text-base">{t('escrow')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-3">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.key ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center pt-16">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">🔒</p>
          <p>{t('noEscrows')}</p>
        </div>
      ) : (
        <div className="space-y-3 px-4 pt-4">
          {filtered.map(e => {
            const isClient = e.client_uid === user.uid;
            const isFreelancer = e.freelancer_uid === user.uid;
            const busy = processingId === e.id;
            return (
              <div key={e.id} className="rounded-xl bg-card border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{e.job_title || `Job #${e.job_id}`}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isClient ? `→ @${e.freelancer_username || e.freelancer_uid}` : `← @${e.client_username || e.client_uid}`}
                    </p>
                  </div>
                  <Badge variant={badgeVariant(e.status)}>{e.status}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-emerald-500">{formatBudget(e.amount)}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(e.created_at)}</span>
                </div>

                {/* Pending: client funds it */}
                {e.status === 'pending' && isClient && (
                  <button
                    onClick={() => handleFund(e)}
                    disabled={busy}
                    className="w-full py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {busy ? t('processing') || '...' : `🔒 ${t('fundEscrow') || 'Fund Escrow'}`}
                  </button>
                )}

                {/* Funded: client can release or refund */}
                {e.status === 'funded' && isClient && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRelease(e.id)}
                      disabled={busy}
                      className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold disabled:opacity-60"
                    >
                      {busy ? '...' : `✓ ${t('release')}`}
                    </button>
                    <button
                      onClick={() => handleRefund(e.id)}
                      disabled={busy}
                      className="flex-1 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-semibold disabled:opacity-60"
                    >
                      {t('refunded') || 'Refund'}
                    </button>
                  </div>
                )}

                {/* Funded: freelancer sees "waiting for release" */}
                {e.status === 'funded' && isFreelancer && (
                  <p className="text-xs text-emerald-500 font-semibold text-center">
                    ⏳ {t('waitingForRelease') || 'Waiting for client to release'}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
