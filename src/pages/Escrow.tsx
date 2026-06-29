import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Unlock, 
  AlertTriangle,
  Loader2,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Escrow as EscrowType } from '../types';

export default function EscrowPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const { data: escrows, isLoading } = useQuery({
    queryKey: ['escrows'],
    queryFn: async () => {
      const { data } = await api.get('/api/escrows');
      return (data.escrows || data) as EscrowType[];
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (escrowId: string) => {
      const { data } = await api.post(`/api/escrows/${escrowId}/release`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
    },
  });

  const disputeMutation = useMutation({
    mutationFn: async (escrowId: string) => {
      const { data } = await api.post(`/api/escrows/${escrowId}/dispute`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
    },
  });

  const filtered = (escrows || []).filter((e: EscrowType) => 
    activeTab === 'active' 
      ? ['pending', 'funded', 'disputed'].includes(e.status)
      : ['released'].includes(e.status)
  );

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    pending: { icon: Clock, color: 'text-amber-400', label: 'Pending' },
    funded: { icon: Lock, color: 'text-emerald-400', label: 'Funded' },
    released: { icon: Unlock, color: 'text-blue-400', label: 'Released' },
    disputed: { icon: AlertTriangle, color: 'text-red-400', label: 'Disputed' },
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-slate-800 text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-white">Escrow</h1>
      </div>

      <div className="p-4">
        {/* Info Card */}
        <div className="card mb-4 bg-gradient-to-r from-emerald-500/10 to-emerald-700/10 border-emerald-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Secure Payments</h3>
              <p className="text-sm text-slate-400 mt-1">
                Funds are held in escrow until work is completed. Both parties are protected.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'active' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'completed' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Escrows List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="text-emerald-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <Shield size={32} className="mx-auto text-slate-600 mb-3" />
            <p className="text-slate-400">No escrow transactions</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((escrow: EscrowType) => {
              const config = statusConfig[escrow.status] || statusConfig.pending;
              const Icon = config.icon;
              return (
                <div key={escrow.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className={config.color} />
                      <span className={`font-medium ${config.color}`}>{config.label}</span>
                    </div>
                    <span className="text-emerald-400 font-bold">{escrow.amount} Pi</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-3">Job #{escrow.job_id}</p>
                  {escrow.status === 'funded' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => releaseMutation.mutate(escrow.id)}
                        disabled={releaseMutation.isPending}
                        className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1"
                      >
                        {releaseMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Release
                      </button>
                      <button 
                        onClick={() => disputeMutation.mutate(escrow.id)}
                        disabled={disputeMutation.isPending}
                        className="btn-danger flex-1 text-sm py-2 flex items-center justify-center gap-1"
                      >
                        {disputeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                        Dispute
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
