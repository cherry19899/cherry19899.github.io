import React, { createContext, useContext, useState, useEffect, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import type { User } from './hooks/useAuth';
import { apiFetch } from './lib/api';
import { ensurePiInit } from './lib/pi';
import { useToastFn, ToastContainer } from './components/Toast';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

import LoginPage        from './pages/Login';
import HomePage         from './pages/Home';
import PostJobPage      from './pages/PostJob';
import ChatPage         from './pages/Chat';
import ChatRoomPage     from './pages/ChatRoom';
import ProfilePage      from './pages/Profile';
import AdminPage        from './pages/Admin';
import NotificationsPage from './pages/Notifications';
import MyJobsPage       from './pages/MyJobs';
import EscrowPage       from './pages/Escrow';
import JobDetailPage    from './pages/JobDetail';

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  componentDidCatch(e: Error, info: ErrorInfo) { console.error('App error:', e, info); }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="text-5xl mb-4">⚠️</span>
        <p className="font-bold text-gray-900 mb-2">Something went wrong</p>
        <p className="text-sm text-gray-500 mb-6 break-all">{this.state.error}</p>
        <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
          className="px-6 py-3 rounded-full bg-emerald-500 text-white font-semibold">
          Reload
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppCtx {
  user: User | null;
  setUser: (u: User | null) => void;
  updateUser: (p: Partial<User>) => void;
  logout: () => void;
  chatUnread: number;
  notifUnread: number;
  refreshUnread: () => void;
}

const Ctx = createContext<AppCtx>({
  user: null, setUser: () => {}, updateUser: () => {}, logout: () => {},
  chatUnread: 0, notifUnread: 0, refreshUnread: () => {},
});

export const useAppCtx = () => useContext(Ctx);

// ─── Layout wrapper for authenticated pages ───────────────────────────────────

function AppLayout({ back }: { back?: boolean }) {
  const nav = useNavigate();
  const { user } = useAppCtx();
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Header back={back} />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      {!back && user && (
        <button
          onClick={() => nav('/post-job')}
          className="fixed bottom-20 right-4 z-[60] w-14 h-14 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40 flex items-center justify-center text-white text-3xl font-light active:scale-95 transition-transform"
          aria-label="Создать вакансию"
        >
          +
        </button>
      )}
      <BottomNav />
    </div>
  );
}

function Protected({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user } = useAppCtx();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const auth = useAuth();
  const { toasts, toast } = useToastFn();
  const [chatUnread, setChatUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  // Make toast globally accessible
  (window as any).__wpToast = toast;

  useEffect(() => { ensurePiInit(); }, []);

  const refreshUnread = useCallback(() => {
    if (!auth.user) return;
    apiFetch('/api/chat/unread').then((d: any) => setChatUnread(d?.count || d?.unread_count || 0)).catch(() => {});
    apiFetch('/api/notifications/unread-count').then((d: any) => setNotifUnread(d?.unread_count || d?.count || 0)).catch(() => {});
  }, [auth.user?.uid]);

  useEffect(() => {
    if (!auth.user) return;
    refreshUnread();
    const iv = setInterval(refreshUnread, 30_000);
    return () => clearInterval(iv);
  }, [auth.user?.uid]);

  return (
    <ErrorBoundary>
    <Ctx.Provider value={{ ...auth, chatUnread, notifUnread, refreshUnread }}>
      <ScrollTop />
      <Routes>
        <Route path="/login" element={
          auth.user ? <Navigate to="/" replace /> : <LoginPage />
        } />

        {/* Chat room has its own custom header */}
        <Route path="/chat/:id" element={<Protected><ChatRoomPage /></Protected>} />

        {/* Pages with back button */}
        <Route element={<Protected><AppLayout back /></Protected>}>
          <Route path="/job/:id"  element={<JobDetailPage />} />
          <Route path="/post-job" element={<PostJobPage />} />
        </Route>

        {/* Pages inside shared AppLayout */}
        <Route element={<Protected><AppLayout /></Protected>}>
          <Route path="/"             element={<HomePage />} />
          <Route path="/chat"         element={<ChatPage />} />
          <Route path="/my-jobs"      element={<MyJobsPage />} />
          <Route path="/escrow"       element={<EscrowPage />} />
          <Route path="/profile"      element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin"        element={<Protected adminOnly><AdminPage /></Protected>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer toasts={toasts} />
    </Ctx.Provider>
    </ErrorBoundary>
  );
}
