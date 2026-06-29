import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Home, 
  PlusCircle, 
  Briefcase, 
  MessageCircle, 
  User,
  Shield,
  Bell
} from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/create-job', icon: PlusCircle, label: 'Post' },
  { path: '/my-jobs', icon: Briefcase, label: 'Jobs' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const showNav = !location.pathname.startsWith('/jobs/') && 
                 !location.pathname.startsWith('/chat/') &&
                 location.pathname !== '/create-job';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-400">WorkPro</h1>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-slate-400">
                {(user as any).balance_connects ?? (user as any).connects ?? 0} connects
              </span>
            )}
            <button className="p-2 rounded-lg bg-slate-800 text-slate-300 relative">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            {user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/admin')}
                className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"
                title="Admin"
              >
                <Shield size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full" style={{ paddingBottom: showNav ? '80px' : '0' }}>
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-slate-700/50 safe-area-pb">
          <div className="max-w-lg mx-auto flex justify-around items-center h-16">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                    active 
                      ? 'text-emerald-400' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
