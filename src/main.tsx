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
  if (inset === 0 && /;\s*wv\)/.test(navigator.userAgent)) {
    document.documentElement.classList.add('wv-no-inset');
  }
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
