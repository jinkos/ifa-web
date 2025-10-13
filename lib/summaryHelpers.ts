// Small helpers factored out from SummaryPage to keep the page file focused on UI
import type { CashflowItem } from './types/summary';

export const normalizeDesc = (s?: string | null) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

export const cashflowEqual = (a?: CashflowItem | null, b?: CashflowItem | null) => {
  const aa = a ?? {} as any;
  const bb = b ?? {} as any;
  return (
    (aa.amount ?? null) === (bb.amount ?? null) &&
    (aa.currency ?? null) === (bb.currency ?? null) &&
    (aa.frequency ?? null) === (bb.frequency ?? null) &&
    (aa.is_gross ?? null) === (bb.is_gross ?? null) &&
    (aa.inflow ?? null) === (bb.inflow ?? null)
  );
};

export const valueEqual = (a?: any | null, b?: any | null) => {
  const aa = a ?? {};
  const bb = b ?? {};
  return (aa.amount ?? null) === (bb.amount ?? null) && (aa.currency ?? null) === (bb.currency ?? null);
};

export const investmentEqual = (a?: any | null, b?: any | null) => {
  const aa = a ?? {};
  const bb = b ?? {};
  return (
    (aa.type ?? null) === (bb.type ?? null) &&
    valueEqual(aa.value ?? null, bb.value ?? null) &&
    cashflowEqual(aa.contribution ?? null, bb.contribution ?? null)
  );
};

export const pensionEqual = (a?: any | null, b?: any | null) => {
  const aa = a ?? {};
  const bb = b ?? {};
  return (
    (aa.type ?? null) === (bb.type ?? null) &&
    valueEqual(aa.value ?? null, bb.value ?? null) &&
    cashflowEqual(aa.contribution ?? null, bb.contribution ?? null)
  );
};

export const debtEqual = (a?: any | null, b?: any | null) => {
  const aa = a ?? {};
  const bb = b ?? {};
  return (
    (aa.type ?? null) === (bb.type ?? null) &&
    valueEqual(aa.balance ?? null, bb.balance ?? null) &&
    cashflowEqual(aa.repayment ?? null, bb.repayment ?? null)
  );
};

export const insuranceEqual = (a?: any | null, b?: any | null) => {
  const aa = a ?? {};
  const bb = b ?? {};
  return (
    (aa.type ?? null) === (bb.type ?? null) &&
    valueEqual(aa.coverage_amount ?? null, bb.coverage_amount ?? null) &&
    cashflowEqual(aa.premium ?? null, bb.premium ?? null)
  );
};

export const isEmptySuggestions = (s: { conflicts: Record<string, unknown>; additions: unknown[]; removals: Set<string> }) =>
  Object.keys(s.conflicts).length === 0 && s.additions.length === 0 && s.removals.size === 0;

export const mkId = (item: any) => ({ ...item, __localId: item && (item.__localId ?? (crypto as any).randomUUID?.() ?? String(Date.now())) });

export default {};
