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
 * Some Android WebViews (Pi Browser among them) draw the page underneath the
 * system navigation bar yet report no safe-area inset, so the CSS env()
 * fallbacks compensate for nothing and the bottom tabs end up untappable.
 * Others lay the page out *above* an opaque navigation bar, and for those the
 * same compensation is just a band of empty space under the tabs.
 *
 * Both kinds report an inset of 0, so the inset alone cannot tell them apart.
 * How much of the screen the page does NOT get can: screen.height minus
 * innerHeight is the browser chrome at the top, plus the navigation bar only
 * when the bar sits outside the viewport.
 *
 *   2026-08-09, tabs untappable:   935 - 862 = 73   (top chrome only)
 *   Genymotion Pixel 6:            ~70              (top chrome only)
 *   2026-10, golovko1982/tsap1987: visible gap between the tabs and a separate
 *                                  white 3-button nav bar — bar outside the
 *                                  viewport, so ~48dp more than the above
 *
 * The threshold sits above the tallest top chrome expected (a notched status
 * bar plus Pi Browser's own bar) and below top chrome plus a 3-button bar. A
 * gesture-navigation bar is thin enough to land in between; those keep the
 * padding, which is what every device had before, so nothing regresses.
 */
const TOP_CHROME_ONLY_MAX = 110;
(() => {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  const inset = parseFloat(getComputedStyle(probe).height) || 0;
  probe.remove();
  // `; wv)` marks an Android WebView specifically — unlike Pi Browser itself,
  // which the user agent gives no way to identify.
  const isWebView = /;\s*wv\)/.test(navigator.userAgent);
  const viewportReachesBottom = screen.height - window.innerHeight <= TOP_CHROME_ONLY_MAX;
  if (inset === 0 && isWebView && viewportReachesBottom) {
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
