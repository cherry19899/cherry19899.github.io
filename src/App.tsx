import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { initPi } from './lib/pi';
import { api } from './lib/api';

// Layout
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import JobDetail from './pages/JobDetail';
import CreateJob from './pages/CreateJob';
import MyJobs from './pages/MyJobs';
import Chat from './pages/Chat';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';
import Escrow from './pages/Escrow';
import Admin from './pages/Admin';
import Login from './pages/Login';

function App() {
  const { user, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    initPi();

    // Check existing auth
    const token = localStorage.getItem('workpro_token');
    const storedUser = localStorage.getItem('workpro_user');

    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Normalize ID
        if (parsed.id && !parsed.id.startsWith('pi_')) {
          parsed.id = `pi_${parsed.id}`;
        }
        setUser(parsed);

        // Verify token is still valid
        api.get('/api/me').catch(() => {
          logout();
        });
      } catch {
        logout();
      }
    } else {
      setLoading(false);
    }
  }, [setUser, setLoading, logout]);

  if (useAuthStore.getState().isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
        <p className="mt-4 text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="create-job" element={user ? <CreateJob /> : <Navigate to="/login" />} />
        <Route path="my-jobs" element={user ? <MyJobs /> : <Navigate to="/login" />} />
        <Route path="chat" element={user ? <Chat /> : <Navigate to="/login" />} />
        <Route path="chat/:roomId" element={user ? <ChatRoom /> : <Navigate to="/login" />} />
        <Route path="profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="escrow" element={user ? <Escrow /> : <Navigate to="/login" />} />
        <Route path="admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
      </Route>
    </Routes>
  );
}

export default App;
