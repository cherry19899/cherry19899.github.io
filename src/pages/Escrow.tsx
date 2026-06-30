import React, { useState, useEffect } from 'react';
import { getEscrows, releaseEscrow, cancelEscrow } from '../lib/api';
import type { Escrow } from '../types';
import { useToastCtx } from '../App';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Skeleton';

type Tab = 'active' | 'done';

const STATUS_ICON: Record<string, string> = {
  pending: '⏳',
  funded: '🔒',
  released: '✅',
  refunded: '↩️',
  disputed: '⚠️',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-amber-400',
  funded: 'text-emerald-400',
  released: 'text-blue-400',
  refunded: 'text-slate-400',
  disputed: 'text-red-400',
};

export default function EscrowPage() {
  const { toast } = useToastCtx();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');
  const [acting, setActing] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    getEscrows()
      .then((d: any) => setEscrows(d?.escrows || d || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = escrows.filter(e =>
    tab === 'active'
      ? ['pending', 'funded', 'disputed'].includes(e.status)
      : ['released', 'refunded'].includes(e.status)
  );

  const doRelease = async (id: number) => {
    setActing(id);
    try {
      await releaseEscrow(id);
      toast('Escrow released! Funds sent to freelancer.', 'success');
      load();
    } catch (e: any) { toast(e.message || 'Failed to release', 'error'); }
    finally { setActing(null); }
  };

  const doCancel = async (id: number) => {
    setActing(id);
    try {
      await cancelEscrow(id);
      toast('Escrow cancelled.', 'success');
      load();
    } catch (e: any) { toast(e.message || 'Failed to cancel', 'error'); }
    finally { setActing(null); }
  };

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 animate-fade-in">
      {/* Info banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4 flex items-start gap-3">
        <span className="text-2xl">🔒</span>
        <div>
          <p className="font-semibold text-white text-sm">Secure Payments</p>
          <p className="text-xs text-slate-400 mt-0.5">Funds are held in escrow until you approve delivery. Both parties are protected.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['active', 'done'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              tab === t ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {t === 'active' ? `Active (${escrows.filter(e => ['pending','funded','disputed'].includes(e.status)).length})` : 'Completed'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔒" title={tab === 'active' ? 'No active escrows' : 'No completed escrows'} subtitle="Escrows are created when you hire a freelancer" />
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{STATUS_ICON[e.status] || '⏳'}</span>
                    <span className={`font-semibold text-sm ${STATUS_COLOR[e.status] || 'text-slate-400'}`}>
                      {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                    </span>
                  </div>
                  {e.job_title && <p className="text-white font-semibold text-sm mt-1">{e.job_title}</p>}
                  <p className="text-xs text-slate-500 mt-0.5">
                    {e.client_name && `Client: @${e.client_name}`}
                    {e.client_name && e.freelancer_name && ' · '}
                    {e.freelancer_name && `Freelancer: @${e.freelancer_name}`}
                  </p>
                </div>
                <span className="text-emerald-400 font-bold text-lg shrink-0">{e.amount} π</span>
              </div>

              {e.status === 'funded' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => doRelease(e.id)}
                    disabled={acting === e.id}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-bold disabled:opacity-60"
                  >
                    {acting === e.id ? '…' : '✓ Release Payment'}
                  </button>
                  <button
                    onClick={() => doCancel(e.id)}
                    disabled={acting === e.id}
                    className="flex-1 py-2.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 text-sm font-semibold disabled:opacity-60"
                  >
                    Dispute
                  </button>
                </div>
              )}
              {e.status === 'pending' && (
                <p className="text-xs text-amber-400">Waiting for freelancer to fund escrow via Pi payment…</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
