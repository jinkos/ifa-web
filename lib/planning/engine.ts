import type { ItemsOnlyBalance, PersonalBalanceSheetItem } from '@/lib/types/balance';
import { investmentKinds, incomeOnlyPensionKinds, loanKinds, propertyKinds, DEFAULTS } from './catalog';
import type { ProjectionRow, Totals, ItemAssumptions, IncomeHighlightMap, PropertyModeMap } from './types';
import { BalanceSheetItemProjector } from '@/lib/planning/calculator';

function deflator(inflationPct: number, years: number) {
  return Math.pow(1 + (inflationPct || 0) / 100, years);
}

function keyWithPrefix(it: any, prefix: string, index: number) {
  const stable = it?.id ?? it?.__localId;
  if (stable != null) return String(stable);
  return `${prefix}${index}`;
}

export function createProjections(
  pbs: ItemsOnlyBalance | null,
  yearsToRetirement: number | null,
  inflationPct: number,
  incomeEquivalentPct: number,
  itemAssumptions: ItemAssumptions,
  propertyMode: PropertyModeMap
): ProjectionRow[] {
  if (!pbs?.balance_sheet || yearsToRetirement == null) return [];
  const rows: ProjectionRow[] = [];
  const d = deflator(inflationPct, yearsToRetirement);
  let aIdx = 0; // asset index for fallback keys (historical compatibility)
  let iIdx = 0; // income-only pension index
  let lIdx = 0; // loan index
  let pIdx = 0; // property index

  // Assets
  pbs.balance_sheet.forEach((it) => {
    if (!investmentKinds.includes(it.type)) return;
    const key = keyWithPrefix(it, 'a', aIdx++);
    const projector = new BalanceSheetItemProjector(it, itemAssumptions[key]);
    const current = Math.round(projector.currentValue() || 0);
    const future = Math.round(projector.project(yearsToRetirement).future_capital_value || 0);
    const futureToday = Math.round(future / (d || 1));
    const asIncome = Math.round(futureToday * (Number.isFinite(incomeEquivalentPct) ? incomeEquivalentPct : 0) / 100);
    const hasContribution = !!(it as any)?.ite?.contribution?.periodic_amount;
    rows.push({
      category: 'asset', id: (it as any)?.id ?? (it as any)?.__localId, type: it.type, description: (it as any)?.description ?? null,
      current, future, futureToday, asIncome, key, hasContribution,
    });
  });

  // Income-only pensions
  pbs.balance_sheet.forEach((it) => {
    if (!incomeOnlyPensionKinds.includes(it.type)) return;
    const key = keyWithPrefix(it, 'i', iIdx++);
    const projector = new BalanceSheetItemProjector(it, itemAssumptions[key]);
    const proj = projector.project(yearsToRetirement);
    const retirementIncome = Math.round(proj.retirement_income_contribution || 0);
    rows.push({
      category: 'income', id: (it as any)?.id ?? (it as any)?.__localId, type: it.type, description: (it as any)?.description ?? null,
      income: retirementIncome, key,
    });
  });

  // Loans
  pbs.balance_sheet.forEach((it) => {
    if (!loanKinds.includes(it.type)) return;
    const key = keyWithPrefix(it, 'l', lIdx++);
    const projector = new BalanceSheetItemProjector(it, itemAssumptions[key]);
    const current = Math.round(projector.currentValue() || 0);
    const future = Math.round(projector.project(yearsToRetirement).future_capital_value || 0);
    const futureToday = Math.round(future / (d || 1));
    const asIncome = Math.round(futureToday * (Number.isFinite(incomeEquivalentPct) ? incomeEquivalentPct : 0) / 100);
    rows.push({
      category: 'loan', id: (it as any)?.id ?? (it as any)?.__localId, type: it.type, description: (it as any)?.description ?? null,
      current, future, futureToday, asIncome, key,
    });
  });

  // Properties
  pbs.balance_sheet.forEach((it) => {
    if (!propertyKinds.includes(it.type)) return;
    const key = keyWithPrefix(it, 'p', pIdx++);
    const projector = new BalanceSheetItemProjector(it, itemAssumptions[key]);
    const current = Math.round(projector.currentValue() || 0);
    const proj = projector.project(yearsToRetirement);
    const future = Math.round(proj.future_capital_value || 0);
    const futureToday = Math.round(future / (d || 1));

    let rentToday = 0;
    if (it.type === 'buy_to_let') {
      const rentFutureNet = Math.round((proj.debug?.rentFutureNet as number) || 0);
      rentToday = Math.round(rentFutureNet / (d || 1));
    }

    // Withdrawal-style income when in 'sell' mode
    // Requirement: Main residence sell -> treat as gross income (no tax applied here)
    // Other property sells (holiday_home/other_valuable_item) -> keep net-of-tax
    const withdrawalRate = (Number.isFinite(incomeEquivalentPct) ? incomeEquivalentPct : 0) / 100;
    const taxRate = projector.assumptions.tax_rate ?? 0;
    const asIncomeSellGross = Math.round(futureToday * withdrawalRate);
    const asIncomeSellNet = Math.round(futureToday * withdrawalRate * (1 - taxRate));
  const asIncomeSell = (it.type === 'main_residence' || it.type === 'holiday_home') ? asIncomeSellGross : asIncomeSellNet;

  const mode = propertyMode[key] ?? (it.type === 'buy_to_let' ? 'rent' : 'none');
    const asIncome = mode === 'rent' ? rentToday : mode === 'sell' ? asIncomeSell : 0;

    rows.push({
      category: 'property', id: (it as any)?.id ?? (it as any)?.__localId, type: it.type, description: (it as any)?.description ?? null,
      current, future, futureToday, asIncome, key, mode, rentToday, asIncomeSell,
    });
  });

  return rows;
}

export function computeTotals(
  projections: ProjectionRow[],
  incomeHighlight: IncomeHighlightMap,
  yearsToRetirement: number | null,
  inflationPct: number,
  targetIncomeAnnual: number
): Totals | null {
  if (yearsToRetirement == null) return null;

  let currentSum = 0;
  let futureSum = 0;
  let todaySum = 0;
  let incomeSum = 0;

  for (const p of projections) {
    if (p.category === 'asset' || p.category === 'loan' || p.category === 'property') {
      currentSum += p.current || 0;
      futureSum += p.future || 0;
      todaySum += p.futureToday || 0;

      if (p.category === 'asset' || p.category === 'loan') {
        if (incomeHighlight[p.key] ?? true) incomeSum += p.asIncome || 0;
      }
      if (p.category === 'property') {
        incomeSum += p.asIncome || 0;
      }
    } else if (p.category === 'income') {
      incomeSum += p.income || 0;
    }
  }

  return { currentSum, futureSum, todaySum, incomeSum };
}
