import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-700 rounded w-12" />
      </div>
      <div className="h-3 bg-slate-700 rounded w-full" />
      <div className="h-3 bg-slate-700 rounded w-2/3" />
      <div className="flex gap-2">
        <div className="h-5 bg-slate-700 rounded-full w-20" />
        <div className="h-5 bg-slate-700 rounded-full w-16" />
      </div>
    </div>
  );
}

export function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`${h} ${w} bg-slate-700 rounded animate-pulse`} />;
}
