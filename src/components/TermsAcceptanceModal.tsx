import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAppCtx } from '../App';

export default function TermsAcceptanceModal() {
  const { updateUser } = useAppCtx();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!checked || saving) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/user/accept-terms', { method: 'POST' });
      updateUser({
        terms_accepted: true,
        terms_accepted_at: res?.terms_accepted_at || new Date().toISOString(),
      });
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Work Pro</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
          By using Work Pro, you agree to our{' '}
          <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
            Privacy Policy
          </a>.
        </p>

        <label className="flex items-start gap-2 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-500 shrink-0"
          />
          <span className="text-sm text-gray-700 dark:text-slate-300">
            I agree to the Terms of Service and Privacy Policy
          </span>
        </label>

        <button
          onClick={handleContinue}
          disabled={!checked || saving}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? '…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
