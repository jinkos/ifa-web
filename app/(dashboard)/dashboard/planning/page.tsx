"use client";
import { useEffect, useMemo, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import { loadIdentity } from '@/lib/api/identity';
import { loadBalanceSheet } from '@/lib/api/balance';
import type { IdentityState } from '@/lib/types/identity';
import type { ItemsOnlyBalance, PersonalBalanceSheetItem, BalanceSheetItemKind } from '@/lib/types/balance';
import { isIhtAsset, getIhtItemValue } from '@/lib/planning/iht';
import LooseNumberInput, { parseLooseNumber as parseLooseNumberControl } from '@/components/ui/loose-number-input';
import { annualiseTarget, computeYearsToRetirement } from '@/app/(dashboard)/dashboard/planning/selectors';
import { createProjections, computeTotals } from '@/lib/planning/engine';
import type { ForwardValueAssumptions } from '@/lib/planning/calculator';
import ProjectionList from './components/ProjectionList';
import SettingsBar from './components/SettingsBar';
import TotalsCard from './components/TotalsCard';
import PensionSummary from './components/PensionSummary';
import PensionProjections from './components/PensionProjections';
import IhtPlanning from './components/IhtPlanning';
import IhtSummary from './components/IhtSummary';
import CashflowAnalysis from './components/CashflowAnalysis';
import CashflowSummary from './components/CashflowSummary';
import { loadPlanningSettings, savePlanningSettings, type PlanningSettings } from '@/lib/api/planning';
import { getItemBg, getItemKey } from './shared';

// Removed unused calcAgeYears helper (computeYearsToRetirement is used instead)

export default function PlanningPage() {
  const { selectedClient } = useSelectedClient();
  const { team } = useTeam();
  const [activeTab, setActiveTab] = useState<'pension' | 'iht' | 'cashflow'>('pension');
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
  const [ihtIgnore, setIhtIgnore] = useState<Record<string, boolean>>({});
  const [ihtTrust, setIhtTrust] = useState<Record<string, boolean>>({});
  // For editable numeric fields that should allow intermediate text (e.g., '-') we store as strings
  const [netChangeOnDeath, setNetChangeOnDeath] = useState<string>('0');
  const [giftsPrevSevenYears, setGiftsPrevSevenYears] = useState<number>(0);
  const [lifetimeAllowances, setLifetimeAllowances] = useState<number>(0);
  const [giftsToCharityOnDeath, setGiftsToCharityOnDeath] = useState<number>(0);
  const [exemptGiftsAnnual, setExemptGiftsAnnual] = useState<number>(0);
  const [residenceNrbApplying, setResidenceNrbApplying] = useState<number>(0);

  const parseLooseNumber = parseLooseNumberControl;
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

  // Derived values used across tabs
  const yearsToRetirement = useMemo(() => computeYearsToRetirement(dob, targetAge), [dob, targetAge]);
  const targetIncomeAnnual = useMemo(() => {
    return Math.round(annualiseTarget(identityTargetCF) || 0);
  }, [identityTargetCF]);

  const missing: string[] = useMemo(() => {
    const m: string[] = [];
    if (!dob) m.push('date of birth');
    if (targetAge == null) m.push('target retirement age');
    return m;
  }, [dob, targetAge]);

  // Handlers for settings controls (used by PensionPlanning)
  const handleInflationChange = (v: number) => {
    setInflationPct(v);
  };

  const handleWithdrawalChange = (v: number) => {
    setIncomeEquivalentPct(v);
  };

  const handleReset = () => {
    const ok = typeof window !== 'undefined' ? window.confirm('Reset planning settings for this client?') : true;
    if (!ok) return;
    try {
      // Persisted settings are managed via planning settings API; local storage clearing not required
    } catch {}
    setInflationPct(2.5);
    setIncomeEquivalentPct(4);
    setItemAssumptions({});
    setPropertyMode({});
    setIncomeHighlight({});
  };

  // Inclusion rules moved to lib/planning/catalog via engine


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

  // Consistent key derivation for PBS items (use id, then __localId, else index)
  const pbsItems: any[] = (pbs?.balance_sheet as any[]) || [];

  // Cleanup: prune per-item maps to only current projection keys (avoids stale entries)
  useEffect(() => {
    if (!lsHydrated) return;
    try {
      const projectionKeys = new Set((projections as any[]).map((p: any) => String(p.key)));
      const pruneByProjection = <T extends Record<string, any>>(obj: T): T => {
        const next = Object.fromEntries(Object.entries(obj || {}).filter(([k]) => projectionKeys.has(String(k)))) as T;
        return next;
      };

      // For IHT ignore, use PBS item identifiers rather than projection keys
      const pbsKeys = new Set(pbsItems.map((it: any, idx: number) => getItemKey(it, idx)));
      const pruneByPbs = <T extends Record<string, any>>(obj: T): T => {
        const next = Object.fromEntries(Object.entries(obj || {}).filter(([k]) => pbsKeys.has(String(k)))) as T;
        return next;
      };

      setItemAssumptions((prev) => {
        const next = pruneByProjection(prev);
        return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
      });
      setPropertyMode((prev) => {
        const next = pruneByProjection(prev);
        return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
      });
      setIncomeHighlight((prev) => {
        const next = pruneByProjection(prev);
        return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
      });
      setIhtIgnore((prev) => {
        const next = pruneByPbs(prev);
        return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
      });
      setIhtTrust((prev) => {
        const next = pruneByPbs(prev);
        return JSON.stringify(next) !== JSON.stringify(prev) ? next : prev;
      });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lsHydrated, projections, pbs?.balance_sheet]);

  // Build a per-client storage key for session persistence (same-session only)
  const buildIhtStorageKey = (teamId?: string | number, clientId?: string | number) => `iht:${teamId ?? 'none'}:${clientId ?? 'none'}`;

  // Hydrate IHT state from sessionStorage (per client), after PBS is available
  useEffect(() => {
    if (!team?.id || !selectedClient?.client_id) return;
    if (lsHydrated) return;
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem(buildIhtStorageKey(team.id, selectedClient.client_id)) : null;
      if (raw) {
        const data = JSON.parse(raw || '{}') as any;
        if (typeof data.netChangeOnDeath === 'string') setNetChangeOnDeath(data.netChangeOnDeath);
        if (typeof data.giftsPrevSevenYears === 'number') setGiftsPrevSevenYears(data.giftsPrevSevenYears);
        if (typeof data.lifetimeAllowances === 'number') setLifetimeAllowances(data.lifetimeAllowances);
        if (typeof data.giftsToCharityOnDeath === 'number') setGiftsToCharityOnDeath(data.giftsToCharityOnDeath);
        if (typeof data.exemptGiftsAnnual === 'number') setExemptGiftsAnnual(data.exemptGiftsAnnual);
        if (typeof data.residenceNrbApplying === 'number') setResidenceNrbApplying(data.residenceNrbApplying);

        // Prune per-item maps to current PBS keys when loading
        const pbsKeys = new Set(pbsItems.map((it: any, idx: number) => getItemKey(it, idx)));
        const pruneByPbs = <T extends Record<string, any>>(obj: T): T => {
          const next = Object.fromEntries(Object.entries(obj || {}).filter(([k]) => pbsKeys.has(String(k)))) as T;
          return next;
        };
        if (data.ihtIgnore && typeof data.ihtIgnore === 'object') setIhtIgnore(pruneByPbs(data.ihtIgnore));
        if (data.ihtTrust && typeof data.ihtTrust === 'object') setIhtTrust(pruneByPbs(data.ihtTrust));
      }
    } catch {
      // ignore storage errors
    } finally {
      setLsHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id, selectedClient?.client_id, pbs?.balance_sheet]);

  // Persist IHT-related state to sessionStorage on change
  useEffect(() => {
    if (!team?.id || !selectedClient?.client_id) return;
    if (!lsHydrated) return;
    try {
      const payload = {
        netChangeOnDeath,
        giftsPrevSevenYears,
        lifetimeAllowances,
        giftsToCharityOnDeath,
        exemptGiftsAnnual,
        residenceNrbApplying,
        ihtIgnore,
        ihtTrust,
      };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(buildIhtStorageKey(team.id, selectedClient.client_id), JSON.stringify(payload));
      }
    } catch {
      // ignore storage errors
    }
  }, [lsHydrated, team?.id, selectedClient?.client_id, netChangeOnDeath, giftsPrevSevenYears, lifetimeAllowances, giftsToCharityOnDeath, exemptGiftsAnnual, residenceNrbApplying, ihtIgnore, ihtTrust]);

  const estateNetWorth = useMemo(() => {
    let sum = 0;
    for (let idx = 0; idx < pbsItems.length; idx++) {
      const it = pbsItems[idx];
      const key = getItemKey(it, idx);
      if (ihtIgnore[key]) continue;
      const t = it.type as BalanceSheetItemKind;
      if (!isIhtAsset(t)) continue;
      sum += getIhtItemValue(it);
    }
    return sum;
  }, [pbs?.balance_sheet, ihtIgnore]);

  const trustAssetsTotal = useMemo(() => {
    let sum = 0;
    for (let idx = 0; idx < pbsItems.length; idx++) {
      const it = pbsItems[idx];
      const key = getItemKey(it, idx);
      if (ihtIgnore[key]) continue;
      if (!ihtTrust[key]) continue; // only count items marked Trust
      const t = it.type as BalanceSheetItemKind;
      if (!isIhtAsset(t)) continue;
      sum += getIhtItemValue(it);
    }
    return sum;
  }, [pbs?.balance_sheet, ihtIgnore, ihtTrust]);

  // Nil rate band derived from number of lifetime allowances


  // Sum of APR/BPR qualifying investments (IHT exempt): IHT_scheme and eis
  const aprBprTotal = useMemo(() => {
    let sum = 0;
    for (let idx = 0; idx < pbsItems.length; idx++) {
      const it = pbsItems[idx];
      const key = getItemKey(it, idx);
      if (ihtIgnore[key]) continue;
      const t = it.type as BalanceSheetItemKind;
      if (t === 'IHT_scheme' || t === 'eis') {
        sum += getIhtItemValue(it);
      }
    }
    return sum;
  }, [pbs?.balance_sheet, ihtIgnore]);

  const nilRateBand = useMemo(() => {
    return (Number(lifetimeAllowances) || 0) * 325_000;
  }, [lifetimeAllowances]);

  const taxableEstate = useMemo(() => {
    // Taxable Estate (before gifts) = Current value + Net change - Assets written in trust
    const base = (Number(estateNetWorth) || 0) + parseLooseNumber(netChangeOnDeath);
    return base - (Number(trustAssetsTotal) || 0);
  }, [estateNetWorth, netChangeOnDeath, trustAssetsTotal]);

  const taxableEstateIncludingGifts = useMemo(() => {
    return (Number(taxableEstate) || 0) + (Number(giftsPrevSevenYears) || 0);
  }, [taxableEstate, giftsPrevSevenYears]);

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
            className={`px-3 py-1.5 text-sm border-l ${activeTab === 'iht' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-neutral-900'}`}
            onClick={() => setActiveTab('iht')}
          >
            IHT
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
          <PensionSummary
            selectedClientPresent={!!selectedClient}
            teamPresent={!!team}
            loading={loading}
            yearsToRetirement={yearsToRetirement}
            inflationPct={inflationPct}
            onInflationChange={handleInflationChange}
            incomeEquivalentPct={incomeEquivalentPct}
            onIncomeEquivalentChange={handleWithdrawalChange}
            onReset={handleReset}
            missing={missing}
          />

          {/* Forward value summary for investments/pensions */}
          <PensionProjections
            enabled={!!selectedClient && !!team && yearsToRetirement != null}
            loading={loading}
            projections={projections as any[]}
            totals={totals as any}
            targetIncomeAnnual={targetIncomeAnnual}
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

          <p className="mt-6 text-muted-foreground">More planning tools coming soon.</p>
        </>
      ) : activeTab === 'iht' ? (
        <>
          {/* IHT summary */}
          <IhtSummary
            estateNetWorth={estateNetWorth}
            netChangeOnDeath={netChangeOnDeath}
            setNetChangeOnDeath={setNetChangeOnDeath}
            trustAssetsTotal={trustAssetsTotal}
            taxableEstate={taxableEstate}
            giftsPrevSevenYears={giftsPrevSevenYears}
            setGiftsPrevSevenYears={setGiftsPrevSevenYears}
            parseLooseNumber={parseLooseNumber}
            taxableEstateIncludingGifts={taxableEstateIncludingGifts}
            lifetimeAllowances={lifetimeAllowances}
            setLifetimeAllowances={setLifetimeAllowances}
            nilRateBand={nilRateBand}
            giftsToCharityOnDeath={giftsToCharityOnDeath}
            setGiftsToCharityOnDeath={setGiftsToCharityOnDeath}
            aprBprTotal={aprBprTotal}
            exemptGiftsAnnual={exemptGiftsAnnual}
            setExemptGiftsAnnual={setExemptGiftsAnnual}
            residenceNrbApplying={residenceNrbApplying}
            setResidenceNrbApplying={setResidenceNrbApplying}
          />

          {/* IHT assets list */}
          <IhtPlanning
            pbsItems={pbsItems}
            getItemBg={getItemBg}
            getItemKey={getItemKey}
            isIhtAsset={isIhtAsset}
            ihtIgnore={ihtIgnore}
            setIhtIgnore={setIhtIgnore}
            ihtTrust={ihtTrust}
            setIhtTrust={setIhtTrust}
          />
        </>
      ) : (
        <CashflowSummary />
      )}
    </section>
  );
}
