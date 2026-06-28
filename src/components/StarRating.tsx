import React from 'react';

interface StarRatingProps {
  value: number;
  size?: number;
}

export default function StarRating({ value, size = 14 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span className="text-xs font-bold text-amber-500">{value.toFixed(1)}</span>
    </div>
  );
}
