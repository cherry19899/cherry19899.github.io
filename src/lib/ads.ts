// Pi Ads Network.
//
// Rewarded ads must never be paid out on the client's word alone: showAd() only
// tells us the user watched something. The adId it returns is redeemed by our
// backend against the Pi Platform API, which is the only source of truth for
// whether the reward was actually granted.
import { isPiBrowser } from './pi';

type AdType = 'interstitial' | 'rewarded';

/** Older Pi Browsers have no ad network at all — check before showing any UI. */
export async function adsSupported(): Promise<boolean> {
  if (!isPiBrowser()) return false;
  try {
    const features = await (window as any).Pi.nativeFeaturesList();
    return Array.isArray(features) && features.includes('ad_network');
  } catch {
    return false;
  }
}

async function ensureAdLoaded(type: AdType): Promise<boolean> {
  const Pi = (window as any).Pi;
  try {
    const ready = await Pi.Ads.isAdReady(type);
    if (ready?.ready) return true;
    const requested = await Pi.Ads.requestAd(type);
    return requested?.result === 'AD_LOADED';
  } catch {
    return false;
  }
}

/**
 * Every step of an ad is raced against a timeout. Callers await these before
 * navigating or before re-enabling a button, so an ad SDK that stops
 * responding must not be able to strand them.
 */
const AD_TIMEOUT_MS = 8000;
// A rewarded ad is watched to the end, so the show step gets much longer than
// the interstitial's — but not forever.
const REWARDED_SHOW_TIMEOUT_MS = 120000;

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/**
 * Show a rewarded ad. Resolves with the adId to redeem, or null if the user
 * did not earn a reward (closed early, no inventory, ads unsupported).
 *
 * Timed out at every step, which it was not: showInterstitial() was hardened
 * against a hung SDK and this path was left bare, so a Pi.Ads call that never
 * settled left the "watch an ad for a connect" button spinning with no way
 * back — the caller only clears its loading flag when this resolves.
 */
export async function showRewardedAd(): Promise<string | null> {
  if (!(await withTimeout(adsSupported(), 2000, false))) return null;
  if (!(await withTimeout(ensureAdLoaded('rewarded'), 5000, false))) return null;
  const res: any = await withTimeout(
    (window as any).Pi.Ads.showAd('rewarded'),
    REWARDED_SHOW_TIMEOUT_MS,
    null,
  );
  if (res?.result === 'AD_REWARDED' && res.adId) return res.adId as string;
  return null;
}

/**
 * Show an interstitial at a natural break.
 */

export async function showInterstitial(): Promise<void> {
  if (!(await withTimeout(adsSupported(), 2000, false))) return;
  if (!(await withTimeout(ensureAdLoaded('interstitial'), 5000, false))) return;
  await withTimeout(
    (window as any).Pi.Ads.showAd('interstitial'),
    AD_TIMEOUT_MS,
    null,
  );
}
