import { t } from '../lib/i18n';

export default function Footer() {
  // These used to be hardcoded English on every screen in all 23 languages,
  // even though `terms` and `privacy` already existed in the dictionary.
  const tr = t();
  return (
    <footer className="px-4 py-6 text-center text-xs text-gray-400 dark:text-slate-500 space-x-3">
      <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
        {tr.terms}
      </a>
      <span>·</span>
      <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
        {tr.privacy}
      </a>
      <div className="mt-2">&copy; 2026 Work Pro</div>
    </footer>
  );
}
