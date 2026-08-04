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
 * Show a rewarded ad. Resolves with the adId to redeem, or null if the user
 * did not earn a reward (closed early, no inventory, ads unsupported).
 */
export async function showRewardedAd(): Promise<string | null> {
  if (!(await adsSupported())) return null;
  if (!(await ensureAdLoaded('rewarded'))) return null;
  try {
    const res = await (window as any).Pi.Ads.showAd('rewarded');
    if (res?.result === 'AD_REWARDED' && res.adId) return res.adId as string;
    return null;
  } catch {
    return null;
  }
}

/**
 * Show an interstitial at a natural break.
 *
 * Callers await this before navigating, so it must never be able to strand
 * them: every step is raced against a timeout. Without that, an ad SDK that
 * stops responding would leave the user stuck on the screen they just
 * finished with.
 */
const AD_TIMEOUT_MS = 8000;

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function showInterstitial(): Promise<void> {
  if (!(await withTimeout(adsSupported(), 2000, false))) return;
  if (!(await withTimeout(ensureAdLoaded('interstitial'), 5000, false))) return;
  await withTimeout(
    (window as any).Pi.Ads.showAd('interstitial'),
    AD_TIMEOUT_MS,
    null,
  );
}
