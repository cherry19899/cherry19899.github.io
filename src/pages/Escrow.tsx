import React, { useState, useEffect } from 'react';
import { getEscrows, releaseEscrow, cancelEscrow } from '../lib/api';
import { toast } from '../components/Toast';

interface Escrow { id: number; job_title?: string; amount: number; status: string; client_username?: string; freelancer_username?: string; }

const STATUS_STYLE: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-600',
  funded:   'bg-emerald-100 text-emerald-600',
  released: 'bg-blue-100 text-blue-600',
  refunded: 'bg-gray-100 text-gray-500',
  disputed: 'bg-red-100 text-red-500',
};
const STATUS_ICON: Record<string, string> = { pending:'⏳', funded:'🔒', released:'✅', refunded:'↩️', disputed:'⚠️' };

export default function EscrowPage() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'done'>('active');
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
    try { await releaseEscrow(id); toast('Released! Funds sent.', 'success'); load(); }
    catch (e: any) { toast(e.message || 'Failed', 'error'); }
    finally { setActing(null); }
  };

  const doCancel = async (id: number) => {
    setActing(id);
    try { await cancelEscrow(id); toast('Cancelled. Funds refunded.', 'success'); load(); }
    catch (e: any) { toast(e.message || 'Failed', 'error'); }
    finally { setActing(null); }
  };

  return (
    <div className="max-w-lg mx-auto p-4 animate-fade-in pb-24">
      <div className="flex gap-2 mb-4">
        {(['active', 'done'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              tab === t ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t === 'active' ? 'Active' : 'Completed'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-3">🔒</span>
          <p className="font-semibold text-gray-900">No escrows</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => {
            const statusCls = STATUS_STYLE[e.status] || STATUS_STYLE.pending;
            return (
              <div key={e.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 leading-snug line-clamp-2">
                      {e.job_title || `Escrow #${e.id}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {e.client_username && `@${e.client_username}`}
                      {e.freelancer_username && ` → @${e.freelancer_username}`}
                    </p>
                  </div>
                  <span className="text-emerald-500 font-bold shrink-0">{e.amount} π</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusCls}`}>
                    {STATUS_ICON[e.status]} {e.status}
                  </span>

                  {e.status === 'funded' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => doCancel(e.id)}
                        disabled={acting === e.id}
                        className="text-xs px-3 py-1.5 rounded-xl bg-red-100 text-red-500 font-semibold disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => doRelease(e.id)}
                        disabled={acting === e.id}
                        className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-semibold disabled:opacity-60"
                      >
                        Release
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
