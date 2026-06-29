import React from 'react';
import { TFunction } from '../hooks/useTranslation';

type Tab = 'jobs' | 'chat' | 'myJobs' | 'escrow' | 'profile';

interface BottomNavProps {
  t: TFunction;
  active: Tab;
  onNav: (tab: Tab) => void;
  chatUnread?: number;
  notifUnread?: number;
}

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ListIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const TABS = [
  { key: 'jobs' as Tab, labelKey: 'jobs', Icon: BriefcaseIcon },
  { key: 'chat' as Tab, labelKey: 'chat', Icon: ChatIcon },
  { key: 'myJobs' as Tab, labelKey: 'myJobs', Icon: ListIcon },
  { key: 'escrow' as Tab, labelKey: 'escrow', Icon: LockIcon },
  { key: 'profile' as Tab, labelKey: 'profile', Icon: UserIcon },
];

export default function BottomNav({ t, active, onNav, chatUnread = 0, notifUnread = 0 }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {TABS.map(({ key, labelKey, Icon }) => {
          const isActive = active === key;
          const badge = key === 'chat' ? chatUnread : key === 'profile' ? notifUnread : 0;
          return (
            <button
              key={key}
              onClick={() => onNav(key)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors relative ${
                isActive ? 'text-emerald-500' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              {badge > 0 && (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
