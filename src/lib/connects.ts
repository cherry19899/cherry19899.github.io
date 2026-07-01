// Connects economy — shared client-side rules (also enforced server-side).
export const POST_JOB_COST = 1;

// Applying costs 1 connect per 50π of budget, minimum 1.
export function applyCostFor(budget: number | string | undefined): number {
  const b = Number(budget) || 0;
  return Math.max(1, Math.ceil(b / 50));
}
