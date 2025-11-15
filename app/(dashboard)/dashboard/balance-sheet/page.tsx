"use client";
import { useState, useEffect } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
// Retirement goals and employment moved to Identity page
import BalanceSheetSection from './components/BalanceSheetSection';
import type { PersonalBalanceSheetItem, BalanceSheetItemKind } from '@/lib/types/balance';
import { extractBalance } from '@/lib/api/balance';
import { loadBalanceSheet, saveBalanceSheet } from '@/lib/api/balance';
import { loadIdentity, saveIdentity } from '@/lib/api/identity';
import type { CashFlow, BalanceEmploymentStatus, BalanceFrequency, ItemsOnlyBalance } from '@/lib/types/balance';
import { preferNonBlank, isBlank } from '@/lib/utils';
import { normalizeLoadedItems } from '@/lib/balance/normalize';

type CashflowItem = {
  description?: string | null;
  inflow?: boolean | null;
  amount?: number | null;
  currency?: string | null;
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually' | null;
  is_gross?: boolean | null;
};

type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'retired'
  | 'full_time_education'
  | 'independent_means'
  | 'homemaker'
  | 'other'
  | '';

type BalanceSheetData = {
  target_retirement_age?: number | null;
  target_retirement_income?: CashflowItem | null;
  employment_status: EmploymentStatus;
  occupation: string;
  balance_sheet: PersonalBalanceSheetItem[];
};

type Suggestions = {
  employment_status?: EmploymentStatus;
  occupation?: string;
  target_retirement_age?: number | null;
  target_retirement_income?: Partial<CashflowItem> | null;
  balance_sheet?: Array<{
    type: BalanceSheetItemKind;
    description: string | null;
    patch: Partial<PersonalBalanceSheetItem>;
  }>;
};

export default function BalanceSheetPage() {
  const { selectedClient } = useSelectedClient();
  const { team } = useTeam();
  const [form, setForm] = useState<BalanceSheetData>({
    target_retirement_age: null,
    target_retirement_income: null,
    employment_status: '',
    occupation: '',
    balance_sheet: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  // Dev-only contract banner
  const [devIssues, setDevIssues] = useState<string[]>([]);

  // Helper: convert PBS CashFlow to legacy-like CashflowItem used in the UI merge step
  const toCashflowItemFromPBS = (cf?: CashFlow | null): CashflowItem | null => {
    if (!cf) return null;
    const freq: CashflowItem['frequency'] = ((): CashflowItem['frequency'] => {
      const f = cf.frequency as BalanceFrequency;
      return f === 'weekly' || f === 'monthly' || f === 'quarterly' || f === 'annually' ? f : null;
    })();
    return {
      description: undefined,
      inflow: true,
      amount: typeof cf.periodic_amount === 'number' ? cf.periodic_amount : Number(cf.periodic_amount ?? 0),
      currency: null,
      frequency: freq,
      is_gross: cf.net_gross === 'gross' ? true : cf.net_gross === 'net' ? false : null,
    };
  };

  // Load data
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!team?.id || !selectedClient?.client_id) return;
      setLoading(true);
      try {
        const [identity, b] = await Promise.all([
          loadIdentity<any>(team.id, selectedClient.client_id).catch(() => ({} as any)),
          loadBalanceSheet<ItemsOnlyBalance>(team.id, selectedClient.client_id).catch(() => ({} as any)),
        ]);
        if (!ignore) {
          // Normalize incoming items to align with Pydantic (description required; currency string or omitted)
          const normalizeItems = (arr: any[]): PersonalBalanceSheetItem[] => normalizeLoadedItems(arr);
          // Dev contract checks (UI surface)
          if (process.env.NODE_ENV !== 'production') {
            const issues: string[] = [];
            const legacyKeys = ['target_retirement_age','target_retirement_income','employment_status','occupation'];
            const idHasTRA = Object.prototype.hasOwnProperty.call(identity ?? {}, 'target_retirement_age');
            const idHasTRI = Object.prototype.hasOwnProperty.call(identity ?? {}, 'target_retirement_income');
            if (!idHasTRA && !idHasTRI) issues.push('Identity payload missing retirement fields (target_retirement_*)');
            const foundLegacy = legacyKeys.filter((k) => Object.prototype.hasOwnProperty.call((b as any) ?? {}, k));
            if (foundLegacy.length > 0) issues.push(`Balance response includes legacy fields: ${foundLegacy.join(', ')}`);
            if (!Array.isArray((b as any)?.balance_sheet)) issues.push('Balance response missing items array: balance_sheet');
            setDevIssues(issues);
          }
          const toCashflowItem = (cf?: CashFlow | null): CashflowItem | null => {
            if (!cf) return null;
            const freq: CashflowItem['frequency'] = ((): CashflowItem['frequency'] => {
              const f = cf.frequency as BalanceFrequency;
              return f === 'weekly' || f === 'monthly' || f === 'quarterly' || f === 'annually' ? f : null;
            })();
            return {
              description: undefined,
              inflow: true,
              amount: typeof cf.periodic_amount === 'number' ? cf.periodic_amount : Number(cf.periodic_amount ?? 0),
              currency: null,
              frequency: freq,
              is_gross: cf.net_gross === 'gross' ? true : cf.net_gross === 'net' ? false : null,
            };
          };
          const toEmployment = (s?: BalanceEmploymentStatus | null): EmploymentStatus | '' => {
            const m: Record<string, EmploymentStatus> = {
              employed: 'employed',
              self_employed: 'self_employed',
              retired: 'retired',
              full_time_education: 'full_time_education',
              independent_means: 'independent_means',
              homemaker: 'homemaker',
              other: 'other',
            };
            return s ? (m[s] ?? '') : '';
          };
          setForm({
            target_retirement_age: (identity as any)?.target_retirement_age ?? null,
            target_retirement_income: toCashflowItem((identity as any)?.target_retirement_income),
            employment_status: toEmployment((identity as any)?.employment_status ?? null),
            occupation: (identity as any)?.occupation ?? '',
            balance_sheet: Array.isArray((b as any)?.balance_sheet) ? normalizeItems((b as any).balance_sheet) : [],
          });
        }
      } catch (error) {
        console.error('Failed to load balance sheet data:', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [team?.id, selectedClient?.client_id]);

  // Auto-save on form change
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!team?.id || !selectedClient?.client_id || loading) return;
      setSaving(true);
      try {
        // Mappers
        const toBalanceFrequency = (f?: CashflowItem['frequency'] | null): BalanceFrequency => {
          return f === 'weekly' || f === 'monthly' || f === 'quarterly' || f === 'annually' ? f : 'unknown';
        };
        const toCashFlow = (cf?: CashflowItem | null): CashFlow | null => {
          if (!cf) return null;
          const amount = typeof cf.amount === 'number' ? cf.amount : Number(cf.amount ?? 0);
          const periodic_amount = Number.isFinite(amount) ? Math.round(amount) : 0;
          return {
            periodic_amount,
            frequency: toBalanceFrequency(cf.frequency ?? null),
            net_gross: cf.is_gross === true ? 'gross' : cf.is_gross === false ? 'net' : 'unknown',
          };
        };
        const toEmployment = (s: EmploymentStatus | ''): BalanceEmploymentStatus | null => {
          if (!s) return null;
          const m: Record<string, BalanceEmploymentStatus> = {
            employed: 'employed',
            self_employed: 'self_employed',
            retired: 'retired',
            full_time_education: 'full_time_education',
            independent_means: 'independent_means',
            homemaker: 'homemaker',
            other: 'other',
          } as const;
          return m[s] ?? 'other';
        };

        // Save identity fields separately
        const identityPayload = {
          target_retirement_age: form.target_retirement_age ?? null,
          target_retirement_income: toCashFlow(form.target_retirement_income),
          employment_status: toEmployment(form.employment_status),
          occupation: form.occupation ?? null,
        } as any;
        await saveIdentity(team.id, selectedClient.client_id, identityPayload);
        // Save items-only balance
        // Normalize before saving to avoid server-side 422s if legacy data lacked description/currency
        const normalizeBeforeSave = (arr: PersonalBalanceSheetItem[]): PersonalBalanceSheetItem[] => {
          const toTitle = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          return (Array.isArray(arr) ? arr : []).map((it: any) => {
            const desc = typeof it?.description === 'string' && it.description.trim().length > 0
              ? it.description
              : toTitle(String(it?.type ?? 'item'));
            const out: any = { ...it, description: desc };
            if (!out.currency) delete out.currency;
            return out as PersonalBalanceSheetItem;
          });
        };
        const itemsOnly: ItemsOnlyBalance = {
          balance_sheet: normalizeBeforeSave(Array.isArray(form.balance_sheet) ? form.balance_sheet : []),
        };
        await saveBalanceSheet(team.id, selectedClient.client_id, itemsOnly);
        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save balance sheet data:', error);
      } finally {
        setSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [form, team?.id, selectedClient?.client_id, loading]);

  return (
    <section className="p-4 lg:p-8">
      {process.env.NODE_ENV !== 'production' && devIssues.length > 0 && (
        <div className="mb-4 p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-900 flex items-start justify-between gap-4">
          <div>
            <div className="font-medium">Developer checks</div>
            <ul className="mt-1 list-disc list-inside text-sm">
              {devIssues.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
          <button
            className="text-xs px-2 py-1 border rounded border-amber-400 hover:bg-amber-100"
            onClick={() => setDevIssues([])}
            title="Dismiss"
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Balance Sheet</h1>
          <div className="text-lg font-medium text-muted-foreground">
            {selectedClient ? selectedClient.name : 'No Client Selected'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {suggestions && (
            <div className="flex items-center gap-2 mr-2">
              <button
                type="button"
                className="px-3 py-1 rounded border border-amber-400 text-amber-800 bg-amber-100 hover:bg-amber-200"
                onClick={() => {
                  setForm((prev) => {
                    const next = { ...prev } as BalanceSheetData;
                    if (typeof suggestions?.employment_status !== 'undefined') {
                      next.employment_status = suggestions.employment_status as EmploymentStatus;
                    }
                    if (typeof suggestions?.occupation !== 'undefined') {
                      next.occupation = suggestions.occupation as string;
                    }
                    if (typeof suggestions?.target_retirement_age !== 'undefined') {
                      next.target_retirement_age = suggestions.target_retirement_age ?? null;
                    }
                    if (suggestions?.target_retirement_income) {
                      next.target_retirement_income = {
                        ...(prev.target_retirement_income ?? {}),
                        ...suggestions.target_retirement_income,
                      } as CashflowItem;
                    }
                    // Apply balance sheet patches if present
                    if (suggestions?.balance_sheet && suggestions.balance_sheet.length > 0) {
                      const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
                      const idxMap = new Map<string, number>();
                      (next.balance_sheet ?? []).forEach((it, idx) => {
                        idxMap.set(`${it.type}|${norm(it.description as any)}`, idx);
                      });
                      const updated = [...(next.balance_sheet ?? [])];
                      for (const s of suggestions.balance_sheet) {
                        const key = `${s.type}|${norm(s.description)}`;
                        const idx = idxMap.get(key);
                        if (idx === undefined) continue;
                        const cur = updated[idx];
                        const merged: PersonalBalanceSheetItem = {
                          ...cur,
                          currency: (s.patch as any).currency ?? cur.currency,
                          ite: {
                            ...(cur as any).ite,
                            ...((s.patch as any).ite ?? {}),
                          },
                        } as any;
                        updated[idx] = merged;
                      }
                      next.balance_sheet = updated;
                    }
                    return next;
                  });
                  setSuggestions(null);
                }}
              >
                Accept All
              </button>
              <button
                type="button"
                className="px-3 py-1 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                onClick={() => setSuggestions(null)}
              >
                Reject All
              </button>
            </div>
          )}
          {extractError && (
            <span className="text-sm text-red-600">{extractError}</span>
          )}
          <button
            className={`${(!team?.id || !selectedClient?.client_id || extracting)
              ? 'px-4 py-2 rounded text-white bg-blue-300 cursor-not-allowed'
              : 'px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700'}`}
            disabled={!team?.id || !selectedClient?.client_id || extracting}
            onClick={async () => {
              if (!team?.id || !selectedClient?.client_id) return;
              setExtracting(true);
              setExtractError(null);
              try {
                const incomingPBS = await extractBalance<any>(team.id, selectedClient.client_id, form.balance_sheet);
                const incoming: any = {
                  employment_status: incomingPBS?.employment_status ?? null,
                  occupation: incomingPBS?.occupation ?? null,
                  target_retirement_age: incomingPBS?.target_retirement_age ?? null,
                  target_retirement_income: toCashflowItemFromPBS(incomingPBS?.target_retirement_income ?? null),
                  balance_sheet: Array.isArray(incomingPBS?.balance_sheet) ? incomingPBS.balance_sheet : [],
                };
                // Work with current snapshot to compute merge and suggestions consistently
                const prev = { ...form } as BalanceSheetData;
                // Merge only the Employment + RetirementGoals fields using preferNonBlank
                const merged: BalanceSheetData = { ...prev } as BalanceSheetData;
                // Employment
                merged.employment_status = preferNonBlank(prev.employment_status, incoming.employment_status as any);
                merged.occupation = preferNonBlank(prev.occupation, incoming.occupation as any);
                // Retirement Goals
                merged.target_retirement_age = preferNonBlank(
                  prev.target_retirement_age ?? null,
                  (incoming as any)?.target_retirement_age ?? null
                ) as any;
                const curRI = prev.target_retirement_income ?? {};
                const incRI = (incoming as any)?.target_retirement_income ?? {};
                merged.target_retirement_income = {
                  description: preferNonBlank(curRI.description ?? null, incRI.description ?? null) as any,
                  inflow: preferNonBlank(curRI.inflow ?? null, incRI.inflow ?? null) as any,
                  amount: preferNonBlank(curRI.amount ?? null, incRI.amount ?? null) as any,
                  currency: preferNonBlank(curRI.currency ?? null, incRI.currency ?? null) as any,
                  frequency: preferNonBlank(curRI.frequency ?? null, incRI.frequency ?? null) as any,
                  is_gross: preferNonBlank(curRI.is_gross ?? null, incRI.is_gross ?? null) as any,
                };

                // Compute suggestions only for conflicts: both sides non-blank and different
                const sugg: Suggestions = {};
                if (
                  (incoming.employment_status ?? '') &&
                  prev.employment_status &&
                  prev.employment_status !== incoming.employment_status
                ) {
                  sugg.employment_status = incoming.employment_status as EmploymentStatus;
                }
                if (
                  (incoming.occupation ?? '') &&
                  prev.occupation &&
                  prev.occupation !== incoming.occupation
                ) {
                  sugg.occupation = incoming.occupation as string;
                }
                if (
                  (incoming as any)?.target_retirement_age !== undefined &&
                  (prev.target_retirement_age ?? null) !== null &&
                  (incoming as any)?.target_retirement_age !== null &&
                  prev.target_retirement_age !== (incoming as any)?.target_retirement_age
                ) {
                  sugg.target_retirement_age = (incoming as any)?.target_retirement_age;
                }
                const riSugg: Partial<CashflowItem> = {};
                const fields: (keyof CashflowItem)[] = ['description', 'inflow', 'amount', 'currency', 'frequency', 'is_gross'];
                for (const f of fields) {
                  const cur = (curRI as any)[f];
                  const inc = (incRI as any)[f];
                  if (inc !== undefined && inc !== null && cur !== undefined && cur !== null && inc !== cur) {
                    (riSugg as any)[f] = inc;
                  }
                }
                if (Object.keys(riSugg).length > 0) {
                  sugg.target_retirement_income = riSugg;
                }

                // ---- Merge Balance Sheet items ----
                // Identity key: (type + normalized description)
                const normalize = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
                const curItems = Array.isArray(prev.balance_sheet) ? prev.balance_sheet : [];
                const incItems = Array.isArray((incoming as any)?.balance_sheet) ? (incoming as any).balance_sheet as PersonalBalanceSheetItem[] : [];

                const byKey = new Map<string, PersonalBalanceSheetItem>();
                curItems.forEach((it) => byKey.set(`${it.type}|${normalize(it.description)}`, it));

                const mergedItems: PersonalBalanceSheetItem[] = [...curItems];
                const balancePatches: NonNullable<Suggestions['balance_sheet']> = [];

                // Deep non-blank merge
                const preferDeep = (c: any, i: any): any => {
                  if (i === undefined) return c;
                  if (c === undefined) return i;
                  if (c === null || i === null) {
                    return preferNonBlank(c, i as any);
                  }
                  if (typeof c !== 'object' || typeof i !== 'object') {
                    return preferNonBlank(c, i as any);
                  }
                  const keys = new Set([...Object.keys(c), ...Object.keys(i)]);
                  const out: any = Array.isArray(c) ? [...c] : { ...c };
                  for (const k of keys) {
                    out[k] = preferDeep(c[k], i[k]);
                  }
                  return out;
                };

                // Deep conflict patch (incoming values where both sides non-blank and different)
                const conflictPatch = (c: any, i: any): any => {
                  if (i === undefined) return undefined;
                  if (c === undefined) return undefined;
                  if (typeof c !== 'object' || typeof i !== 'object' || c === null || i === null) {
                    const bothNonBlank = !isBlank(c) && !isBlank(i);
                    if (bothNonBlank && c !== i) return i;
                    return undefined;
                  }
                  const keys = new Set([...Object.keys(c), ...Object.keys(i)]);
                  const out: any = {};
                  for (const k of keys) {
                    const child = conflictPatch(c[k], i[k]);
                    if (child !== undefined) out[k] = child;
                  }
                  return Object.keys(out).length > 0 ? out : undefined;
                };

                for (const inc of incItems) {
                  const key = `${inc.type}|${normalize(inc.description)}`;
                  const cur = byKey.get(key);
                  if (!cur) {
                    // New item: add, assign __localId if missing
                    const withId = { __localId: (crypto as any).randomUUID?.() ?? String(Date.now() + Math.random()), ...inc } as PersonalBalanceSheetItem;
                    mergedItems.push(withId);
                    continue;
                  }
                  // Merge existing
                  const mergedItem: PersonalBalanceSheetItem = {
                    ...cur,
                    currency: preferNonBlank(cur.currency ?? null as any, (inc as any).currency ?? null as any) as any,
                    // Do not change description or type (identity keys)
                    ite: preferDeep((cur as any).ite, (inc as any).ite),
                  } as any;
                  // Compute patch suggestions for conflicts
                  const patch: any = {};
                  const basePatch = conflictPatch({ currency: cur.currency }, { currency: (inc as any).currency });
                  if (basePatch && Object.keys(basePatch).length > 0) {
                    Object.assign(patch, basePatch);
                  }
                  const itePatch = conflictPatch((cur as any).ite, (inc as any).ite);
                  if (itePatch && Object.keys(itePatch).length > 0) {
                    patch.ite = itePatch;
                  }
                  // Replace in merged array
                  const idx = mergedItems.findIndex((x) => (x.__localId ?? '') === (cur.__localId ?? ''));
                  if (idx >= 0) mergedItems[idx] = mergedItem; else {
                    // fallback by key
                    const idx2 = mergedItems.findIndex((x) => `${x.type}|${normalize(x.description)}` === key);
                    if (idx2 >= 0) mergedItems[idx2] = mergedItem;
                  }
                  if (Object.keys(patch).length > 0) {
                    balancePatches.push({ type: cur.type as BalanceSheetItemKind, description: cur.description ?? null, patch });
                  }
                }

                merged.balance_sheet = mergedItems;
                if (balancePatches.length > 0) {
                  sugg.balance_sheet = balancePatches;
                }

                setForm(merged);
                setSuggestions(Object.keys(sugg).length > 0 ? sugg : null);
              } catch (e: any) {
                setExtractError(e.message || 'Extract failed');
                setTimeout(() => setExtractError(null), 4000);
              } finally {
                setExtracting(false);
              }
            }}
          >
            {extracting ? 'Extracting…' : 'Extract from Docs'}
          </button>
          <div className="text-sm text-muted-foreground">
            {saving && 'Saving...'}
            {!saving && lastSaved && `Last saved: ${lastSaved.toLocaleTimeString()}`}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="max-w-4xl">
          {/* Retirement goals and Work moved to Identity page */}
          <BalanceSheetSection
            items={form.balance_sheet}
            onChange={(next) => setForm((prev) => ({ ...prev, balance_sheet: next }))}
            suggestions={suggestions?.balance_sheet ?? null}
            onAccept={(type, description) => {
              const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
              setForm((prev) => {
                const next = { ...prev } as BalanceSheetData;
                const items = [...(next.balance_sheet ?? [])];
                const idx = items.findIndex((it) => it.type === type && norm(it.description) === norm(description));
                if (idx >= 0) {
                  const cur = items[idx];
                  const patch = (suggestions?.balance_sheet ?? []).find((p) => p.type === type && norm(p.description) === norm(description))?.patch as any;
                  if (patch) {
                    const merged: PersonalBalanceSheetItem = {
                      ...cur,
                      currency: patch.currency ?? cur.currency,
                      ite: { ...(cur as any).ite, ...(patch.ite ?? {}) },
                    } as any;
                    items[idx] = merged;
                    next.balance_sheet = items;
                  }
                }
                return next;
              });
              setSuggestions((prev) => {
                if (!prev) return prev;
                const bs = (prev.balance_sheet ?? []).filter((p) => !(p.type === type && norm(p.description) === norm(description)));
                const next = { ...prev, balance_sheet: bs } as Suggestions;
                if (next.balance_sheet && next.balance_sheet.length === 0) delete (next as any).balance_sheet;
                return Object.keys(next).length === 0 ? null : next;
              });
            }}
            onReject={(type, description) => {
              const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
              setSuggestions((prev) => {
                if (!prev) return prev;
                const bs = (prev.balance_sheet ?? []).filter((p) => !(p.type === type && norm(p.description) === norm(description)));
                const next = { ...prev, balance_sheet: bs } as Suggestions;
                if (next.balance_sheet && next.balance_sheet.length === 0) delete (next as any).balance_sheet;
                return Object.keys(next).length === 0 ? null : next;
              });
            }}
            onAcceptChange={(type, description, path) => {
              const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
              const getIn = (obj: any, p: string) => p.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), obj);
              const setIn = (obj: any, p: string, val: any) => {
                const parts = p.split('.');
                const last = parts.pop() as string;
                let cur = obj;
                for (const k of parts) {
                  if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
                  cur = cur[k];
                }
                cur[last] = val;
              };
              setForm((prev) => {
                const next = { ...prev } as BalanceSheetData;
                const idx = next.balance_sheet.findIndex((it) => it.type === type && norm(it.description) === norm(description));
                if (idx >= 0) {
                  const cur = { ...next.balance_sheet[idx] } as any;
                  const patch = (suggestions?.balance_sheet ?? []).find((p) => p.type === type && norm(p.description) === norm(description))?.patch as any;
                  const val = getIn(patch, path);
                  if (val !== undefined) {
                    // Apply value into the item copy
                    setIn(cur, path, val);
                    next.balance_sheet = next.balance_sheet.slice();
                    next.balance_sheet[idx] = cur as any;
                  }
                }
                return next;
              });
              setSuggestions((prev) => {
                if (!prev) return prev;
                const bs = (prev.balance_sheet ?? []).map((p) => ({ ...p, patch: { ...(p.patch as any) } })) as NonNullable<Suggestions['balance_sheet']>;
                const entry = bs.find((p) => p.type === type && norm(p.description) === norm(description));
                if (entry) {
                  // Remove that path from patch
                  const parts = path.split('.');
                  const stack: any[] = [entry.patch];
                  for (let i = 0; i < parts.length - 1; i++) {
                    const k = parts[i];
                    if (!stack[stack.length - 1][k]) break;
                    stack.push(stack[stack.length - 1][k]);
                  }
                  const last = parts[parts.length - 1];
                  const parent = stack[stack.length - 1];
                  if (parent && typeof parent === 'object') {
                    delete parent[last];
                  }
                  // Cleanup empty objects up the chain
                  for (let i = stack.length - 1; i > 0; i--) {
                    const obj = stack[i];
                    const parentObj = stack[i - 1];
                    const key = parts[i - 1];
                    if (obj && typeof obj === 'object' && Object.keys(obj).length === 0) {
                      delete parentObj[key];
                    }
                  }
                }
                const next = { ...prev, balance_sheet: bs.filter((p) => Object.keys(p.patch as any).length > 0) } as Suggestions;
                if (next.balance_sheet && next.balance_sheet.length === 0) delete (next as any).balance_sheet;
                return Object.keys(next).length === 0 ? null : next;
              });
            }}
            onRejectChange={(type, description, path) => {
              const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
              setSuggestions((prev) => {
                if (!prev) return prev;
                const bs = (prev.balance_sheet ?? []).map((p) => ({ ...p, patch: { ...(p.patch as any) } })) as NonNullable<Suggestions['balance_sheet']>;
                const entry = bs.find((p) => p.type === type && norm(p.description) === norm(description));
                if (entry) {
                  const parts = path.split('.');
                  const stack: any[] = [entry.patch];
                  for (let i = 0; i < parts.length - 1; i++) {
                    const k = parts[i];
                    if (!stack[stack.length - 1][k]) break;
                    stack.push(stack[stack.length - 1][k]);
                  }
                  const last = parts[parts.length - 1];
                  const parent = stack[stack.length - 1];
                  if (parent && typeof parent === 'object') {
                    delete parent[last];
                  }
                  for (let i = stack.length - 1; i > 0; i--) {
                    const obj = stack[i];
                    const parentObj = stack[i - 1];
                    const key = parts[i - 1];
                    if (obj && typeof obj === 'object' && Object.keys(obj).length === 0) {
                      delete parentObj[key];
                    }
                  }
                }
                const next = { ...prev, balance_sheet: bs.filter((p) => Object.keys(p.patch as any).length > 0) } as Suggestions;
                if (next.balance_sheet && next.balance_sheet.length === 0) delete (next as any).balance_sheet;
                return Object.keys(next).length === 0 ? null : next;
              });
            }}
          />
        </div>
      )}
    </section>
  );
}
