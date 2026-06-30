import React, { useState } from 'react';
import { updateUser as apiUpdateUser } from '../lib/api';
import { isPiBrowser, createPiPayment } from '../lib/pi';
import { useAppAuth, useToastCtx } from '../App';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAppAuth();
  const { toast } = useToastCtx();
  const [availability, setAvailability] = useState(true);
  const [buyingConnects, setBuyingConnects] = useState(false);

  const connects = user?.balance_connects ?? 0;

  const handleBuyConnects = (qty: number, piCost: number) => {
    if (!isPiBrowser()) { toast('Open in Pi Browser to buy Connects', 'error'); return; }
    setBuyingConnects(true);
    createPiPayment(piCost, `Buy ${qty} Connects`, { type: 'buy_connects', qty }, {
      onCompleted: (_paymentId: string, _txid: string) => {
        updateUser({ balance_connects: connects + qty });
        toast(`Added ${qty} Connects!`, 'success');
        setBuyingConnects(false);
      },
      onCancelled: () => { setBuyingConnects(false); },
      onError: (e: any) => { toast(e.message || 'Payment failed', 'error'); setBuyingConnects(false); },
    });
  };

  if (!user) return null;

  const initial = (user.username || '?').charAt(0).toUpperCase();

  const settingsRows = [
    {
      icon: ClockIcon, bg: 'bg-emerald-100', color: 'text-emerald-600',
      label: 'Availability', sublabel: availability ? 'Available for work' : 'Not available',
      right: (
        <button
          onClick={() => setAvailability(a => !a)}
          className={`w-12 h-6 rounded-full transition-colors relative ${availability ? 'bg-emerald-500' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${availability ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      ),
    },
    {
      icon: SendIcon, bg: 'bg-blue-100', color: 'text-blue-600',
      label: 'Custom Offers', sublabel: undefined,
      right: <span className="text-emerald-500 text-sm font-semibold">View →</span>,
    },
    {
      icon: MoonIcon, bg: 'bg-purple-100', color: 'text-purple-600',
      label: 'Light Mode', sublabel: undefined,
      right: (
        <div className="w-12 h-6 rounded-full bg-emerald-500 relative">
          <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow" />
        </div>
      ),
    },
    {
      icon: GlobeIcon, bg: 'bg-cyan-100', color: 'text-cyan-600',
      label: 'Language', sublabel: 'Change in header',
      right: undefined,
    },
    {
      icon: BriefcaseIcon, bg: 'bg-amber-100', color: 'text-amber-600',
      label: 'Portfolio', sublabel: undefined,
      right: <ChevronRight />,
    },
    {
      icon: ListIcon, bg: 'bg-indigo-100', color: 'text-indigo-600',
      label: 'My Applications', sublabel: undefined,
      right: <ChevronRight />,
    },
    {
      icon: DownloadIcon, bg: 'bg-teal-100', color: 'text-teal-600',
      label: 'Install Work Pro?', sublabel: 'Add to home screen',
      right: <ChevronRight />,
    },
    {
      icon: HelpIcon, bg: 'bg-gray-100', color: 'text-gray-600',
      label: 'FAQ', sublabel: undefined,
      right: <ChevronRight />,
    },
    {
      icon: ShieldIcon, bg: 'bg-gray-100', color: 'text-gray-600',
      label: 'Terms of Service', sublabel: undefined,
      right: <ChevronRight />,
    },
    {
      icon: TrashIcon, bg: 'bg-orange-100', color: 'text-orange-600',
      label: 'Clear Cache', sublabel: undefined,
      right: <ChevronRight />,
      onClick: () => { localStorage.clear(); toast('Cache cleared', 'success'); },
    },
  ];

  return (
    <div className="max-w-lg mx-auto pb-24 animate-fade-in">
      {/* Avatar + Name */}
      <div className="text-center py-6 px-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500 flex items-center justify-center text-3xl font-bold text-white mb-3 shadow-lg shadow-emerald-500/20">
          {user.avatar
            ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" alt="" />
            : initial}
        </div>
        <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
        <p className="text-gray-500 text-sm capitalize">{user.role || 'freelancer'}</p>
        {user.role === 'admin' && (
          <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold">Admin</span>
        )}
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
          {[[10, 1], [50, 4.5], [100, 8]].map(([qty, pi]) => (
            <button
              key={qty}
              onClick={() => handleBuyConnects(qty as number, pi as number)}
              disabled={buyingConnects}
              className="py-2 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-60 shadow-sm"
            >
              {qty} for {pi}π
            </button>
          ))}
        </div>
        {!isPiBrowser() && (
          <p className="text-xs text-gray-400 mt-2 text-center">Open in Pi Browser to buy Connects</p>
        )}
      </div>

      {/* Settings list */}
      <div className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        {settingsRows.map((row, i) => (
          <button
            key={row.label}
            onClick={row.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors ${i < settingsRows.length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${row.bg} ${row.color}`}>
              <row.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{row.label}</p>
              {row.sublabel && <p className="text-xs text-gray-400">{row.sublabel}</p>}
            </div>
            {row.right}
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-red-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <LogOutIcon className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-sm font-medium text-red-500">Logout</span>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center px-4 pb-4">
        <p className="text-xs text-gray-400">Work Pro v608 — Pi Network Freelance Marketplace</p>
        <button className="text-xs text-emerald-500 mt-1">Privacy Policy</button>
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function SendIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
}
function MoonIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
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
