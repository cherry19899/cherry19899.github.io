import React from 'react';

export default function Footer() {
  return (
    <footer className="px-4 py-6 text-center text-xs text-gray-400 dark:text-slate-500 space-x-3">
      <a href="/terms-of-service.html" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
        Terms of Service
      </a>
      <span>·</span>
      <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
        Privacy Policy
      </a>
      <div className="mt-2">&copy; 2026 Work Pro</div>
    </footer>
  );
}
