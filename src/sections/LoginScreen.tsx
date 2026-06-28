import React, { useState } from 'react';
import { TFunction } from '../hooks/useTranslation';

interface LoginScreenProps {
  t: TFunction;
  onPiLogin: () => void;
}

export default function LoginScreen({ t, onPiLogin }: LoginScreenProps) {
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    onPiLogin();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm md:max-w-md">
        {/* Logo & heading */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent mb-2">
            Work Pro
          </h1>
          <div className="h-1 w-24 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mb-3" />
          <p className="text-sm text-muted-foreground mt-2">{t('tagline')}</p>
        </div>

        {/* Pi login button */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg active:scale-[0.98] transition-transform disabled:opacity-70"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </span>
          ) : (
            <>
              <span className="text-xl mr-2">π</span>
              {t('loginWithPi')}
            </>
          )}
        </button>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Open this app in Pi Browser to sign in with your Pi account.
        </p>
      </div>
    </div>
  );
}
