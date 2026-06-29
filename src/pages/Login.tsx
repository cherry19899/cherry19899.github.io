import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authenticatePi, isPiBrowser } from '../lib/pi';
import { LogIn, Smartphone, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [piReady, setPiReady] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  // Wait for Pi SDK to load (script is async)
  useEffect(() => {
    let attempts = 0;
    const checkPi = setInterval(() => {
      attempts++;
      if (isPiBrowser()) {
        setPiReady(true);
        clearInterval(checkPi);
      } else if (attempts > 30) {
        clearInterval(checkPi);
        // Not in Pi Browser — still show UI
      }
    }, 200);
    return () => clearInterval(checkPi);
  }, []);

  const handlePiLogin = async () => {
    setLoading(true);
    setError('');

    try {
      if (!isPiBrowser()) {
        setError('Please open this app in Pi Browser');
        setLoading(false);
        return;
      }

      const user = await authenticatePi();
      setUser(user);
      navigate('/');
    } catch (err: any) {
      console.error('[Login] Auth error:', err);
      const msg = err?.response?.data?.error || err?.message || 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 
                          flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <BriefcaseIcon size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">WorkPro</h1>
          <p className="text-slate-400">Freelance marketplace on Pi Network</p>
        </div>

        {/* Login Button */}
        <button
          onClick={handlePiLogin}
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-3 text-lg py-4"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <LogIn size={20} />
              Login with Pi
            </>
          )}
        </button>

        {/* Pi Browser Notice */}
        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <Smartphone size={18} className="text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-400">
            {piReady 
              ? 'Pi SDK ready. Click Login to authenticate.'
              : 'This app works inside Pi Browser. Open pi://cherry19899.github.io or use the Pi app.'}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BriefcaseIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
         strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}
