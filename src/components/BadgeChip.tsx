import React from 'react';

const BADGE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  rising_talent:    { label: 'Rising Talent',   icon: '🚀', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  top_rated:        { label: 'Top Rated',        icon: '⭐', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  top_rated_plus:   { label: 'Top Rated Plus',   icon: '🏆', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  expert_level:     { label: 'Expert',           icon: '💎', color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
  verified:         { label: 'KYC Verified',     icon: '✅', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  repeat_magnet:    { label: 'Repeat Magnet',    icon: '🔄', color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
};

interface Props {
  badge: string;
  size?: 'sm' | 'md';
}

export default function BadgeChip({ badge, size = 'sm' }: Props) {
  const cfg = BADGE_CONFIG[badge];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${cfg.color} ${size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}
