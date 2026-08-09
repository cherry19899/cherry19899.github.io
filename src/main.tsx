import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { applyTheme } from './lib/theme';
import { applyLangDir } from './lib/i18n';

applyTheme();
applyLangDir();

/**
 * Android WebView (Pi Browser) draws the page under the system navigation bar
 * but reports no safe-area inset, so the CSS env() fallbacks compensate for
 * nothing and the bottom tabs end up untappable. Measure the inset rather than
 * sniffing for a browser: any engine that reports one keeps its own value.
 */
(() => {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  const inset = parseFloat(getComputedStyle(probe).height) || 0;
  probe.remove();
  // `; wv)` marks an Android WebView specifically — unlike Pi Browser itself,
  // which the user agent gives no way to identify.
  const isWebView = /;\s*wv\)/.test(navigator.userAgent);
  const applied = inset === 0 && isWebView;
  if (applied) document.documentElement.classList.add('wv-no-inset');
  // TEMPORARY — DebugConsole only starts capturing console.* after it mounts,
  // which is after this IIFE runs, so a plain console.log here would go to a
  // console Pi Browser has no devtools to show. Stash it where DebugConsole
  // knows to look on mount instead. Remove once the composer-visibility fix
  // is confirmed live.
  (window as any).__earlyLogs = [['log', ['[inset-detect]', { inset, isWebView, applied, ua: navigator.userAgent }]]];
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
