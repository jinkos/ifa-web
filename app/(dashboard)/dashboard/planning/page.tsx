"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import { loadIdentity } from '@/lib/api/identity';
import { loadBalanceSheet } from '@/lib/api/balance';
import type { IdentityState } from '@/lib/types/identity';
import type { BalancePersonSummary, PersonalBalanceSheetItem, BalanceSheetItemKind } from '@/lib/types/balance';
import { BalanceSheetItemProjector } from './planning_item_claculator';
import type { ForwardValueAssumptions } from './planning_item_claculator';

function calcAgeYears(dobISO: string, today = new Date()): number | null {
  const dob = new Date(dobISO);
  if (isNaN(dob.getTime())) return null;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age < 0 ? null : age;
}

export default function PlanningPage() {
  const { selectedClient } = useSelectedClient();
  const { team } = useTeam();
  const [activeTab, setActiveTab] = useState<'pension' | 'cashflow'>('pension');
  const [dob, setDob] = useState<string | null>(null);
  const [targetAge, setTargetAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pbs, setPbs] = useState<BalancePersonSummary | null>(null);
  const [inflationPct, setInflationPct] = useState<number>(2.5); // editable inflation rate (%)
  const [incomeEquivalentPct, setIncomeEquivalentPct] = useState<number>(4); // editable income equivalent (%)
  const [itemAssumptions, setItemAssumptions] = useState<Record<string, Partial<ForwardValueAssumptions>>>({});
  const [incomeHighlight, setIncomeHighlight] = useState<Record<string, boolean>>({});
  const [propertyMode, setPropertyMode] = useState<Record<string, 'rent' | 'sell' | 'none'>>({});
  // Gate saving effects until after first load to avoid clobbering stored values with defaults
  const [lsHydrated, setLsHydrated] = useState(false);

  const DEFAULTS: Pick<ForwardValueAssumptions, 'annual_growth_rate' | 'contribution_growth_rate'> = {
    annual_growth_rate: 0.04,
    contribution_growth_rate: 0.03,
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!team?.id || !selectedClient?.client_id) return;
      setLoading(true);
      try {
        const [identity, balance] = await Promise.all([
          loadIdentity<IdentityState>(team.id, selectedClient.client_id).catch(() => ({} as any)),
          loadBalanceSheet<BalancePersonSummary>(team.id, selectedClient.client_id).catch(() => ({} as any)),
        ]);
        if (!ignore) {
          const dobVal = (identity as any)?.date_of_birth ?? '';
          setDob(dobVal && typeof dobVal === 'string' ? dobVal : null);
          const ta = (balance as any)?.target_retirement_age;
          setTargetAge(typeof ta === 'number' ? ta : (ta == null ? null : Number(ta)));
          const bs = (balance as any)?.balance_sheet as PersonalBalanceSheetItem[] | undefined;
          setPbs(bs && Array.isArray(bs) ? ({ ...(balance as any), balance_sheet: bs } as BalancePersonSummary) : null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [team?.id, selectedClient?.client_id]);

  // Local persistence helpers (per team/client)
  const storageKey = (name: string, override?: { teamId?: string | number | null; clientId?: string | number | null }) => {
    const teamId = (override?.teamId ?? team?.id) ?? 'no-team';
    const clientId = (override?.clientId ?? selectedClient?.client_id) ?? 'no-client';
    return `planning:${teamId}:${clientId}:${name}`;
  };
  const safeParse = <T,>(raw: string | null): T | undefined => {
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  };

  // Load persisted UI state when team/client is available
  useEffect(() => {
    // Attempt to load for resolved team/client, with a fallback to anonymous key for continuity
    const loadFrom = (teamId?: string | number | null, clientId?: string | number | null) => {
      const infRaw = localStorage.getItem(storageKey('inflationPct', { teamId, clientId }));
      if (infRaw != null) {
        const inf = Number(infRaw);
        if (Number.isFinite(inf) && inf >= 0) setInflationPct(inf);
      }
      const wrRaw = localStorage.getItem(storageKey('withdrawalPct', { teamId, clientId }));
      if (wrRaw != null) {
        const wr = Number(wrRaw);
        if (Number.isFinite(wr) && wr >= 0) setIncomeEquivalentPct(wr);
      }
      const ia = safeParse<Record<string, Partial<ForwardValueAssumptions>>>(localStorage.getItem(storageKey('itemAssumptions', { teamId, clientId })));
      if (ia && typeof ia === 'object') setItemAssumptions(ia);
      const pm = safeParse<Record<string, 'rent' | 'sell' | 'none'>>(localStorage.getItem(storageKey('propertyMode', { teamId, clientId })));
      if (pm && typeof pm === 'object') setPropertyMode(pm);
      const ih = safeParse<Record<string, boolean>>(localStorage.getItem(storageKey('incomeHighlight', { teamId, clientId })));
      if (ih && typeof ih === 'object') setIncomeHighlight(ih);
    };

    try {
      if (team?.id && selectedClient?.client_id) {
        // Primary load for real IDs
        loadFrom(team.id, selectedClient.client_id);
        // If nothing exists, try fallback and migrate
        const hadPrimary = localStorage.getItem(storageKey('inflationPct')) != null
          || localStorage.getItem(storageKey('withdrawalPct')) != null
          || localStorage.getItem(storageKey('itemAssumptions')) != null
          || localStorage.getItem(storageKey('propertyMode')) != null
          || localStorage.getItem(storageKey('incomeHighlight')) != null;
        if (!hadPrimary) {
          // Load from fallback
          loadFrom('no-team', 'no-client');
          // Migrate to primary keys if fallback existed
          const migrate = (name: string) => {
            const raw = localStorage.getItem(storageKey(name, { teamId: 'no-team', clientId: 'no-client' }));
            if (raw != null) localStorage.setItem(storageKey(name), raw);
          };
          ['inflationPct', 'withdrawalPct', 'itemAssumptions', 'propertyMode', 'incomeHighlight'].forEach(migrate);
        }
      } else {
        // Early load before IDs resolve (fallback)
        loadFrom('no-team', 'no-client');
      }
      setLsHydrated(true);
    } catch {
      // ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id, selectedClient?.client_id]);

  // Persist on changes (globals)
  useEffect(() => {
    if (!lsHydrated) return;
    try { localStorage.setItem(storageKey('inflationPct'), String(inflationPct ?? 0)); } catch {}
  }, [lsHydrated, inflationPct, team?.id, selectedClient?.client_id]);
  useEffect(() => {
    if (!lsHydrated) return;
    try { localStorage.setItem(storageKey('withdrawalPct'), String(incomeEquivalentPct ?? 0)); } catch {}
  }, [lsHydrated, incomeEquivalentPct, team?.id, selectedClient?.client_id]);

  // Persist on changes (maps)
  useEffect(() => {
    if (!lsHydrated) return;
    try { localStorage.setItem(storageKey('itemAssumptions'), JSON.stringify(itemAssumptions ?? {})); } catch {}
  }, [lsHydrated, itemAssumptions, team?.id, selectedClient?.client_id]);
  useEffect(() => {
    if (!lsHydrated) return;
    try { localStorage.setItem(storageKey('propertyMode'), JSON.stringify(propertyMode ?? {})); } catch {}
  }, [lsHydrated, propertyMode, team?.id, selectedClient?.client_id]);
  useEffect(() => {
    if (!lsHydrated) return;
    try { localStorage.setItem(storageKey('incomeHighlight'), JSON.stringify(incomeHighlight ?? {})); } catch {}
  }, [lsHydrated, incomeHighlight, team?.id, selectedClient?.client_id]);



  const yearsToRetirement = useMemo(() => {
    if (!dob || targetAge == null) return null;
    const age = calcAgeYears(dob);
    if (age == null) return null;
    const years = targetAge - age;
    return years < 0 ? 0 : years;
  }, [dob, targetAge]);

  // Helper to annualise a cashflow-like object from PBS target_retirement_income
  const annualiseTarget = (cf: any | undefined | null): number => {
    if (!cf) return 0;
    const amt = Number(cf?.periodic_amount ?? cf?.amount ?? 0) || 0;
    const freq = cf?.frequency as string | undefined;
    switch (freq) {
      case 'weekly': return amt * 52;
      case 'monthly': return amt * 12;
      case 'quarterly': return amt * 4;
      case 'six_monthly': return amt * 2;
      case 'annually': return amt * 1;
      default: return amt; // if unknown, treat as annual amount already
    }
  };

  const targetIncomeAnnual = useMemo(() => {
    const tri = (pbs as any)?.target_retirement_income;
    return Math.round(annualiseTarget(tri) || 0);
  }, [pbs]);

  const missing: string[] = useMemo(() => {
    const m: string[] = [];
    if (!dob) m.push('date of birth');
    if (targetAge == null) m.push('target retirement age');
    return m;
  }, [dob, targetAge]);

  const investmentKinds: BalanceSheetItemKind[] = useMemo(
    () => [
      'current_account',
      'gia',
      'premium_bond',
      'savings_account',
      'uni_fees_savings_plan',
      'vct',
      'workplace_pension',
      'personal_pension',
    ],
    []
  );

  const incomeOnlyPensionKinds: BalanceSheetItemKind[] = useMemo(
    () => ['state_pension', 'defined_benefit_pension'],
    []
  );

  // Reuse the same background colors as Balance Sheet
  const getItemBg = (t: BalanceSheetItemKind): string => {
    switch (t) {
      case 'salary_income':
      case 'side_hustle_income':
      case 'self_employment_income':
        return 'bg-emerald-100 border-emerald-300'; // Income
      case 'buy_to_let':
        return 'bg-orange-100 border-orange-300'; // Buy-to-let
      case 'current_account':
      case 'gia':
      case 'isa':
      case 'premium_bond':
      case 'savings_account':
      case 'uni_fees_savings_plan':
      case 'vct':
        return 'bg-sky-100 border-sky-300'; // Investments
      case 'credit_card':
      case 'personal_loan':
      case 'student_loan':
        return 'bg-rose-100 border-rose-300'; // Loans
      case 'main_residence':
      case 'holiday_home':
      case 'car':
        return 'bg-amber-100 border-amber-300'; // Properties
      case 'workplace_pension':
      case 'defined_benefit_pension':
      case 'personal_pension':
      case 'state_pension':
        return 'bg-violet-100 border-violet-300'; // Pensions
      default:
        return 'bg-muted/30';
    }
  };

  const projections = useMemo(() => {
    if (!pbs?.balance_sheet || yearsToRetirement == null) return [] as any[];

    const assets = pbs.balance_sheet
      .filter((it) => investmentKinds.includes(it.type))
      .map((it, idx) => {
        const key = String((it as any)?.id ?? (it as any)?.__localId ?? `a${idx}`);
        const projector = new BalanceSheetItemProjector(it, itemAssumptions[key]);
        const current = Math.round(projector.currentValue() || 0);
        const future = Math.round(
          projector.project(yearsToRetirement).future_capital_value || 0
        );
        const deflator = Math.pow(1 + (inflationPct || 0) / 100, yearsToRetirement);
        const futureToday = Math.round(future / (deflator || 1));
        const asIncome = Math.round(
          futureToday * (Number.isFinite(incomeEquivalentPct) ? incomeEquivalentPct : 0) / 100
        );
        const hasContribution = !!((it as any)?.ite?.contribution?.periodic_amount);
        return {
          category: 'asset' as const,
          id: (it as any)?.id ?? (it as any)?.__localId,
          type: it.type,
          description: (it as any)?.description ?? null,
          current,
          future,
          futureToday,
          asIncome,
          key,
          hasContribution,
        };
      });

    const incomes = pbs.balance_sheet
      .filter((it) => incomeOnlyPensionKinds.includes(it.type))
      .map((it, idx) => {
        const key = String((it as any)?.id ?? (it as any)?.__localId ?? `i${idx}`);
        // Allow per-item overrides of inflation/tax via itemAssumptions
        const projector = new BalanceSheetItemProjector(it, itemAssumptions[key]);
        const proj = projector.project(yearsToRetirement);
        const retirementIncome = Math.round(proj.retirement_income_contribution || 0); // already in today's terms
        return {
          category: 'income' as const,
          id: (it as any)?.id ?? (it as any)?.__localId,
          type: it.type,
          description: (it as any)?.description ?? null,
          income: retirementIncome,
          key,
        };
      });

    const loans = pbs.balance_sheet
      .filter((it) => ['credit_card', 'personal_loan', 'student_loan'].includes(it.type))
      .map((it, idx) => {
        const key = String((it as any)?.id ?? (it as any)?.__localId ?? `l${idx}`);
        const projector = new BalanceSheetItemProjector(it, itemAssumptions[key]);
        const current = Math.round(projector.currentValue() || 0); // negative now
        const future = Math.round(
          projector.project(yearsToRetirement).future_capital_value || 0
        ); // negative at retirement
        const deflator = Math.pow(1 + (inflationPct || 0) / 100, yearsToRetirement);
        const futureToday = Math.round(future / (deflator || 1)); // negative PV
        const asIncome = Math.round(
          futureToday * (Number.isFinite(incomeEquivalentPct) ? incomeEquivalentPct : 0) / 100
        ); // negative income impact
        return {
          category: 'loan' as const,
          id: (it as any)?.id ?? (it as any)?.__localId,
          type: it.type,
          description: (it as any)?.description ?? null,
          current,
          future,
          futureToday,
          asIncome,
          key,
        };
      });

    const properties = pbs.balance_sheet
      .filter((it) => ['main_residence', 'holiday_home', 'buy_to_let'].includes(it.type))
      .map((it, idx) => {
        const key = String((it as any)?.id ?? (it as any)?.__localId ?? `p${idx}`);
        const projector = new BalanceSheetItemProjector(it, itemAssumptions[key]);
        const current = Math.round(projector.currentValue() || 0);
        const proj = projector.project(yearsToRetirement);
        const future = Math.round(proj.future_capital_value || 0); // equity at retirement
        const deflator = Math.pow(1 + (inflationPct || 0) / 100, yearsToRetirement);
        const futureToday = Math.round(future / (deflator || 1));

        let rentToday = 0;
        if (it.type === 'buy_to_let') {
          const rentFutureNet = Math.round((proj.debug?.rentFutureNet as number) || 0);
          rentToday = Math.round(rentFutureNet / (deflator || 1));
        }

        const asIncomeSell = Math.round(
          futureToday * (Number.isFinite(incomeEquivalentPct) ? incomeEquivalentPct : 0) / 100
        );

        // select according to mode (default rent for BTL, none for others)
        const mode = propertyMode[key] ?? (it.type === 'buy_to_let' ? 'rent' : 'none');
        const asIncome = mode === 'rent' ? rentToday : mode === 'sell' ? asIncomeSell : 0;

        return {
          category: 'property' as const,
          id: (it as any)?.id ?? (it as any)?.__localId,
          type: it.type,
          description: (it as any)?.description ?? null,
          current,
          future,
          futureToday,
          asIncome,
          key,
          mode,
          rentToday,
          asIncomeSell,
        };
      });

    return [...assets, ...properties, ...incomes, ...loans];
  }, [pbs?.balance_sheet, yearsToRetirement, investmentKinds, incomeOnlyPensionKinds, inflationPct, incomeEquivalentPct, itemAssumptions, propertyMode]);

  const totals = useMemo(() => {
    if (yearsToRetirement == null) return null as null | any;
    const deflator = Math.pow(1 + (inflationPct || 0) / 100, yearsToRetirement);

    let currentSum = 0;
    let futureSum = 0;
    let todaySum = 0;
    let incomeSum = 0;

    for (const p of projections as any[]) {
      if (p.category === 'asset' || p.category === 'loan' || p.category === 'property') {
        currentSum += p.current || 0;
        futureSum += p.future || 0;
        todaySum += p.futureToday || 0;

        // Income from assets/loans respects highlight
        if (p.category === 'asset' || p.category === 'loan') {
          if (incomeHighlight[p.key] ?? true) incomeSum += p.asIncome || 0;
        }

        // Properties already encode selection in asIncome (0 when None)
        if (p.category === 'property') {
          incomeSum += p.asIncome || 0;
        }
      } else if (p.category === 'income') {
        // Already in today's terms
        incomeSum += p.income || 0;
      }
    }

    return { currentSum, futureSum, todaySum, incomeSum };
  }, [projections, incomeHighlight, inflationPct, yearsToRetirement]);

  // Cleanup: prune per-item maps to only current projection keys (avoids stale entries)
  useEffect(() => {
    if (!lsHydrated) return;
    try {
      const keys = new Set((projections as any[]).map((p: any) => String(p.key)));
      const prune = <T extends Record<string, any>>(obj: T): T => {
        const next = Object.fromEntries(Object.entries(obj || {}).filter(([k]) => keys.has(String(k)))) as T;
        return next;
      };

      setItemAssumptions((prev) => {
        const next = prune(prev);
        return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
      });
      setPropertyMode((prev) => {
        const next = prune(prev);
        return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
      });
      setIncomeHighlight((prev) => {
        const next = prune(prev);
        return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
      });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lsHydrated, projections]);

  return (
    <section className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold mb-2">Planning</h1>
      <div className="mb-4 text-lg font-medium">
        {selectedClient ? selectedClient.name : 'No Client Selected'}
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <div className="inline-flex rounded-md border overflow-hidden">
          <button
            className={`px-3 py-1.5 text-sm ${activeTab === 'pension' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-neutral-900'}`}
            onClick={() => setActiveTab('pension')}
          >
            Pension Planning
          </button>
          <button
            className={`px-3 py-1.5 text-sm border-l ${activeTab === 'cashflow' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-neutral-900'}`}
            onClick={() => setActiveTab('cashflow')}
          >
            Cash Flow Analysis
          </button>
        </div>
      </div>

      {activeTab === 'pension' ? (
        <>
          {/* Top info row: Years to retirement, Inflation, Income Equivalent */}
          <div className="mb-6">
            {selectedClient && team ? (
              <div className="border rounded-md p-4 bg-white dark:bg-black">
                {loading ? (
                  <div className="text-muted-foreground">Loading…</div>
                ) : yearsToRetirement != null ? (
                  <div className="flex flex-wrap items-end gap-8">
                    {/* Years to retirement */}
                    <div className="flex flex-col gap-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Years to retirement</div>
                      <div className="text-3xl font-semibold text-blue-700">{yearsToRetirement}</div>
                    </div>

                    {/* Inflation rate */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="inflation-rate" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inflation rate</label>
                      <div className="flex items-center gap-2">
                        <input
                          id="inflation-rate"
                          type="number"
                          step="0.1"
                          min={0}
                          className="w-28 rounded-md border px-2 py-1 bg-white dark:bg-black"
                          value={Number.isFinite(inflationPct) ? inflationPct : ''}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            const next = Number.isFinite(v) ? Math.max(0, v) : 0;
                            setInflationPct(next);
                            try { localStorage.setItem(storageKey('inflationPct'), String(next)); } catch {}
                          }}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>

                    {/* Sustainable investment withdrawal rate */}
                    <div className="flex flex-col gap-1">
                      <label htmlFor="income-equivalent" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sustainable investment withdrawal rate</label>
                      <div className="flex items-center gap-2">
                        <input
                          id="income-equivalent"
                          type="number"
                          step="0.1"
                          min={0}
                          className="w-28 rounded-md border px-2 py-1 bg-white dark:bg-black"
                          value={Number.isFinite(incomeEquivalentPct) ? incomeEquivalentPct : ''}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            const next = Number.isFinite(v) ? Math.max(0, v) : 0;
                            setIncomeEquivalentPct(next);
                            try { localStorage.setItem(storageKey('withdrawalPct'), String(next)); } catch {}
                          }}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>

                    {/* Reset planning settings */}
                    <div className="ml-auto">
                      <button
                        className="px-3 py-1.5 text-xs rounded-md border border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => {
                          const ok = window.confirm('Reset planning settings for this client?');
                          if (!ok) return;
                          try {
                            // Clear current scope keys
                            ['inflationPct', 'withdrawalPct', 'itemAssumptions', 'propertyMode', 'incomeHighlight']
                              .forEach((k) => {
                                try { localStorage.removeItem(storageKey(k)); } catch {}
                              });
                          } catch {}
                          // Reset in-memory state
                          setInflationPct(2.5);
                          setIncomeEquivalentPct(4);
                          setItemAssumptions({});
                          setPropertyMode({});
                          setIncomeHighlight({});
                        }}
                        title="Clear all planning inputs and assumptions for this client"
                      >
                        Reset settings
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-700">
                    No planning can be done without {missing.join(' and ')}.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground">Select a client to see planning details.</div>
            )}
          </div>

          {/* Forward value summary for investments/pensions */}
          {selectedClient && team && yearsToRetirement != null ? (
            <div className="mt-6 border rounded-md bg-white dark:bg-black">
              <div className="px-4 py-3 border-b font-medium">Projected values at retirement</div>
              {loading ? (
                <div className="p-4 text-muted-foreground">Loading…</div>
              ) : projections.length > 0 ? (
                <div className="p-4 grid grid-cols-1 gap-4">
                  {/* Totals row */}
                  {totals ? (
                    <div className="rounded-md border p-3 bg-white dark:bg-neutral-950">
                      <div className="flex flex-wrap items-end justify-between gap-6 text-sm">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Current</div>
                          <div className={`tabular-nums font-semibold ${totals.currentSum < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{totals.currentSum.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Future</div>
                          <div className={`tabular-nums font-semibold ${totals.futureSum < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{totals.futureSum.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Today</div>
                          <div className={`tabular-nums font-semibold ${totals.todaySum < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{totals.todaySum.toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Income</div>
                          <div className={`tabular-nums text-lg font-bold ${ (totals.incomeSum < 0 || (targetIncomeAnnual > 0 && totals.incomeSum < targetIncomeAnnual)) ? 'text-red-700' : 'text-blue-700'}`}>{totals.incomeSum.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {projections.map((p: any) => {
                    const effGrowthPct = ((itemAssumptions[p.key]?.annual_growth_rate ?? DEFAULTS.annual_growth_rate) * 100).toFixed(2);
                    const effContribPct = ((itemAssumptions[p.key]?.contribution_growth_rate ?? DEFAULTS.contribution_growth_rate) * 100).toFixed(2);
                    return (
                      <div key={p.key} className={`rounded-md border p-3 ${getItemBg(p.type)} dark:bg-neutral-950`}>
                        {/* Top line: name + values */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium capitalize">{p.type.replaceAll('_', ' ')}</div>
                            {p.description ? (
                              <div className="text-xs text-muted-foreground">{p.description}</div>
                            ) : null}
                          </div>
                          {p.category === 'asset' ? (
                            <div className="flex items-end gap-6 text-sm">
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Current</div>
                                <div className={`tabular-nums font-medium ${p.current < 0 ? 'text-red-700' : ''}`}>{p.current.toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Future</div>
                                <div className={`tabular-nums font-medium ${p.future < 0 ? 'text-red-700' : ''}`}>{p.future.toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Today</div>
                                <div className={`tabular-nums font-medium ${p.futureToday < 0 ? 'text-red-700' : ''}`}>{p.futureToday.toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="text-xs text-muted-foreground">As Income</div>
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={(incomeHighlight[p.key] ?? true)}
                                    onChange={(e) =>
                                      setIncomeHighlight((prev) => ({ ...prev, [p.key]: e.target.checked }))
                                    }
                                    title="Toggle highlight"
                                  />
                                </div>
                                <div
                                  className={
                                    `tabular-nums font-semibold ` +
                                    ((incomeHighlight[p.key] ?? true) ? 'text-emerald-700' : 'text-muted-foreground')
                                  }
                                >
                                  {p.asIncome.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ) : p.category === 'property' ? (
                            <div className="flex items-end gap-6 text-sm">
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Current</div>
                                <div className={`tabular-nums font-medium ${p.current < 0 ? 'text-red-700' : ''}`}>{p.current.toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Future</div>
                                <div className={`tabular-nums font-medium ${p.future < 0 ? 'text-red-700' : ''}`}>{p.future.toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Today</div>
                                <div className={`tabular-nums font-medium ${p.futureToday < 0 ? 'text-red-700' : ''}`}>{p.futureToday.toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <div className="text-xs text-muted-foreground">Income mode</div>
                                  {p.type === 'buy_to_let' ? (
                                    <div className="inline-flex rounded-md border overflow-hidden">
                                      {(['rent','sell','none'] as const).map((m) => (
                                        <button
                                          key={m}
                                          className={`px-2 py-1 text-xs ${p.mode === m ? 'bg-emerald-600 text-white' : 'bg-white/70 dark:bg-neutral-900'}`}
                                          onClick={() => setPropertyMode((prev) => ({ ...prev, [p.key]: m }))}
                                        >
                                          {m === 'rent' ? 'Rent' : m === 'sell' ? 'Sell' : 'None'}
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="inline-flex rounded-md border overflow-hidden">
                                      {(['sell','none'] as const).map((m) => (
                                        <button
                                          key={m}
                                          className={`px-2 py-1 text-xs ${p.mode === m ? 'bg-emerald-600 text-white' : 'bg-white/70 dark:bg-neutral-900'}`}
                                          onClick={() => setPropertyMode((prev) => ({ ...prev, [p.key]: m }))}
                                        >
                                          {m === 'sell' ? 'Sell' : 'None'}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className={`tabular-nums font-semibold ${p.asIncome > 0 ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                                  {p.asIncome.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ) : p.category === 'income' ? (
                            <div className="flex items-end gap-6 text-sm">
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Income</div>
                                <div className="tabular-nums font-semibold text-emerald-700">{p.income.toLocaleString()}</div>
                                <div className="text-[10px] text-muted-foreground mt-0.5">Shown in today's money</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-end gap-6 text-sm">
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Current</div>
                                <div className={`tabular-nums font-medium ${p.current < 0 ? 'text-red-700' : ''}`}>{p.current.toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Future</div>
                                <div className={`tabular-nums font-medium ${p.future < 0 ? 'text-red-700' : ''}`}>{p.future.toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">Today</div>
                                <div className={`tabular-nums font-medium ${p.futureToday < 0 ? 'text-red-700' : ''}`}>{p.futureToday.toLocaleString()}</div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="text-xs text-muted-foreground">As Income</div>
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={(incomeHighlight[p.key] ?? true)}
                                    onChange={(e) =>
                                      setIncomeHighlight((prev) => ({ ...prev, [p.key]: e.target.checked }))
                                    }
                                    title="Toggle highlight"
                                  />
                                </div>
                                <div
                                  className={
                                    `tabular-nums font-semibold ` +
                                    ((incomeHighlight[p.key] ?? true)
                                      ? (p.asIncome < 0 ? 'text-red-700' : 'text-emerald-700')
                                      : 'text-muted-foreground')
                                  }
                                >
                                  {p.asIncome.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Second line: per-item assumptions */}
                        <div className="mt-3 pt-3 border-t">
                          {p.category === 'asset' ? (
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <span className="text-muted-foreground">Assumptions</span>
                              <label className="inline-flex items-center gap-2">
                                <span>Growth %</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-24 rounded-md border px-2 py-1 bg-white dark:bg-black text-right"
                                  value={effGrowthPct}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setItemAssumptions((prev) => ({
                                      ...prev,
                                      [p.key]: {
                                        ...prev[p.key],
                                        annual_growth_rate: Number.isFinite(v) ? Math.max(0, v) / 100 : undefined,
                                      },
                                    }));
                                  }}
                                />
                              </label>
                              {p.hasContribution ? (
                                <label className="inline-flex items-center gap-2">
                                  <span>Contribution growth %</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="w-28 rounded-md border px-2 py-1 bg-white dark:bg-black text-right"
                                    value={effContribPct}
                                    onChange={(e) => {
                                      const v = parseFloat(e.target.value);
                                      setItemAssumptions((prev) => ({
                                        ...prev,
                                        [p.key]: {
                                          ...prev[p.key],
                                          contribution_growth_rate: Number.isFinite(v) ? Math.max(0, v) / 100 : undefined,
                                        },
                                      }));
                                    }}
                                  />
                                </label>
                              ) : null}
                            </div>
                          ) : p.category === 'property' ? (
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <span className="text-muted-foreground">Assumptions</span>
                              <label className="inline-flex items-center gap-2">
                                <span>Growth %</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-24 rounded-md border px-2 py-1 bg-white dark:bg-black text-right"
                                  value={(((itemAssumptions[p.key]?.annual_growth_rate) ?? DEFAULTS.annual_growth_rate) * 100).toFixed(2)}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setItemAssumptions((prev) => ({
                                      ...prev,
                                      [p.key]: {
                                        ...prev[p.key],
                                        annual_growth_rate: Number.isFinite(v) ? Math.max(0, v) / 100 : undefined,
                                      },
                                    }));
                                  }}
                                />
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <span>Loan interest %</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-28 rounded-md border px-2 py-1 bg-white dark:bg-black text-right"
                                  value={(((itemAssumptions[p.key]?.loan_interest_rate) ?? 0.05) * 100).toFixed(2)}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setItemAssumptions((prev) => ({
                                      ...prev,
                                      [p.key]: {
                                        ...prev[p.key],
                                        loan_interest_rate: Number.isFinite(v) ? Math.max(0, v) / 100 : undefined,
                                      },
                                    }));
                                  }}
                                />
                              </label>
                              <label className="inline-flex items-center gap-2">
                                <span>Tax rate %</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-24 rounded-md border px-2 py-1 bg-white dark:bg-black text-right"
                                  value={(((itemAssumptions[p.key]?.tax_rate) ?? 0.2) * 100).toFixed(2)}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setItemAssumptions((prev) => ({
                                      ...prev,
                                      [p.key]: {
                                        ...prev[p.key],
                                        tax_rate: Number.isFinite(v) ? Math.max(0, v) / 100 : undefined,
                                      },
                                    }));
                                  }}
                                />
                              </label>
                            </div>
                          ) : p.category === 'income' ? (
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <span className="text-muted-foreground">Assumptions</span>
                              <label className="inline-flex items-center gap-2">
                                <span>Above-inflation growth %</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-28 rounded-md border px-2 py-1 bg-white dark:bg-black text-right"
                                  value={(((itemAssumptions[p.key]?.above_inflation_growth_rate) ?? 0.01) * 100).toFixed(2)}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setItemAssumptions((prev) => ({
                                      ...prev,
                                      [p.key]: {
                                        ...prev[p.key],
                                        above_inflation_growth_rate: Number.isFinite(v) ? Math.max(0, v) / 100 : undefined,
                                      },
                                    }));
                                  }}
                                />
                              </label>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <span className="text-muted-foreground">Assumptions</span>
                              <label className="inline-flex items-center gap-2">
                                <span>Interest %</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-24 rounded-md border px-2 py-1 bg-white dark:bg-black text-right"
                                  value={(((itemAssumptions[p.key]?.loan_interest_rate) ?? 0.05) * 100).toFixed(2)}
                                  onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setItemAssumptions((prev) => ({
                                      ...prev,
                                      [p.key]: {
                                        ...prev[p.key],
                                        loan_interest_rate: Number.isFinite(v) ? Math.max(0, v) / 100 : undefined,
                                      },
                                    }));
                                  }}
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-muted-foreground">No investment or pension items to project.</div>
              )}
            </div>
          ) : null}

          <p className="mt-6 text-muted-foreground">More planning tools coming soon.</p>
        </>
      ) : (
        <div className="mt-6 border rounded-md p-4 bg-white dark:bg-black text-muted-foreground">
          Cash Flow Analysis coming soon.
        </div>
      )}
    </section>
  );
}
