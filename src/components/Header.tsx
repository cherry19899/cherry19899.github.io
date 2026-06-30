import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../App';

export default function Header() {
  const { user, notifUnread } = useAppAuth();
  const nav = useNavigate();

  const initial = (user?.username || '?')[0].toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-500 to-emerald-600 w-full">
      <div className="px-4 h-14 flex items-center justify-between max-w-lg mx-auto">
        <button onClick={() => nav('/')} className="font-bold text-xl text-white">
          Work Pro
        </button>

        <div className="flex items-center gap-2">
          {/* Bell */}
          <button
            onClick={() => nav('/notifications')}
            className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {notifUnread > 9 ? '9+' : notifUnread}
              </span>
            )}
          </button>

          {/* Globe */}
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </button>

          {/* Moon */}
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>

          {/* Avatar */}
          {user && (
            <button
              onClick={() => nav('/profile')}
              className="w-9 h-9 rounded-full bg-white/30 border border-white/50 flex items-center justify-center text-sm font-bold text-white overflow-hidden"
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
    </header>
  );
}
