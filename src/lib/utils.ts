export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function formatBudget(budget: number | string | null | undefined): string {
  if (!budget) return 'N/A';
  return `π${Number(budget).toFixed(2)}`;
}

export function truncate(text: string | null | undefined, len = 120): string {
  if (!text) return '';
  return text.length > len ? text.slice(0, len) + '...' : text;
}

export function getStatusColor(status: string | null | undefined): string {
  switch ((status || '').toLowerCase()) {
    case 'open': return '#27ae60';
    case 'in_progress': return '#f39c12';
    case 'completed': return '#2980b9';
    case 'cancelled': return '#e74c3c';
    case 'pending': return '#f39c12';
    case 'released': return '#27ae60';
    case 'refunded': return '#95a5a6';
    default: return '#7f8c8d';
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms = 300): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
