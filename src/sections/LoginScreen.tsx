import React, { useState, useEffect } from 'react';
import { TFunction } from '../hooks/useTranslation';

interface LoginScreenProps {
  t: TFunction;
  onPiLogin: () => void;
}

declare const Pi: any;

const FEATURES = [
  { icon: '🔒', key: 'featureEscrow' },
  { icon: '💬', key: 'featureChat' },
  { icon: '⭐', key: 'featureReviews' },
  { icon: 'π', key: 'featurePi' },
];

export default function LoginScreen({ t, onPiLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);
  const [piAvailable, setPiAvailable] = useState(false);

  useEffect(() => {
    setPiAvailable(typeof Pi !== 'undefined');
  }, []);

  const handleLogin = () => {
    if (!piAvailable) {
      alert(t('piBrowserRequired') || 'Please open this app in Pi Browser');
      return;
    }
    setLoading(true);
    onPiLogin();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-4xl font-black text-white">W</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent mb-1">
            Work Pro
          </h1>
          <p className="text-sm text-muted-foreground">{t('tagline')}</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {FEATURES.map(f => (
            <div key={f.key} className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
              <span className="text-lg">{f.icon}</span>
              <span className="text-xs text-muted-foreground">{t(f.key) || f.key}</span>
            </div>
          ))}
        </div>

        {/* Pi login button */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('connecting') || 'Connecting...'}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-2xl leading-none">π</span>
              {t('loginWithPi')}
            </span>
          )}
        </button>

        {!piAvailable && (
          <p className="text-xs text-center text-amber-400 mt-3 font-medium">
            ⚠️ {t('piBrowserRequired') || 'Open in Pi Browser to sign in'}
          </p>
        )}

        <p className="text-xs text-center text-muted-foreground mt-4">
          {t('loginHint') || 'Your Pi identity — no password needed'}
        </p>
      </div>
    </div>
  );
}
