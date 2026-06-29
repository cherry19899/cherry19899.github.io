import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Users, 
  Briefcase, 
  Shield, 
  BarChart3,
  Loader2,
  Ban,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'users' | 'jobs' | 'analytics'>('users');

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-4 text-center">
        <Shield size={40} className="mx-auto text-red-400 mb-3" />
        <h2 className="text-lg font-bold text-white">Access Denied</h2>
        <p className="text-slate-400 mt-2">Admin only</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4">Go Home</button>
      </div>
    );
  }

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/users');
      return data.users || data || [];
    },
    enabled: tab === 'users',
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/jobs');
      return data.jobs || data || [];
    },
    enabled: tab === 'jobs',
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/api/admin/analytics');
      return data;
    },
    enabled: tab === 'analytics',
  });

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-slate-800 text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-emerald-400" />
          <h1 className="text-lg font-bold text-white">Admin Panel</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'users', icon: Users, label: 'Users' },
            { key: 'jobs', icon: Briefcase, label: 'Jobs' },
            { key: 'analytics', icon: BarChart3, label: 'Analytics' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                tab === t.key 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div>
            {usersLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="text-emerald-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {(users || []).map((u: any) => (
                  <div key={u.id} className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="text-emerald-400 font-bold">{u.username?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{u.username}</p>
                      <p className="text-xs text-slate-400">{u.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      u.is_blocked ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {u.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {tab === 'jobs' && (
          <div>
            {jobsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="text-emerald-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {(jobs || []).map((j: any) => (
                  <div key={j.id} className="card">
                    <p className="font-medium text-white">{j.title}</p>
                    <p className="text-xs text-slate-400">{j.posted_by_name || j.posted_by} · {j.budget} Pi</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="card text-center">
                <p className="text-2xl font-bold text-emerald-400">{stats.total_users || 0}</p>
                <p className="text-xs text-slate-400">Total Users</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-emerald-400">{stats.total_jobs || 0}</p>
                <p className="text-xs text-slate-400">Total Jobs</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-emerald-400">{stats.total_escrows || 0}</p>
                <p className="text-xs text-slate-400">Escrows</p>
              </div>
              <div className="card text-center">
                <p className="text-2xl font-bold text-emerald-400">{stats.total_payments || 0}</p>
                <p className="text-xs text-slate-400">Payments</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
