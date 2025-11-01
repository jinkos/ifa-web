"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import { loadIdentity } from '@/lib/api/identity';
import { loadBalanceSheet } from '@/lib/api/balance';
import type { IdentityState } from '@/lib/types/identity';
import type { ItemsOnlyBalance, PersonalBalanceSheetItem, BalanceSheetItemKind } from '@/lib/types/balance';
import { annualiseTarget, computeYearsToRetirement } from '@/app/(dashboard)/dashboard/planning/selectors';
import { createProjections, computeTotals } from '@/lib/planning/engine';
import type { ForwardValueAssumptions } from '@/lib/planning/calculator';
import ProjectionList from './components/ProjectionList';
import SettingsBar from './components/SettingsBar';
import TotalsCard from './components/TotalsCard';
import { loadPlanningSettings, savePlanningSettings, type PlanningSettings } from '@/lib/api/planning';

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
  const [identityTargetCF, setIdentityTargetCF] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [pbs, setPbs] = useState<ItemsOnlyBalance | null>(null);
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
        const [identity, balance, planning] = await Promise.all([
          loadIdentity<IdentityState>(team.id, selectedClient.client_id).catch(() => ({} as any)),
          loadBalanceSheet<any>(team.id, selectedClient.client_id).catch(() => ({} as any)),
          loadPlanningSettings(team.id, selectedClient.client_id).catch(() => ({} as PlanningSettings)),
        ]);
        if (!ignore) {
          const dobVal = (identity as any)?.date_of_birth ?? '';
          setDob(dobVal && typeof dobVal === 'string' ? dobVal : null);
          const ta2 = (identity as any)?.target_retirement_age;
          setTargetAge(typeof ta2 === 'number' ? ta2 : (ta2 == null ? null : Number(ta2)));
          setIdentityTargetCF((identity as any)?.target_retirement_income ?? null);
          let bs = (balance as any)?.balance_sheet as PersonalBalanceSheetItem[] | undefined;
          // One-time id backfill: if any items lack id, trigger a save to assign server integer ids, then reload
          if (bs && Array.isArray(bs) && bs.some((it: any) => it?.id == null || it?.id === '')) {
            try {
              await import('@/lib/api/balance').then(async ({ saveBalanceSheet, loadBalanceSheet: reload }) => {
                await saveBalanceSheet(team.id!, selectedClient.client_id!, { balance_sheet: bs! } as any);
                const reloaded = await reload<any>(team.id!, selectedClient.client_id!);
                bs = (reloaded as any)?.balance_sheet as any[] | undefined;
              });
            } catch {
              // ignore; fall back to current bs
            }
          }
          setPbs(bs && Array.isArray(bs) ? ({ balance_sheet: bs } as ItemsOnlyBalance) : null);

          // Apply planning settings if present (server values take precedence over local defaults)
          if (planning && typeof planning === 'object') {
            if (typeof planning.inflationPct === 'number') setInflationPct(planning.inflationPct);
            if (typeof planning.incomeEquivalentPct === 'number') setIncomeEquivalentPct(planning.incomeEquivalentPct);
            if (planning.itemAssumptions && typeof planning.itemAssumptions === 'object') setItemAssumptions(planning.itemAssumptions as any);
            if (planning.propertyMode && typeof planning.propertyMode === 'object') setPropertyMode(planning.propertyMode as any);
            if (planning.incomeHighlight && typeof planning.incomeHighlight === 'object') setIncomeHighlight(planning.incomeHighlight as any);
          }
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

  // Persist to server (Supabase) when settings change and IDs are known
  useEffect(() => {
    if (!team?.id || !selectedClient?.client_id) return;
    // Don't save until after local state is hydrated to avoid clobbering server with defaults
    if (!lsHydrated) return;
    const payload: PlanningSettings = {
      version: 1,
      inflationPct,
      incomeEquivalentPct,
      itemAssumptions,
      incomeHighlight,
      propertyMode,
    };
    // Fire-and-forget; errors can be surfaced later in a toast if desired
    savePlanningSettings(team.id, selectedClient.client_id, payload).catch(() => {});
  }, [lsHydrated, team?.id, selectedClient?.client_id, inflationPct, incomeEquivalentPct, itemAssumptions, incomeHighlight, propertyMode]);



  const yearsToRetirement = useMemo(() => computeYearsToRetirement(dob, targetAge), [dob, targetAge]);

  // Helper to annualise a cashflow-like object from PBS target_retirement_income
  // annualiseTarget moved to selectors.ts for testing

  const targetIncomeAnnual = useMemo(() => {
    return Math.round(annualiseTarget(identityTargetCF) || 0);
  }, [identityTargetCF]);

  const missing: string[] = useMemo(() => {
    const m: string[] = [];
    if (!dob) m.push('date of birth');
    if (targetAge == null) m.push('target retirement age');
    return m;
  }, [dob, targetAge]);

  const handleInflationChange = (v: number) => {
    setInflationPct(v);
    try { localStorage.setItem(storageKey('inflationPct'), String(v)); } catch {}
  };

  const handleWithdrawalChange = (v: number) => {
    setIncomeEquivalentPct(v);
    try { localStorage.setItem(storageKey('withdrawalPct'), String(v)); } catch {}
  };

  const handleReset = () => {
    const ok = typeof window !== 'undefined' ? window.confirm('Reset planning settings for this client?') : true;
    if (!ok) return;
    try {
      ['inflationPct', 'withdrawalPct', 'itemAssumptions', 'propertyMode', 'incomeHighlight']
        .forEach((k) => {
          try { localStorage.removeItem(storageKey(k)); } catch {}
        });
    } catch {}
    setInflationPct(2.5);
    setIncomeEquivalentPct(4);
    setItemAssumptions({});
    setPropertyMode({});
    setIncomeHighlight({});
  };

  // Inclusion rules moved to lib/planning/catalog via engine

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
      case 'other_valuable_item':
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
    return createProjections(
      pbs,
      yearsToRetirement,
      inflationPct,
      incomeEquivalentPct,
      itemAssumptions,
      propertyMode,
    ) as any[];
  }, [pbs?.balance_sheet, yearsToRetirement, inflationPct, incomeEquivalentPct, itemAssumptions, propertyMode]);

  const totals = useMemo(() => {
    return computeTotals(
      projections as any[],
      incomeHighlight,
      yearsToRetirement,
      inflationPct,
      targetIncomeAnnual,
    ) as any;
  }, [projections, incomeHighlight, inflationPct, yearsToRetirement, targetIncomeAnnual]);

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
          {/* Top info row */}
          <div className="mb-6">
            {selectedClient && team ? (
              <div className="border rounded-md p-4 bg-white dark:bg-black">
                <SettingsBar
                  loading={loading}
                  yearsToRetirement={yearsToRetirement}
                  inflationPct={inflationPct}
                  onInflationChange={handleInflationChange}
                  incomeEquivalentPct={incomeEquivalentPct}
                  onIncomeEquivalentChange={handleWithdrawalChange}
                  onReset={handleReset}
                  missing={missing}
                />
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
                <div>
                  {/* Totals row */}
                  <TotalsCard totals={totals as any} targetIncomeAnnual={targetIncomeAnnual} />
                  <ProjectionList
                    rows={projections as any}
                    itemAssumptions={itemAssumptions}
                    incomeHighlight={incomeHighlight}
                    propertyMode={propertyMode}
                    defaults={{
                      annual_growth_rate: DEFAULTS.annual_growth_rate,
                      contribution_growth_rate: DEFAULTS.contribution_growth_rate,
                      loan_interest_rate: 0.05,
                      tax_rate: 0.2,
                      above_inflation_growth_rate: 0.01,
                    }}
                    setItemAssumptions={setItemAssumptions}
                    setIncomeHighlight={setIncomeHighlight}
                    setPropertyMode={setPropertyMode}
                  />
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
