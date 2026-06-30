import React, { useState, useEffect } from 'react';
import { isPiBrowser, piAuthenticate } from '../lib/pi';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';

export default function LoginPage() {
  const { setUser } = useAppCtx();
  const [loading, setLoading] = useState(false);
  const [piReady, setPiReady] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);

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
    setWakingUp(false);
    const wakeTimer = setTimeout(() => setWakingUp(true), 4000);
    try {
      const user = await piAuthenticate();
      setUser(user);
    } catch (e: any) {
      toast(e.message || 'Login failed', 'error');
    } finally {
      clearTimeout(wakeTimer);
      setLoading(false);
      setWakingUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Work Pro</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Freelance marketplace on Pi Network</p>
        </div>

        <div className="space-y-3 mb-8">
          {[
            ['💰', 'Earn Pi for your skills'],
            ['🔒', 'Escrow-protected payments'],
            ['⚡', 'Real-time chat & contracts'],
          ].map(([icon, text]) => (
            <div key={text as string} className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
              <span className="text-lg">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-base transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {wakingUp && <span className="text-sm font-medium">Waking up server…</span>}
            </>
          ) : 'Login with Pi'}
        </button>

        <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
          <svg className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {piReady
              ? 'Pi SDK ready — tap Login to authenticate.'
              : 'Open this app inside the Pi Browser.'}
          </p>
        </div>

        <p className="mt-5 text-gray-400 dark:text-slate-600 text-xs text-center">Testnet mode · sandbox payments</p>
      </div>
    </div>
  );
}
