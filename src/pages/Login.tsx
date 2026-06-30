import React, { useState, useEffect } from 'react';
import { isPiBrowser, piAuthenticate } from '../lib/pi';
import { useAppAuth, useToastCtx } from '../App';

export default function LoginPage() {
  const { setUser } = useAppAuth();
  const { toast } = useToastCtx();
  const [loading, setLoading] = useState(false);
  const [piReady, setPiReady] = useState(false);

  useEffect(() => {
    let n = 0;
    const iv = setInterval(() => {
      if (isPiBrowser()) { setPiReady(true); clearInterval(iv); }
      else if (++n > 40) clearInterval(iv);
    }, 200);
    return () => clearInterval(iv);
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const user = await piAuthenticate();
      setUser(user);
    } catch (e: any) {
      toast(e.message || 'Login failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">WorkPro</h1>
          <p className="text-slate-400">Freelance marketplace on Pi Network</p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {[
            ['💰', 'Earn Pi for your skills'],
            ['🔒', 'Escrow-protected payments'],
            ['⚡', 'Real-time chat & contracts'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-xl">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Login with Pi
            </>
          )}
        </button>

        {/* Pi Browser Notice */}
        <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <svg className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
          <p className="text-sm text-slate-400">
            {piReady
              ? 'Pi SDK ready. Click Login to authenticate.'
              : 'This app works inside Pi Browser. Open it via the Pi app.'}
          </p>
        </div>

        <p className="mt-5 text-slate-600 text-xs text-center">
          Testnet mode · Payments use Pi testnet wallet
        </p>
      </div>
    </div>
  );
}
