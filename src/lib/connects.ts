// Connects economy.
//
// These numbers are admin-configurable and served by GET /api/config. They used
// to be hardcoded here while the server kept its own copy — the same split that
// let the published platform fee say 2% while the app charged 8%. The constants
// below are only the fallback for a client that has not heard from the server
// yet; the server is always the authority.

export const APPLY_DIVISOR_FALLBACK = 50;
export const POST_JOB_COST_FALLBACK = 1;

const economy = {
  applyCostDivisor: APPLY_DIVISOR_FALLBACK,
  postJobCost: POST_JOB_COST_FALLBACK,
};

/** Called once the real config arrives. Ignores anything malformed. */
export function setConnectsEconomy(cfg: { apply_cost_divisor?: unknown; post_job_cost?: unknown } | null | undefined) {
  const d = Number(cfg?.apply_cost_divisor);
  const p = Number(cfg?.post_job_cost);
  if (Number.isFinite(d) && d >= 1) economy.applyCostDivisor = d;
  if (Number.isFinite(p) && p >= 0) economy.postJobCost = Math.round(p);
}

/** Connects required to post a job. */
export function postJobCost(): number {
  return economy.postJobCost;
}

/** The divisor itself — the admin screen edits it, everything else uses applyCostFor. */
export function applyCostDivisor(): number {
  return economy.applyCostDivisor;
}

/** Connects required to apply for a job of this budget. Never below 1. */
export function applyCostFor(budget: number | string | undefined): number {
  const b = Number(budget) || 0;
  return Math.max(1, Math.ceil(b / economy.applyCostDivisor));
}

// ─── Support link ─────────────────────────────────────────────────────────
// Empty until an admin sets one. The screens that offer it hide the row rather
// than show a dead link.
let supportUrl = '';

// Mirrors SUPPORT_URL_RE on the server. Besides the scheme, the authority may
// not contain `@`: `https://support.workpro@gmail.com` looks like a support
// site and resolves to gmail.com, since everything before the `@` is userinfo.
// That is both how a mistyped address became a link elsewhere and the standard
// way to disguise a phishing destination — and this link sits on a screen the
// user trusts.
export const SUPPORT_URL_RE = /^https?:\/\/[^\s/?#@]+(?:[/?#][^\s]*)?$/i;

export function setSupportUrl(url: unknown) {
  const v = String(url || '').trim();
  // Re-validated here as well as on the server: this string goes straight into
  // a link the user taps, and http(s) is the only scheme that belongs there.
  supportUrl = SUPPORT_URL_RE.test(v) ? v : '';
}

export function getSupportUrl(): string {
  return supportUrl;
}

// ─── Support email ────────────────────────────────────────────────────────
// Held apart from the URL above because it is not a link: the app prints it as
// text to copy. A mailto: cannot be stored in support_url anyway — that field
// is http(s)-only on both write and read — and in Pi Browser a mailto: often
// has no handler, so tapping one does nothing or opens a Gmail sign-in page.
let supportEmail = '';

// Mirrors the server's rule, and for the same reason: `:` and `/` are barred
// from the local part so a whole URL cannot pose as an address.
export const EMAIL_RE = /^[^\s@<>"'\\/:,;]+@[^\s@<>"'.\\/:,;]+(\.[^\s@<>"'.\\/:,;]+)+$/;

export function setSupportEmail(email: unknown) {
  const v = String(email || '').trim();
  supportEmail = v.length <= 254 && EMAIL_RE.test(v) ? v : '';
}

export function getSupportEmail(): string {
  return supportEmail;
}
