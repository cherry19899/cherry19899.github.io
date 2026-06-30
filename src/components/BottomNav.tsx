import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppCtx } from '../App';

const TABS = [
  { path: '/',        label: 'Jobs',    Icon: BriefcaseIcon },
  { path: '/chat',    label: 'Chat',    Icon: ChatIcon },
  { path: '/my-jobs', label: 'My Jobs', Icon: ListChecksIcon },
  { path: '/escrow',  label: 'Escrow',  Icon: LockIcon },
  { path: '/profile', label: 'Profile', Icon: UserIcon },
];

export default function BottomNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { chatUnread } = useAppCtx();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex h-16 max-w-lg mx-auto">
        {TABS.map(({ path, label, Icon }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path);
          const badge  = path === '/chat' ? chatUnread : 0;
          return (
            <button
              key={path}
              onClick={() => nav(path)}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                active
                  ? 'text-emerald-500 border-t-2 border-emerald-500'
                  : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {badge > 0 && (
                <span className="absolute top-2 right-2.5 min-w-[14px] h-3.5 px-0.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              <span className="text-[10px] font-medium mt-0.5">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
}
function ChatIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function ListChecksIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
}
function LockIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function UserIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
