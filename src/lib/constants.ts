export const API_BASE = 'https://workpro-api.onrender.com';

export const CATEGORIES = [
  { key: 'all',         label: 'All' },
  { key: 'development', label: 'Development' },
  { key: 'design',      label: 'Design' },
  { key: 'writing',     label: 'Writing' },
  { key: 'marketing',   label: 'Marketing' },
  { key: 'data',        label: 'Data' },
  { key: 'other',       label: 'Other' },
] as const;

export const CAT_COLORS: Record<string, string> = {
  development: 'bg-blue-100 text-blue-600',
  design:      'bg-purple-100 text-purple-600',
  writing:     'bg-amber-100 text-amber-600',
  marketing:   'bg-rose-100 text-rose-600',
  data:        'bg-cyan-100 text-cyan-600',
  other:       'bg-gray-100 text-gray-600',
};

export const CONNECT_PACKAGES = [
  { connects: 10,  price: 1 },
  { connects: 50,  price: 4.5 },
  { connects: 100, price: 8 },
];
