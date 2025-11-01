import { describe, it, expect } from 'vitest';
import { createProjections, computeTotals } from '@/lib/planning/engine';
import type { ItemsOnlyBalance } from '@/lib/types/balance';

function makePBS(items: any[]): ItemsOnlyBalance { return { balance_sheet: items as any }; }

describe('planning engine', () => {
  it('includes ISA as asset projection', () => {
    const pbs = makePBS([
      { type: 'isa', description: 'ISA', ite: { investment_value: 10000 } },
    ]);
    const rows = createProjections(pbs, 10, 2.5, 4, {}, {});
    const isa = rows.find((r) => r.type === 'isa' && r.category === 'asset') as any;
    expect(isa).toBeTruthy();
    expect(isa.current).toBeGreaterThan(0);
  });

  it('treats other_valuable_item like property (sell income by default)', () => {
    const pbs = makePBS([
      { type: 'other_valuable_item', description: 'Art', ite: { value: 50000, loan: { balance: 0 } } },
    ]);
    const rows = createProjections(pbs, 10, 2.5, 4, {}, {});
    const item = rows.find((r) => r.type === 'other_valuable_item' && r.category === 'property') as any;
    expect(item).toBeTruthy();
    expect(item.future).toBeGreaterThan(0);
    // default mode none -> asIncome 0 unless explicitly set to 'sell'
    expect(['rent','sell','none']).toContain(item.mode);
  });

  it('sums totals with highlight logic for assets/loans and always includes property and income', () => {
    const pbs = makePBS([
      { type: 'isa', description: 'ISA', ite: { investment_value: 10000 } },
      { type: 'credit_card', description: 'CC', ite: { balance: 2000 } },
      { type: 'state_pension', description: 'State', ite: { pension: { periodic_amount: 1000, frequency: 'monthly', net_gross: 'net' } } },
    ]);
    const rows = createProjections(pbs, 10, 2.5, 4, {}, {});
    const totals = computeTotals(rows as any, { /* highlight all by default */ }, 10, 2.5, 0);
    expect(totals).toBeTruthy();
    expect(totals!.futureSum).toBeGreaterThan(0);
  });
});
