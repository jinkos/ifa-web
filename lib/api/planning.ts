import type { ForwardValueAssumptions } from '@/lib/planning/calculator';

export type PropertyMode = 'rent' | 'sell' | 'none';

export interface PlanningSettings {
  version?: number;
  inflationPct?: number; // % e.g. 2.5
  incomeEquivalentPct?: number; // % e.g. 4
  itemAssumptions?: Record<string, Partial<ForwardValueAssumptions>>;
  incomeHighlight?: Record<string, boolean>;
  propertyMode?: Record<string, PropertyMode>;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function normalizeAssumptions(obj: unknown): Record<string, Partial<ForwardValueAssumptions>> | undefined {
  if (!isRecord(obj)) return undefined;
  const out: Record<string, Partial<ForwardValueAssumptions>> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!isRecord(v)) continue;
    const n: Partial<ForwardValueAssumptions> = {};
    if (typeof v.annual_growth_rate === 'number' && Number.isFinite(v.annual_growth_rate)) n.annual_growth_rate = v.annual_growth_rate;
    if (typeof v.contribution_growth_rate === 'number' && Number.isFinite(v.contribution_growth_rate)) n.contribution_growth_rate = v.contribution_growth_rate;
    if (typeof v.inflation_rate === 'number' && Number.isFinite(v.inflation_rate)) n.inflation_rate = v.inflation_rate;
    if (typeof v.loan_interest_rate === 'number' && Number.isFinite(v.loan_interest_rate)) n.loan_interest_rate = v.loan_interest_rate;
    if (typeof v.tax_rate === 'number' && Number.isFinite(v.tax_rate)) n.tax_rate = v.tax_rate;
    if (typeof v.income_generation_rate === 'number' && Number.isFinite(v.income_generation_rate)) n.income_generation_rate = v.income_generation_rate;
    if (typeof v.above_inflation_growth_rate === 'number' && Number.isFinite(v.above_inflation_growth_rate)) n.above_inflation_growth_rate = v.above_inflation_growth_rate;
    if (Object.keys(n).length) out[String(k)] = n;
  }
  return out;
}

function normalizeBooleanMap(obj: unknown): Record<string, boolean> | undefined {
  if (!isRecord(obj)) return undefined;
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'boolean') out[String(k)] = v;
  }
  return out;
}

const PROPERTY_MODES = new Set(['rent', 'sell', 'none'] as const);
function normalizePropertyModeMap(obj: unknown): Record<string, PropertyMode> | undefined {
  if (!isRecord(obj)) return undefined;
  const out: Record<string, PropertyMode> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && PROPERTY_MODES.has(v as any)) out[String(k)] = v as PropertyMode;
  }
  return out;
}

function normalizePlanning(data: unknown): PlanningSettings {
  const d = (isRecord(data) ? data : {}) as Record<string, unknown>;
  // Back-compat: if old key 'withdrawalPct' exists, map to incomeEquivalentPct
  const rawIncomeEq = typeof d.incomeEquivalentPct === 'number' ? d.incomeEquivalentPct
    : typeof d.withdrawalPct === 'number' ? (d.withdrawalPct as number)
    : undefined;
  const inflation = typeof d.inflationPct === 'number' && Number.isFinite(d.inflationPct) ? (d.inflationPct as number) : undefined;
  const incomeEq = typeof rawIncomeEq === 'number' && Number.isFinite(rawIncomeEq) ? rawIncomeEq : undefined;
  const itemAssumptions = normalizeAssumptions(d.itemAssumptions);
  const incomeHighlight = normalizeBooleanMap(d.incomeHighlight);
  const propertyMode = normalizePropertyModeMap(d.propertyMode);
  const version = typeof d.version === 'number' && Number.isFinite(d.version) ? (d.version as number) : 1;
  const out: PlanningSettings = { version };
  if (inflation != null) out.inflationPct = inflation;
  if (incomeEq != null) out.incomeEquivalentPct = incomeEq;
  if (itemAssumptions) out.itemAssumptions = itemAssumptions;
  if (incomeHighlight) out.incomeHighlight = incomeHighlight;
  if (propertyMode) out.propertyMode = propertyMode;
  return out;
}

export async function loadPlanningSettings(teamId: number, clientId: number): Promise<PlanningSettings> {
  const res = await fetch(`/api/planning?teamId=${teamId}&clientId=${clientId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load planning settings');
  const data = await res.json().catch(() => ({}));
  return normalizePlanning(data);
}

export async function savePlanningSettings(teamId: number, clientId: number, payload: PlanningSettings): Promise<void> {
  const res = await fetch(`/api/planning?teamId=${teamId}&clientId=${clientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || 'Failed to save planning settings');
  }
}
