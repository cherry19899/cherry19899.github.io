// Both default to production, so an ordinary build is byte-for-byte what it
// always was. They are overridable because the Testnet build has to reach a
// different backend: `.env.example` had advertised VITE_API_BASE for months
// while the value was hardcoded here, so a Testnet frontend would have gone on
// talking to the live API — testnet sign-ins landing in real users' data.
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://workpro-api.onrender.com';

// Canonical public address of the app — used for invite links and job deep
// links, so it must stay the deployed URL of *this* build.
export const APP_URL = import.meta.env.VITE_APP_URL || 'https://cherry19899.github.io';

// Labels here are English fallbacks only — the UI renders translated labels
// via categoryLabel() from ./categories, keyed off these same `key`s.
export const CATEGORIES = [
  { key: 'all',         label: 'All' },
  { key: 'development', label: 'Development' },
  { key: 'design',      label: 'Design' },
  { key: 'writing',     label: 'Writing' },
  { key: 'marketing',   label: 'Marketing' },
  { key: 'data',        label: 'Data' },
  { key: 'support',     label: 'Support' },
  { key: 'translation', label: 'Translation' },
  { key: 'va',          label: 'Virtual Assistant' },
  { key: 'other',       label: 'Other' },
] as const;

export const CAT_COLORS: Record<string, string> = {
  development: 'bg-blue-100 text-blue-600',
  design:      'bg-purple-100 text-purple-600',
  writing:     'bg-amber-100 text-amber-600',
  marketing:   'bg-rose-100 text-rose-600',
  data:        'bg-cyan-100 text-cyan-600',
  support:     'bg-emerald-100 text-emerald-600',
  translation: 'bg-indigo-100 text-indigo-600',
  va:          'bg-pink-100 text-pink-600',
  other:       'bg-gray-100 text-gray-600',
};

export const CONNECT_PACKAGES = [
  { connects: 10,  price: 1 },
  { connects: 50,  price: 5 },
  { connects: 100, price: 7 },
];
