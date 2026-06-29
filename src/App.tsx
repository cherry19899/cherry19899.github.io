import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { useTranslation, LANGUAGES } from './hooks/useTranslation';
import { apiFetch, getChatUnread, getUnreadNotifCount } from './lib/api';

import BottomNav from './components/BottomNav';
import LoginScreen from './sections/LoginScreen';
import JobsScreen from './sections/JobsScreen';
import JobDetailModal from './sections/JobDetailModal';
import CreateJobScreen from './sections/CreateJobScreen';
import ChatScreen from './sections/ChatScreen';
import EscrowScreen from './sections/EscrowScreen';
import ProfileScreen from './sections/ProfileScreen';
import MyJobsScreen from './sections/MyJobsScreen';
import PortfolioScreen from './sections/PortfolioScreen';
import MyApplicationsScreen from './sections/MyApplicationsScreen';
import NotificationsScreen from './sections/NotificationsScreen';
import FaqScreen from './sections/FaqScreen';
import TermsScreen from './sections/TermsScreen';
import AdminScreen from './sections/AdminScreen';
import OffersScreen from './sections/OffersScreen';

declare const Pi: any;

type Tab = 'jobs' | 'chat' | 'myJobs' | 'escrow' | 'profile' | 'createJob'
  | 'portfolio' | 'applications' | 'notifications' | 'faq' | 'terms' | 'admin' | 'offers';

interface User {
  uid: string;
  username: string;
  role?: string;
  bio?: string;
  skills?: string;
  avatar?: string;
  kyc?: boolean;
  balance_pi?: number;
  connects?: number;
}

const OWNER = 'cherry19899';

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { t, lang, setLang } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('jobs');
  const [user, setUser] = useState<User | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [portfolioUserId, setPortfolioUserId] = useState<string | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  // Restore user from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('workpro_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.uid) {
          if (u.username?.toLowerCase() === OWNER) u.role = 'admin';
          setUser(u);
        }
      }
    } catch {}
  }, []);

  // Poll chat unread + notification unread independently
  useEffect(() => {
    if (!user) return;
    const pollChat = async () => {
      try { const d = await getChatUnread(); setChatUnread(d.count || d.unread_count || 0); } catch {}
    };
    const pollNotif = async () => {
      try { const d = await getUnreadNotifCount(); setNotifUnread(d.unread_count || d.count || 0); } catch {}
    };
    pollChat(); pollNotif();
    const i1 = setInterval(pollChat, 20000);
    const i2 = setInterval(pollNotif, 30000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, [user?.uid]);

  const handlePiLogin = useCallback(async () => {
    try {
      if (typeof Pi === 'undefined') {
        alert('Please open in Pi Browser to sign in with Pi.');
        return;
      }
      const auth = await Pi.authenticate(['username', 'payments'], () => {});
      const data = await apiFetch('/api/me', {
        method: 'POST',
        body: JSON.stringify({ uid: auth.user.uid, username: auth.user.username, accessToken: auth.accessToken }),
      });
      if (data?.token) {
        localStorage.setItem('workpro_token', data.token);
        localStorage.setItem('workpro_jwt', data.token);
      }
      const u: User = {
        uid: auth.user.uid,
        username: auth.user.username,
        role: data?.role,
        bio: data?.bio || '',
        skills: data?.skills || '',
        avatar: data?.avatar || '',
        kyc: data?.kyc || false,
        balance_pi: data?.balance_pi || 0,
        connects: data?.connects || 0,
      };
      if (u.username?.toLowerCase() === OWNER) u.role = 'admin';
      if (data?.connects !== undefined) localStorage.setItem('workpro_connects', String(data.connects));
      localStorage.setItem('workpro_user', JSON.stringify(u));
      setUser(u);
      setActiveTab('jobs');
    } catch (e: any) {
      console.error('[Login]', e);
      alert(e.message || 'Login failed');
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('workpro_user');
    localStorage.removeItem('workpro_token');
    localStorage.removeItem('workpro_jwt');
    setUser(null);
    setActiveTab('jobs');
  }, []);

  if (!user) {
    return <LoginScreen t={t} onPiLogin={handlePiLogin} />;
  }

  const mainTabMap: Tab[] = ['jobs', 'chat', 'myJobs', 'escrow', 'profile'];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-emerald-500 text-white">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
          <h1 className="font-black text-lg tracking-tight">Work Pro</h1>

          <div className="flex items-center gap-2">
            {/* Notifications bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative w-8 h-8 flex items-center justify-center rounded-full bg-white/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notifUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </button>

            {/* Language picker */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(l => !l)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-sm"
              >
                {LANGUAGES.find(l => l.code === lang)?.flag || '🌐'}
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-10 bg-card border border-border rounded-xl overflow-hidden shadow-xl z-50 w-40">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                      className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-muted transition-colors ${lang === l.code ? 'text-emerald-500 font-semibold' : ''}`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Avatar */}
            <div
              onClick={() => setActiveTab('profile')}
              className="w-8 h-8 rounded-full overflow-hidden bg-white/30 flex items-center justify-center text-sm font-bold cursor-pointer"
            >
              {user.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                : (user.username || '?')[0].toUpperCase()
              }
            </div>
          </div>
        </div>
      </header>

      {/* Overlay click to close lang menu */}
      {showLangMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setShowLangMenu(false)} />
      )}

      {/* Screens */}
      <main>
        {activeTab === 'jobs' && (
          <JobsScreen
            t={t} user={user}
            onOpenJob={id => setSelectedJobId(id)}
            onPostJob={() => setActiveTab('createJob')}
            onOpenPortfolio={uid => { setPortfolioUserId(uid); setActiveTab('portfolio'); }}
          />
        )}
        {activeTab === 'chat' && (
          <ChatScreen t={t} user={user} openRoomId={chatRoomId} />
        )}
        {activeTab === 'myJobs' && (
          <MyJobsScreen t={t} user={user} onOpenJob={id => setSelectedJobId(id)} />
        )}
        {activeTab === 'escrow' && (
          <EscrowScreen t={t} user={user} />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen
            t={t} user={user} theme={theme}
            onToggleTheme={toggleTheme}
            onLogout={handleLogout}
            onOpenFaq={() => setActiveTab('faq')}
            onOpenTerms={() => setActiveTab('terms')}
            onOpenPortfolio={() => { setPortfolioUserId(user.uid); setActiveTab('portfolio'); }}
            onOpenApplications={() => setActiveTab('applications')}
            onOpenOffers={() => setActiveTab('offers')}
            onOpenAdmin={user.role === 'admin' ? () => setActiveTab('admin') : undefined}
            onUserUpdate={u => setUser(u)}
          />
        )}
        {activeTab === 'createJob' && (
          <CreateJobScreen t={t} onBack={() => setActiveTab('jobs')} />
        )}
        {activeTab === 'portfolio' && portfolioUserId && (
          <PortfolioScreen t={t} userId={portfolioUserId} onBack={() => setActiveTab('jobs')} />
        )}
        {activeTab === 'applications' && (
          <MyApplicationsScreen
            t={t}
            onBack={() => setActiveTab('profile')}
            onOpenJob={id => setSelectedJobId(id)}
          />
        )}
        {activeTab === 'notifications' && (
          <NotificationsScreen
            t={t}
            onBack={() => setActiveTab('jobs')}
            onNavigate={(tab, extra) => {
              setActiveTab('jobs');
              if (tab === 'chat' && extra?.roomId) { setChatRoomId(extra.roomId); setActiveTab('chat'); }
              else if (tab === 'jobDetail' && extra?.jobId) { setSelectedJobId(extra.jobId); setActiveTab('jobs'); }
              else if (tab === 'escrow') { setActiveTab('escrow'); }
            }}
          />
        )}
        {activeTab === 'faq' && (
          <FaqScreen t={t} onBack={() => setActiveTab('profile')} />
        )}
        {activeTab === 'terms' && (
          <TermsScreen t={t} onBack={() => setActiveTab('profile')} />
        )}
        {activeTab === 'admin' && user.role === 'admin' && (
          <AdminScreen t={t} user={user} onBack={() => setActiveTab('jobs')} />
        )}
        {activeTab === 'offers' && (
          <OffersScreen t={t} onBack={() => setActiveTab('profile')} />
        )}
      </main>

      {/* Job detail modal */}
      {selectedJobId !== null && (
        <JobDetailModal
          t={t}
          jobId={selectedJobId}
          user={user}
          onClose={() => setSelectedJobId(null)}
          onNavigate={tab => { setSelectedJobId(null); setActiveTab(tab as Tab); }}
          onOpenChat={roomId => { setSelectedJobId(null); setChatRoomId(roomId); setActiveTab('chat'); }}
        />
      )}

      {/* Bottom navigation — only for main tabs */}
      {mainTabMap.includes(activeTab) && (
        <BottomNav
          t={t}
          active={activeTab as any}
          onNav={tab => {
            setActiveTab(tab);
            if (tab === 'admin' && user.role === 'admin') setActiveTab('admin');
          }}
          chatUnread={chatUnread}
          notifUnread={notifUnread}
        />
      )}
    </div>
  );
}
