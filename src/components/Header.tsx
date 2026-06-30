import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';

export default function Header() {
  const { user, notifUnread } = useAppAuth();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 h-14 flex items-center justify-between max-w-lg mx-auto w-full">
      <button onClick={() => nav('/')} className="font-black text-xl tracking-tight">
        <span className="text-emerald-400">Work</span>
        <span className="text-white">Pro</span>
      </button>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          onClick={() => nav('/notifications')}
          className="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">
              {notifUnread > 9 ? '9+' : notifUnread}
            </span>
          )}
        </button>

        {/* Avatar */}
        {user && (
          <button
            onClick={() => nav('/profile')}
            className="w-9 h-9 rounded-full overflow-hidden bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-sm font-bold text-emerald-400"
          >
            {user.avatar
              ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
              : (user.username || '?')[0].toUpperCase()}
          </button>
        )}
      </div>
    </header>
  );
}
