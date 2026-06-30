import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { User } from './types';
import { useAuth } from './hooks/useAuth';
import { apiFetch } from './lib/api';

// Pages
import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import JobDetailPage from './pages/JobDetail';
import PostJobPage from './pages/PostJob';
import ChatPage from './pages/Chat';
import ChatRoomPage from './pages/ChatRoom';
import ProfilePage from './pages/Profile';
import AdminPage from './pages/Admin';
import NotificationsPage from './pages/Notifications';
import MyJobsPage from './pages/MyJobs';
import EscrowPage from './pages/Escrow';

// Components
import Layout from './components/Layout';
import Toast, { useToast } from './components/Toast';

// ── Auth context ──────────────────────────────────────────────────────────────
interface AuthCtx {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  updateUser: (u: Partial<User>) => void;
  logout: () => void;
  chatUnread: number;
  notifUnread: number;
  refreshUnread: () => void;
}
export const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  setUser: () => {}, updateUser: () => {}, logout: () => {},
  chatUnread: 0, notifUnread: 0, refreshUnread: () => {},
});
export const useAppAuth = () => useContext(AuthContext);

// ── Toast context ─────────────────────────────────────────────────────────────
interface ToastCtx { toast: (msg: string, type?: 'success' | 'error' | 'info') => void; }
export const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export const useToastCtx = () => useContext(ToastContext);

// ── Protected route ───────────────────────────────────────────────────────────
function Protected({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAppAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ── Scroll to top on route change ────────────────────────────────────────────
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// ── Root app ──────────────────────────────────────────────────────────────────
export default function App() {
  const auth = useAuth();
  const { toasts, toast, dismiss } = useToast();
  const [chatUnread, setChatUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  const refreshUnread = () => {
    if (!auth.user) return;
    apiFetch('/api/chat/unread').then((d: any) => setChatUnread(d?.count || d?.unread_count || 0)).catch(() => {});
    apiFetch('/api/notifications/unread-count').then((d: any) => setNotifUnread(d?.unread_count || d?.count || 0)).catch(() => {});
  };

  useEffect(() => {
    if (!auth.user) return;
    refreshUnread();
    const iv = setInterval(refreshUnread, 30000);
    return () => clearInterval(iv);
  }, [auth.user?.uid]);

  return (
    <AuthContext.Provider value={{ ...auth, chatUnread, notifUnread, refreshUnread }}>
      <ToastContext.Provider value={{ toast }}>
        <HashRouter>
          <ScrollReset />
          <Routes>
            <Route path="/login" element={
              auth.user ? <Navigate to="/" replace /> : <LoginPage />
            } />

            {/* All authenticated routes wrapped in Layout */}
            <Route path="/" element={<Protected><Layout /></Protected>}>
              <Route index element={<HomePage />} />
              <Route path="job/:id" element={<JobDetailPage />} />
              <Route path="post-job" element={<PostJobPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="chat/:id" element={<ChatRoomPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="my-jobs" element={<MyJobsPage />} />
              <Route path="escrow" element={<EscrowPage />} />
              <Route path="admin" element={
                <Protected adminOnly><AdminPage /></Protected>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>

        {/* Global toast notifications */}
        <div className="fixed top-4 left-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm mx-auto">
          {toasts.map(t => (
            <Toast key={t.id} {...t} onDismiss={dismiss} />
          ))}
        </div>
      </ToastContext.Provider>
    </AuthContext.Provider>
  );
}
