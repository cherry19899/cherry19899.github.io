import React, { useState, useEffect } from 'react';
import { isPiBrowser, piAuthenticate, PI_MODE } from '../lib/pi';
import { useAppCtx } from '../App';
import { toast } from '../components/Toast';
import Footer from '../components/Footer';

// The login screen is deliberately dark in both themes — it is the entrance to
// the app, not part of its interface. LOGIN_BG must stay in sync with
// `background_color` in manifest.json: that colour is what Pi Browser paints
// while the bundle loads, and any mismatch shows as a flash on the seam.
const LOGIN_BG = '#022c22';
const PANEL_BG = '#064e3b';
const FEATURE_ICON = '#34d399';
const FOOT = '#6ee7b7';
const FEATURES: [string, string][] = [
  ['M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', 'Earn Pi for your skills'],
  ['M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM7 11V7a5 5 0 0 1 10 0v4', 'Escrow-protected payments'],
  ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', 'Real-time chat and contracts'],
];

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
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: LOGIN_BG }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-500 flex items-center justify-center">
            <svg className="w-10 h-10" style={{ color: '#052e21' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Work Pro</h1>
          <p className="text-sm" style={{ color: '#6ee7b7' }}>Freelance marketplace on Pi</p>
        </div>

        <div className="mb-8 rounded-2xl p-4 space-y-3" style={{ background: '#064e3b' }}>
          {FEATURES.map(([d, text]) => (
            <div key={text} className="flex items-center gap-3 text-sm" style={{ color: '#d1fae5' }}>
              <svg className="w-5 h-5 shrink-0" style={{ color: FEATURE_ICON }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={d} />
              </svg>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-emerald-500 active:bg-emerald-600 font-bold text-base transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ color: '#052e21' }}
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {wakingUp && <span className="text-sm font-medium">Waking up server…</span>}
            </>
          ) : 'Login with Pi'}
        </button>

        <div className="mt-5 flex items-start gap-3 p-4 rounded-2xl" style={{ background: PANEL_BG }}>
          <svg className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
          <p className="text-sm" style={{ color: '#6ee7b7' }}>
            {piReady
              ? 'Pi SDK ready — tap Login to authenticate.'
              : 'Open this app inside the Pi Browser.'}
          </p>
        </div>

        <p className="mt-5 text-xs text-center" style={{ color: FOOT }}>
          {/* Single source of truth — same PI_MODE the SDK is initialized with. */}
          {/* English like the rest of this screen — it is shown before the user
              picks a language, so it must not follow the dictionary. */}
          {PI_MODE === 'sandbox'
            ? 'Testnet · sandbox payments (Test-π)'
            : 'Mainnet · real Pi payments'}
        </p>
      </div>

      <Footer />
    </div>
  );
}
