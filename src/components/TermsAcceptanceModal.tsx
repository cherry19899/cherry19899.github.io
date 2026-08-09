import { useState } from 'react';
import { apiFetch } from '../lib/api';
import { useAppCtx } from '../App';
import { toast } from './Toast';
import { t } from '../lib/i18n';

export default function TermsAcceptanceModal() {
  const { updateUser } = useAppCtx();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const tr = t();

  const handleContinue = async () => {
    if (!checked || saving) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/user/accept-terms', { method: 'POST' });
      updateUser({
        terms_accepted: true,
        terms_accepted_at: res?.terms_accepted_at || new Date().toISOString(),
      });
    } catch (e: any) {
      toast(e?.message || tr.actionFailed, 'error');
      setSaving(false);
    }
  };

  // The sentence carries {terms} and {privacy} as placeholders so each language
  // can put the two links where its own grammar needs them. This whole screen
  // used to be hardcoded English — a consent gate every user must accept,
  // shown in a language most of them do not read.
  const parts = tr.termsIntro.split(/(\{terms\}|\{privacy\})/);

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Work Pro</h2>
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
          {parts.map((part, i) =>
            part === '{terms}' ? (
              <a key={i} href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                {tr.terms}
              </a>
            ) : part === '{privacy}' ? (
              <a key={i} href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                {tr.privacy}
              </a>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>

        <label className="flex items-start gap-2 mb-5 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-500 shrink-0"
          />
          <span className="text-sm text-gray-700 dark:text-slate-300">
            {tr.termsCheckbox}
          </span>
        </label>

        <button
          onClick={handleContinue}
          disabled={!checked || saving}
          className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? '…' : tr.termsContinue}
        </button>
      </div>
    </div>
  );
}
