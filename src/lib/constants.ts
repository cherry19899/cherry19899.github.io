export const API_BASE = 'https://workpro-api.onrender.com';
export const OWNER_USERNAME = 'cherry19899';

export const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'development', label: 'Development' },
  { key: 'design', label: 'Design' },
  { key: 'writing', label: 'Writing' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'data', label: 'Data' },
  { key: 'other', label: 'Other' },
] as const;

export const CAT_COLORS: Record<string, string> = {
  development: 'bg-blue-500/15 text-blue-400',
  design:      'bg-purple-500/15 text-purple-400',
  writing:     'bg-amber-500/15 text-amber-400',
  marketing:   'bg-rose-500/15 text-rose-400',
  data:        'bg-cyan-500/15 text-cyan-400',
  other:       'bg-slate-500/15 text-slate-400',
};
