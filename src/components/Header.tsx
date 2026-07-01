import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppCtx } from '../App';
import { currentLang, setLang, LANGUAGES } from '../lib/i18n';
import { isDark, toggleTheme } from '../lib/theme';

export default function Header({ back }: { back?: boolean }) {
  const nav = useNavigate();
  const { user, notifUnread } = useAppCtx();
  const initial = (user?.username || '?')[0].toUpperCase();
  const [langModal, setLangModal] = useState(false);
  const cur = currentLang();

  return (
    <header className="sticky top-0 z-40 bg-emerald-500 dark:bg-slate-900 w-full shadow-sm">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {back && (
            <button
              onClick={() => nav(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 mr-1"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
          )}
          <button onClick={() => nav('/')} className="text-xl font-bold text-white tracking-tight">
            Work Pro
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Bell */}
          <button
            onClick={() => nav('/notifications')}
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-0.5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {notifUnread > 9 ? '9+' : notifUnread}
              </span>
            )}
          </button>

          {/* Language picker — opens full list */}
          <button
            onClick={() => setLangModal(true)}
            className="h-9 px-2.5 flex items-center gap-1 rounded-full bg-white/20 active:bg-white/30"
          >
            <span className="text-sm leading-none">{LANGUAGES.find(l => l.code === cur)?.flag || '🌐'}</span>
            <span className="text-white text-xs font-bold uppercase">{cur}</span>
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={() => toggleTheme()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30"
          >
            {isDark()
              ? <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>

          {/* Avatar */}
          {user && (
            <button
              onClick={() => nav('/profile')}
              className="w-9 h-9 rounded-full bg-white/30 border-2 border-white/50 flex items-center justify-center text-sm font-bold text-white overflow-hidden"
            >
              {user.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                : initial}
            </button>
          )}
        </div>
      </div>

      {user && (
        <div className="px-4 pb-2 max-w-lg mx-auto">
          <p className="text-white/80 text-sm">
            {user.username} · <span className="capitalize">{user.role || 'freelancer'}</span>
          </p>
        </div>
      )}

      {/* Full language picker */}
      {langModal && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40"
          onClick={() => setLangModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl pb-10 max-h-[75vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mt-4 mb-2 sticky top-0" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white px-5 py-3">🌐 {LANGUAGES.find(l => l.code === cur)?.label}</h2>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { setLangModal(false); setLang(lang.code); }}
                className="w-full flex items-center gap-3 px-5 py-3 text-left active:bg-gray-100 dark:active:bg-slate-700"
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <span className="flex-1 text-sm text-gray-900 dark:text-white">{lang.label}</span>
                {lang.code === cur && (
                  <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
