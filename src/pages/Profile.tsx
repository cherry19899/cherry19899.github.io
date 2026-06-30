import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';
import { isPiBrowser, createPiPayment } from '../lib/pi';
import { CONNECT_PACKAGES } from '../lib/constants';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAppCtx();
  const nav = useNavigate();
  const [availability, setAvailability] = useState(true);
  const [buying, setBuying] = useState(false);

  const connects = user?.balance_connects ?? 0;
  const initial = (user?.username || '?')[0].toUpperCase();

  const buyConnects = (qty: number, price: number) => {
    if (!isPiBrowser()) { toast('Open in Pi Browser to buy', 'error'); return; }
    setBuying(true);
    createPiPayment(price, `Buy ${qty} Connects`, { type: 'buy_connects', qty }, {
      onCompleted: () => {
        updateUser({ balance_connects: connects + qty });
        toast(`Added ${qty} connects!`, 'success');
        setBuying(false);
      },
      onCancelled: () => setBuying(false),
      onError: (e: any) => { toast(e.message || 'Failed', 'error'); setBuying(false); },
    });
  };

  if (!user) return null;

  const rows = [
    ...(user?.role === 'admin' ? [{
      icon: ShieldIcon, bg: 'bg-red-100', ic: 'text-red-500',
      label: 'Admin Panel', sub: 'Manage users, jobs, escrows',
      right: <Chevron />,
      onClick: () => nav('/admin'),
    }] : []),
    {
      icon: ClockIcon, bg: 'bg-emerald-100', ic: 'text-emerald-600',
      label: 'Availability', sub: availability ? 'Available for work' : 'Not available',
      right: <Toggle on={availability} onChange={setAvailability} />,
    },
    {
      icon: SendIcon, bg: 'bg-blue-100', ic: 'text-blue-600',
      label: 'Custom Offers',
      right: <span className="text-emerald-500 text-sm font-semibold">View →</span>,
      onClick: () => nav('/my-jobs'),
    },
    {
      icon: SunIcon, bg: 'bg-amber-100', ic: 'text-amber-600',
      label: 'Light Mode',
      right: <Toggle on={true} onChange={() => {}} />,
    },
    {
      icon: GlobeIcon, bg: 'bg-cyan-100', ic: 'text-cyan-600',
      label: 'Language', sub: 'English',
      right: <Chevron />,
    },
    {
      icon: BriefcaseIcon, bg: 'bg-violet-100', ic: 'text-violet-600',
      label: 'Portfolio', right: <Chevron />,
      onClick: () => nav('/my-jobs'),
    },
    {
      icon: ListIcon, bg: 'bg-indigo-100', ic: 'text-indigo-600',
      label: 'My Applications', right: <Chevron />,
      onClick: () => nav('/my-jobs'),
    },
    {
      icon: DownloadIcon, bg: 'bg-teal-100', ic: 'text-teal-600',
      label: 'Install Work Pro?', sub: 'Add to home screen', right: <Chevron />,
      onClick: () => {
        if ((window as any).__pwaInstallPrompt) {
          (window as any).__pwaInstallPrompt.prompt();
        } else {
          toast('Open in Pi Browser and use "Add to Home Screen"', 'info');
        }
      },
    },
    {
      icon: HelpIcon, bg: 'bg-gray-100', ic: 'text-gray-600',
      label: 'FAQ', right: <Chevron />,
      onClick: () => toast('FAQ coming soon', 'info'),
    },
    {
      icon: ShieldIcon, bg: 'bg-gray-100', ic: 'text-gray-600',
      label: 'Terms of Service', right: <Chevron />,
      onClick: () => window.open('/terms-of-service.html', '_blank'),
    },
    {
      icon: ShieldIcon, bg: 'bg-gray-100', ic: 'text-gray-600',
      label: 'Privacy Policy', right: <Chevron />,
      onClick: () => window.open('/privacy-policy.html', '_blank'),
    },
    {
      icon: TrashIcon, bg: 'bg-orange-100', ic: 'text-orange-600',
      label: 'Clear Cache', right: <Chevron />,
      onClick: () => {
        const token = localStorage.getItem('workpro_token');
        const u = localStorage.getItem('workpro_user');
        localStorage.clear();
        if (token) localStorage.setItem('workpro_token', token);
        if (u) localStorage.setItem('workpro_user', u);
        toast('Cache cleared', 'success');
      },
    },
  ];

  return (
    <div className="max-w-lg mx-auto pb-24 animate-fade-in">
      {/* Avatar */}
      <div className="flex flex-col items-center py-6 px-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-emerald-500/20 mb-3 overflow-hidden">
          {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : initial}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
        <p className="text-gray-500 text-sm capitalize">{user.role || 'freelancer'}</p>
      </div>

      {/* Connects */}
      <div className="mx-4 mb-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-gray-900">Connects Balance</p>
            <p className="text-sm text-gray-500">{connects} available</p>
          </div>
          <span className="text-3xl">⚡</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {CONNECT_PACKAGES.map(({ connects: qty, price }) => (
            <button
              key={qty}
              onClick={() => buyConnects(qty, price)}
              disabled={buying}
              className="py-2 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-60 shadow-sm"
            >
              {qty} for {price}π
            </button>
          ))}
        </div>
        {!isPiBrowser() && (
          <p className="text-xs text-gray-400 mt-2 text-center">Open in Pi Browser to buy</p>
        )}
      </div>

      {/* Settings rows */}
      <div className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {rows.map((r, i) => (
          <button
            key={r.label}
            onClick={r.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors ${
              i < rows.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${r.bg}`}>
              <r.icon className={`w-5 h-5 ${r.ic}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{r.label}</p>
              {r.sub && <p className="text-xs text-gray-400">{r.sub}</p>}
            </div>
            {r.right}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <LogOutIcon className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-sm font-medium text-red-500">Logout</span>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center px-4 pb-4">
        <p className="text-xs text-gray-400">Work Pro — Pi Network Freelance Marketplace</p>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(!on); }}
      className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${on ? 'bg-emerald-500' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? 'left-[26px]' : 'left-0.5'}`} />
    </button>
  );
}
function Chevron() {
  return <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>;
}
function ClockIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function SendIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
}
function SunIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function GlobeIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
function BriefcaseIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
}
function ListIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function DownloadIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function HelpIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function ShieldIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function TrashIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function LogOutIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
