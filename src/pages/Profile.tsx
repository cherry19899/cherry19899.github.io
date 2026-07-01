import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';
import { isPiBrowser, createPiPayment } from '../lib/pi';
import { CONNECT_PACKAGES } from '../lib/constants';
import { t, currentLang, setLang, LANGUAGES } from '../lib/i18n';
import { isDark, toggleTheme } from '../lib/theme';
import BadgeChip from '../components/BadgeChip';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAppCtx();
  const nav = useNavigate();
  const [availability, setAvailability] = useState(true);
  const [buying, setBuying] = useState(false);
  const [langModal, setLangModal] = useState(false);
  const langOpenedAt = useRef(0);

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
      onError: (e: any) => { toast(e?.message || e?.toString() || 'Payment failed', 'error'); setBuying(false); },
    });
  };

  if (!user) return null;

  const tr = t();
  const totalReviews = (user as any).total_reviews ?? 0;
  const balancePi = (user as any).balance_pi ?? '0.00';

  const rows = [
    ...(user?.role === 'admin' ? [{
      icon: ShieldIcon, bg: 'bg-red-100', ic: 'text-red-500',
      label: tr.admin, sub: tr.adminSub,
      right: <Chevron />, onClick: () => nav('/admin'),
    }] : []),
    {
      icon: ClockIcon, bg: 'bg-emerald-100', ic: 'text-emerald-600',
      label: tr.availability, sub: availability ? tr.availableForWork : tr.notAvailable,
      right: <Toggle on={availability} onChange={setAvailability} />,
    },
    {
      icon: SendIcon, bg: 'bg-blue-100', ic: 'text-blue-600',
      label: tr.customOffers,
      right: <span className="text-emerald-500 text-sm font-semibold">View →</span>,
      onClick: () => nav('/my-jobs'),
    },
    {
      icon: SunIcon, bg: 'bg-amber-100', ic: 'text-amber-600',
      label: tr.lightMode,
      sub: isDark() ? 'Тёмная тема' : 'Светлая тема',
      right: <Toggle on={!isDark()} onChange={() => toggleTheme()} />,
    },
    {
      icon: GlobeIcon, bg: 'bg-cyan-100', ic: 'text-cyan-600',
      label: tr.language,
      sub: LANGUAGES.find(l => l.code === currentLang())?.label || currentLang(),
      right: <Chevron />,
      onClick: () => { langOpenedAt.current = Date.now(); setLangModal(true); },
    },
    {
      icon: BriefcaseIcon, bg: 'bg-violet-100', ic: 'text-violet-600',
      label: tr.portfolio, right: <Chevron />,
      onClick: () => nav('/my-jobs'),
    },
    {
      icon: ListIcon, bg: 'bg-indigo-100', ic: 'text-indigo-600',
      label: tr.myApplications, right: <Chevron />,
      onClick: () => nav('/my-jobs'),
    },
    {
      icon: DownloadIcon, bg: 'bg-teal-100', ic: 'text-teal-600',
      label: tr.install, sub: tr.installSub, right: <Chevron />,
      onClick: () => {
        if (window.__pwaInstallPrompt) {
          window.__pwaInstallPrompt.prompt();
        } else {
          toast('Open in Pi Browser and use "Add to Home Screen"', 'info');
        }
      },
    },
    {
      icon: HelpIcon, bg: 'bg-gray-100', ic: 'text-gray-600',
      label: tr.faq, right: <Chevron />,
      onClick: () => toast('FAQ coming soon', 'info'),
    },
    {
      icon: ShieldIcon, bg: 'bg-gray-100', ic: 'text-gray-600',
      label: tr.terms, right: <Chevron />,
      onClick: () => window.open('/terms-of-service.html', '_blank'),
    },
    {
      icon: ShieldIcon, bg: 'bg-gray-100', ic: 'text-gray-600',
      label: tr.privacy, right: <Chevron />,
      onClick: () => window.open('/privacy-policy.html', '_blank'),
    },
    {
      icon: TrashIcon, bg: 'bg-orange-100', ic: 'text-orange-600',
      label: tr.clearCache, right: <Chevron />,
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
    <div className="max-w-lg mx-auto pb-24 animate-fade-in bg-white dark:bg-slate-900 min-h-screen">

      {/* ── Profile card with gradient ── */}
      <div className="mx-4 mt-4 mb-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-5 shadow-sm border border-emerald-100 dark:border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-2xl font-bold text-emerald-600 dark:text-emerald-400 shrink-0 overflow-hidden shadow-md">
            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : initial}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{user.username}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {user.role === 'admin' ? 'Админ' : 'Фрилансер'} · {availability ? tr.available : tr.notAvailableShort}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {/* Dynamic badges from DB */}
              {((user as any).badges as string[] | undefined)?.map(b => (
                <BadgeChip key={b} badge={b} />
              ))}
              {/* Fallback if no badges yet */}
              {!((user as any).badges as string[] | undefined)?.length && (
                <BadgeChip badge="rising_talent" />
              )}
              {(user as any).kyc_verified && <BadgeChip badge="verified" />}
            </div>
          </div>
        </div>

        {/* Stats: 3 cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-3 text-center">
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{tr.connects}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{connects}</p>
            <button
              onClick={() => { const pkg = CONNECT_PACKAGES[0]; buyConnects(pkg.connects, pkg.price); }}
              disabled={buying}
              className="mt-2 bg-emerald-500 text-white rounded-full px-4 py-1 text-xs font-semibold disabled:opacity-60"
            >
              {tr.buy}
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-3 text-center">
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{tr.balance}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{balancePi}<span className="text-sm text-gray-400 dark:text-slate-500"> π</span></p>
            {!isPiBrowser() && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Pi Browser</p>}
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-3 text-center">
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">{tr.reviews}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalReviews}</p>
            <p className="text-[10px] text-amber-500 mt-1">{'★'.repeat(Math.min(5, Math.max(0, Math.round((user as any).rating ?? 0))))}</p>
          </div>
        </div>
      </div>

      {/* ── Settings rows ── */}
      <div className="mx-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden mb-4">
        {rows.map((r, i) => (
          <button
            key={r.label}
            onClick={r.onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
              i < rows.length - 1 ? 'border-b border-gray-50 dark:border-slate-700' : ''
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${r.bg}`}>
              <r.icon className={`w-5 h-5 ${r.ic}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{r.label}</p>
              {r.sub && <p className="text-xs text-gray-400 dark:text-slate-500">{r.sub}</p>}
            </div>
            {r.right}
          </button>
        ))}
      </div>

      {/* ── Logout ── */}
      <div className="mx-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden mb-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
            <LogOutIcon className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-sm font-medium text-red-500">{tr.logout}</span>
        </button>
      </div>

      <div className="text-center px-4 pb-4">
        <p className="text-xs text-gray-400 dark:text-slate-600">Work Pro — Pi Network Freelance Marketplace</p>
      </div>

      {/* Language picker modal */}
      {langModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => { if (Date.now() - langOpenedAt.current > 400) setLangModal(false); }}>
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl pb-10 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mt-4 mb-4" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white px-5 mb-3">{tr.language}</h2>
            <div className="max-h-80 overflow-y-auto">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { if (Date.now() - langOpenedAt.current < 400) return; setLangModal(false); setLang(lang.code); }}
                  className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left ${
                    currentLang() === lang.code
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className={`text-sm font-medium flex-1 ${currentLang() === lang.code ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                    {lang.label}
                  </span>
                  {currentLang() === lang.code && (
                    <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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
