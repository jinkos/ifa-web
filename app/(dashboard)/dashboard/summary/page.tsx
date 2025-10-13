"use client";
import { useEffect, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ActionBar from '@/components/action-bar';
import SummaryActionBar from './components/SummaryActionBar';
import InlineSuggestionCard from './components/InlineSuggestionCard';
import StatusSection from './components/StatusSection';
import CashflowDetails from './components/CashflowDetails';
import RetirementSection from './components/RetirementSection';
import CashflowListSection from './components/CashflowListSection';
import FinancialsSection from './components/FinancialsSection';
import { buildListSuggestions, ListSuggestions } from '@/lib/suggestions';
import {
  normalizeDesc,
  cashflowEqual,
  valueEqual,
  investmentEqual,
  pensionEqual,
  debtEqual,
  insuranceEqual,
  isEmptySuggestions,
  mkId,
} from '@/lib/summaryHelpers';
import type {
  CashflowItem,
  DebtHolding,
  HealthStatus,
  InsurancePolicy,
  InvestmentHolding,
  MaritalStatus,
  PensionHolding,
  PersonSummary,
  ValueWithCurrency,
} from '@/lib/types/summary';
import { healthOptions, maritalOptions } from '@/lib/constants/summary';
import { extractSummary, loadSummary, saveSummary } from '@/lib/api/summary';
import useSummaryExtraction from '@/lib/hooks/useSummaryExtraction';
import CashflowItemForm from './components/CashflowItemForm';
import InvestmentHoldingForm from './components/InvestmentHoldingForm';
import PensionHoldingForm from './components/PensionHoldingForm';
import PensionSection from './components/PensionSection';
import DebtHoldingForm from './components/DebtHoldingForm';
import DebtSection from './components/DebtSection';
import InsurancePolicyForm from './components/InsurancePolicyForm';
import InsuranceSection from './components/InsuranceSection';
import HoldingsToolbar from './components/HoldingsToolbar';
import InvestmentsSection from './components/InvestmentsSection';
import { useAutosave } from '@/lib/hooks/useAutosave';
import ShoppingListTab from './ShoppingListTab';

export default function SummaryPage() {
  const { selectedClient } = useSelectedClient();
  const { team } = useTeam();

  const [form, setForm] = useState<PersonSummary>({
    health_status: null,
    smoker: false,
    marital_status: null,
    target_retirement_age: undefined,
    target_retirement_income: null,
    current_income: [],
    current_expenses: [],
    savings_or_investments: [],
    pension_holdings: [],
    debt_holdings: [],
    insurance_policies: [],
  });

  const [loading, setLoading] = useState(false);
  // extraction is handled by a hook
  const canSave = Boolean(team?.id && selectedClient?.client_id);
  const { status: autosaveStatus, error: autosaveError } = useAutosave<PersonSummary>({
    data: form,
    canSave,
    delay: 1500,
    saveFn: async (payload) => {
      if (!team?.id || !selectedClient?.client_id) return;
      await saveSummary(team.id, selectedClient.client_id, payload);
    },
  });

  // Suggestions state per list using shared type
  const [incomeSuggestions, setIncomeSuggestions] = useState<ListSuggestions<CashflowItem> | null>(null);
  const [expenseSuggestions, setExpenseSuggestions] = useState<ListSuggestions<CashflowItem> | null>(null);
  const [investmentSuggestions, setInvestmentSuggestions] = useState<ListSuggestions<InvestmentHolding> | null>(null);
  const [pensionSuggestions, setPensionSuggestions] = useState<ListSuggestions<PensionHolding> | null>(null);
  const [debtSuggestions, setDebtSuggestions] = useState<ListSuggestions<DebtHolding> | null>(null);
  const [insuranceSuggestions, setInsuranceSuggestions] = useState<ListSuggestions<InsurancePolicy> | null>(null);

  // Helper: clear suggestions when empty to force header count refresh/disappearance
  // Global UX helpers for long page
  const [showOnlySuggestions, setShowOnlySuggestions] = useState(false);
  const [suggestNavIndex, setSuggestNavIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'shopping'>('overview');
  const getTotalSuggestionCount = () => {
    const counts = [
      incomeSuggestions ? Object.keys(incomeSuggestions.conflicts).length + incomeSuggestions.additions.length + incomeSuggestions.removals.size : 0,
      expenseSuggestions ? Object.keys(expenseSuggestions.conflicts).length + expenseSuggestions.additions.length + expenseSuggestions.removals.size : 0,
      investmentSuggestions ? Object.keys(investmentSuggestions.conflicts).length + investmentSuggestions.additions.length + investmentSuggestions.removals.size : 0,
      pensionSuggestions ? Object.keys(pensionSuggestions.conflicts).length + pensionSuggestions.additions.length + pensionSuggestions.removals.size : 0,
      debtSuggestions ? Object.keys(debtSuggestions.conflicts).length + debtSuggestions.additions.length + debtSuggestions.removals.size : 0,
      insuranceSuggestions ? Object.keys(insuranceSuggestions.conflicts).length + insuranceSuggestions.additions.length + insuranceSuggestions.removals.size : 0,
      fieldSuggestions ? Object.keys(fieldSuggestions).length : 0,
    ];
    return counts.reduce((a, b) => a + b, 0);
  };
  const scrollToNextSuggestion = () => {
    const nodes = Array.from(document.querySelectorAll('.suggestion-card')) as HTMLElement[];
    if (!nodes.length) return;
    const idx = suggestNavIndex % nodes.length;
    nodes[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    setSuggestNavIndex((prev) => (prev + 1) % nodes.length);
  };
  const scrollToPrevSuggestion = () => {
    const nodes = Array.from(document.querySelectorAll('.suggestion-card')) as HTMLElement[];
    if (!nodes.length) return;
    const idx = (suggestNavIndex - 1 + nodes.length) % nodes.length;
    nodes[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    setSuggestNavIndex(idx);
  };

  // helper functions (moved to lib/summaryHelpers.ts)

  // Holdings: named handlers to avoid large inline JSX arrow functions
  const handleAddInvestment = (e: any) => { e.preventDefault(); setForm((prev) => ({ ...prev, savings_or_investments: [...prev.savings_or_investments, { __localId: (crypto as any).randomUUID?.() ?? String(Date.now()) }] as InvestmentHolding[] })); };
  const handleAcceptAllInvestmentConflicts = (e: any) => { e.preventDefault(); const conflicts = investmentSuggestions?.conflicts ?? {}; setForm((prev) => ({ ...prev, savings_or_investments: prev.savings_or_investments.map((it) => { const key = normalizeDesc(it.description); const inc = (conflicts as any)[key]; return inc ? { ...inc, description: it.description ?? inc.description } : it; }) })); setInvestmentSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, conflicts: {} }; return isEmptySuggestions(next) ? null : next; }); };
  const handleAcceptAllInvestmentAdditions = (e: any) => { e.preventDefault(); const adds = investmentSuggestions?.additions ?? []; setForm((prev) => ({ ...prev, savings_or_investments: [...prev.savings_or_investments, ...adds] })); setInvestmentSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, additions: [] }; return isEmptySuggestions(next) ? null : next; }); };
  const handleAcceptAllInvestmentRemovals = (e: any) => { e.preventDefault(); const removeKeys = investmentSuggestions?.removals ?? new Set<string>(); setForm((prev) => ({ ...prev, savings_or_investments: prev.savings_or_investments.filter((it) => !removeKeys.has(normalizeDesc(it.description))) })); setInvestmentSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, removals: new Set<string>() }; return isEmptySuggestions(next) ? null : next; }); };
  const handleClearInvestmentSuggestions = (e: any) => { e.preventDefault(); setInvestmentSuggestions(null); };

  const handleAddPension = (e: any) => { e.preventDefault(); setForm((prev) => ({ ...prev, pension_holdings: [...prev.pension_holdings, { __localId: (crypto as any).randomUUID?.() ?? String(Date.now()) }] as PensionHolding[] })); };
  const handleAcceptAllPensionConflicts = (e: any) => { e.preventDefault(); const conflicts = pensionSuggestions?.conflicts ?? {}; setForm((prev) => ({ ...prev, pension_holdings: prev.pension_holdings.map((it) => { const key = normalizeDesc(it.description); const inc = (conflicts as any)[key]; return inc ? { ...inc, description: it.description ?? inc.description } : it; }) })); setPensionSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, conflicts: {} }; return isEmptySuggestions(next) ? null : next; }); };
  const handleAcceptAllPensionAdditions = (e: any) => { e.preventDefault(); const adds = pensionSuggestions?.additions ?? []; setForm((prev) => ({ ...prev, pension_holdings: [...prev.pension_holdings, ...adds] })); setPensionSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, additions: [] }; return isEmptySuggestions(next) ? null : next; }); };
  const handleAcceptAllPensionRemovals = (e: any) => { e.preventDefault(); const removeKeys = pensionSuggestions?.removals ?? new Set<string>(); setForm((prev) => ({ ...prev, pension_holdings: prev.pension_holdings.filter((it) => !removeKeys.has(normalizeDesc(it.description))) })); setPensionSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, removals: new Set<string>() }; return isEmptySuggestions(next) ? null : next; }); };
  const handleClearPensionSuggestions = (e: any) => { e.preventDefault(); setPensionSuggestions(null); };

  const handleAddDebt = (e: any) => { e.preventDefault(); setForm((prev) => ({ ...prev, debt_holdings: [...prev.debt_holdings, { __localId: (crypto as any).randomUUID?.() ?? String(Date.now()) }] as DebtHolding[] })); };
  const handleAcceptAllDebtConflicts = (e: any) => { e.preventDefault(); const conflicts = debtSuggestions?.conflicts ?? {}; setForm((prev) => ({ ...prev, debt_holdings: prev.debt_holdings.map((it) => { const key = normalizeDesc(it.description); const inc = (conflicts as any)[key]; return inc ? { ...inc, description: it.description ?? inc.description } : it; }) })); setDebtSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, conflicts: {} }; return isEmptySuggestions(next) ? null : next; }); };
  const handleAcceptAllDebtAdditions = (e: any) => { e.preventDefault(); const adds = debtSuggestions?.additions ?? []; setForm((prev) => ({ ...prev, debt_holdings: [...prev.debt_holdings, ...adds] })); setDebtSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, additions: [] }; return isEmptySuggestions(next) ? null : next; }); };
  const handleAcceptAllDebtRemovals = (e: any) => { e.preventDefault(); const removeKeys = debtSuggestions?.removals ?? new Set<string>(); setForm((prev) => ({ ...prev, debt_holdings: prev.debt_holdings.filter((it) => !removeKeys.has(normalizeDesc(it.description))) })); setDebtSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, removals: new Set<string>() }; return isEmptySuggestions(next) ? null : next; }); };
  const handleClearDebtSuggestions = (e: any) => { e.preventDefault(); setDebtSuggestions(null); };

  const handleAddInsurance = (e: any) => { e.preventDefault(); setForm((prev) => ({ ...prev, insurance_policies: [...prev.insurance_policies, { __localId: (crypto as any).randomUUID?.() ?? String(Date.now()) }] as InsurancePolicy[] })); };
  const handleAcceptAllInsuranceConflicts = (e: any) => { e.preventDefault(); const conflicts = insuranceSuggestions?.conflicts ?? {}; setForm((prev) => ({ ...prev, insurance_policies: prev.insurance_policies.map((it) => { const key = normalizeDesc(it.description); const inc = (conflicts as any)[key]; return inc ? { ...inc, description: it.description ?? inc.description } : it; }) })); setInsuranceSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, conflicts: {} }; return isEmptySuggestions(next) ? null : next; }); };
  const handleAcceptAllInsuranceAdditions = (e: any) => { e.preventDefault(); const adds = insuranceSuggestions?.additions ?? []; setForm((prev) => ({ ...prev, insurance_policies: [...prev.insurance_policies, ...adds] })); setInsuranceSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, additions: [] }; return isEmptySuggestions(next) ? null : next; }); };
  const handleAcceptAllInsuranceRemovals = (e: any) => { e.preventDefault(); const removeKeys = insuranceSuggestions?.removals ?? new Set<string>(); setForm((prev) => ({ ...prev, insurance_policies: prev.insurance_policies.filter((it) => !removeKeys.has(normalizeDesc(it.description))) })); setInsuranceSuggestions((prev) => { if (!prev) return prev; const next = { ...prev, removals: new Set<string>() }; return isEmptySuggestions(next) ? null : next; }); };
  const handleClearInsuranceSuggestions = (e: any) => { e.preventDefault(); setInsuranceSuggestions(null); };

  // Non-list field suggestions (status and retirement fields)
  type NonListSuggestions = Partial<Pick<
    PersonSummary,
    'health_status' | 'smoker' | 'marital_status' | 'target_retirement_age' | 'target_retirement_income'
  >>;
  const [fieldSuggestions, setFieldSuggestions] = useState<NonListSuggestions | null>(null);

  // Load summary.json for selected client
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!team?.id || !selectedClient?.client_id) return;
      setLoading(true);
      try {
        const data = await loadSummary(team.id, selectedClient.client_id);
        if (!ignore && data && typeof data === 'object') {
          const mkId = (item: any) => ({ ...item, __localId: item && (item.__localId ?? (crypto as any).randomUUID?.() ?? String(Date.now())) });
          setForm({
            health_status: (data as any).health_status ?? null,
            smoker: (data as any).smoker ?? false,
            marital_status: (data as any).marital_status ?? null,
            target_retirement_age: (data as any).target_retirement_age ?? undefined,
            target_retirement_income: (data as any).target_retirement_income ?? null,
            current_income: Array.isArray((data as any).current_income) ? (data as any).current_income : [],
            current_expenses: Array.isArray((data as any).current_expenses) ? (data as any).current_expenses : [],
            savings_or_investments: Array.isArray((data as any).savings_or_investments) ? (data as any).savings_or_investments.map(mkId) : [],
            pension_holdings: Array.isArray((data as any).pension_holdings) ? (data as any).pension_holdings.map(mkId) : [],
            debt_holdings: Array.isArray((data as any).debt_holdings) ? (data as any).debt_holdings.map(mkId) : [],
            insurance_policies: Array.isArray((data as any).insurance_policies) ? (data as any).insurance_policies.map(mkId) : [],
          });
        }
      } catch (e) {
        // ignore errors, keep defaults
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [team?.id, selectedClient?.client_id]);

  // extraction hook
  const { extracting, extractError, onExtract } = useSummaryExtraction({
    teamId: team?.id,
    clientId: selectedClient?.client_id,
    form,
    setIncomeSuggestions,
    setExpenseSuggestions,
    setInvestmentSuggestions,
    setPensionSuggestions,
    setDebtSuggestions,
    setInsuranceSuggestions,
    setFieldSuggestions,
  });

  return (
    <section className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold mb-2">Summary</h1>
      <div className="mb-6 text-lg font-medium">{selectedClient ? selectedClient.name : 'No Client Selected'}</div>
      {/* Tabs: Overview / Shopping list */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button type="button" className={['px-3 py-1 rounded-t-md font-medium', activeTab === 'overview' ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-gray-100'].join(' ')} onClick={() => setActiveTab('overview')}>Overview</button>
          <button type="button" className={['px-3 py-1 rounded-t-md font-medium', activeTab === 'shopping' ? 'bg-orange-500 text-white' : 'text-gray-700 hover:bg-gray-100'].join(' ')} onClick={() => setActiveTab('shopping')}>Shopping list</button>
        </div>
      </div>
      {fieldSuggestions && Object.keys(fieldSuggestions).length > 0 && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Incoming field changes: {Object.keys(fieldSuggestions).length} pending. Review inline or use the toolbar.
        </div>
      )}

      {selectedClient && (
        <SummaryActionBar
          className="mb-4"
          loading={loading}
          saving={autosaveStatus === 'saving'}
          saved={autosaveStatus === 'saved'}
          saveError={autosaveError}
          extracting={extracting}
          extractError={extractError}
          canAct={Boolean(team?.id && selectedClient?.client_id)}
          fieldSuggestions={fieldSuggestions}
          onAcceptFields={() => {
            if (!fieldSuggestions) return;
            setForm((prev) => ({
              ...prev,
              health_status: (fieldSuggestions.health_status ?? prev.health_status) as any,
              smoker: (typeof fieldSuggestions.smoker !== 'undefined' ? (fieldSuggestions.smoker as any) : prev.smoker) as any,
              marital_status: (fieldSuggestions.marital_status ?? prev.marital_status) as any,
              target_retirement_age: (typeof fieldSuggestions.target_retirement_age !== 'undefined' ? (fieldSuggestions.target_retirement_age as any) : prev.target_retirement_age) as any,
              target_retirement_income: (fieldSuggestions.target_retirement_income ?? prev.target_retirement_income) as any,
            }));
            setFieldSuggestions(null);
          }}
          onRejectFields={() => setFieldSuggestions(null)}
          onSave={async () => {
            if (!team?.id || !selectedClient?.client_id) return;
            await saveSummary(team.id, selectedClient.client_id, form);
          }}
          onExtract={onExtract}
        />
      )}

      {/* Sticky suggestions panel */}
      {getTotalSuggestionCount() > 0 && (
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 py-2 mb-3">
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-amber-800">
              {getTotalSuggestionCount()} pending suggestions across sections
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="px-2 py-1 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100" onClick={scrollToPrevSuggestion}>Prev</button>
              <button type="button" className="px-2 py-1 rounded border border-amber-400 text-amber-800 bg-amber-100 hover:bg-amber-200" onClick={scrollToNextSuggestion}>Next</button>
              <label className="flex items-center gap-2 text-sm ml-2">
                <input type="checkbox" checked={showOnlySuggestions} onChange={(e) => setShowOnlySuggestions(e.target.checked)} />
                Show only items with suggestions
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' ? (
        <form className="space-y-8">
        <StatusSection form={form} setForm={setForm} fieldSuggestions={fieldSuggestions} setFieldSuggestions={setFieldSuggestions} />

        <RetirementSection form={form} setForm={setForm} fieldSuggestions={fieldSuggestions} setFieldSuggestions={setFieldSuggestions} cashflowEqual={cashflowEqual} />

        {/* Financials */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Financials</h2>
          <FinancialsSection
            form={form}
            setForm={setForm}
            incomeSuggestions={incomeSuggestions}
            setIncomeSuggestions={setIncomeSuggestions}
            expenseSuggestions={expenseSuggestions}
            setExpenseSuggestions={setExpenseSuggestions}
            showOnlySuggestions={showOnlySuggestions}
            normalizeDesc={normalizeDesc}
          />

          <InvestmentsSection
            form={form}
            setForm={setForm}
            investmentSuggestions={investmentSuggestions}
            setInvestmentSuggestions={setInvestmentSuggestions}
            showOnlySuggestions={showOnlySuggestions}
            normalizeDesc={normalizeDesc}
            onAdd={handleAddInvestment}
            onAcceptAllConflicts={handleAcceptAllInvestmentConflicts}
            onAcceptAllAdditions={handleAcceptAllInvestmentAdditions}
            onAcceptAllRemovals={handleAcceptAllInvestmentRemovals}
            onClearSuggestions={handleClearInvestmentSuggestions}
          />

          <PensionSection
            form={form}
            setForm={setForm}
            pensionSuggestions={pensionSuggestions}
            setPensionSuggestions={setPensionSuggestions}
            showOnlySuggestions={showOnlySuggestions}
            normalizeDesc={normalizeDesc}
            isEmptySuggestions={isEmptySuggestions}
            onAdd={handleAddPension}
            onAcceptAllConflicts={handleAcceptAllPensionConflicts}
            onAcceptAllAdditions={handleAcceptAllPensionAdditions}
            onAcceptAllRemovals={handleAcceptAllPensionRemovals}
            onClearSuggestions={handleClearPensionSuggestions}
          />

          <DebtSection
            form={form}
            setForm={setForm}
            debtSuggestions={debtSuggestions}
            setDebtSuggestions={setDebtSuggestions}
            showOnlySuggestions={showOnlySuggestions}
            normalizeDesc={normalizeDesc}
            isEmptySuggestions={isEmptySuggestions}
            onAdd={handleAddDebt}
            onAcceptAllConflicts={handleAcceptAllDebtConflicts}
            onAcceptAllAdditions={handleAcceptAllDebtAdditions}
            onAcceptAllRemovals={handleAcceptAllDebtRemovals}
            onClearSuggestions={handleClearDebtSuggestions}
          />

          <InsuranceSection
            form={form}
            setForm={setForm}
            insuranceSuggestions={insuranceSuggestions}
            setInsuranceSuggestions={setInsuranceSuggestions}
            showOnlySuggestions={showOnlySuggestions}
            normalizeDesc={normalizeDesc}
            isEmptySuggestions={isEmptySuggestions}
            onAdd={handleAddInsurance}
            onAcceptAllConflicts={handleAcceptAllInsuranceConflicts}
            onAcceptAllAdditions={handleAcceptAllInsuranceAdditions}
            onAcceptAllRemovals={handleAcceptAllInsuranceRemovals}
            onClearSuggestions={handleClearInsuranceSuggestions}
          />
        </section>
      </form>
      ) : (
        <div>
          <ShoppingListTab />
        </div>
      )}
    </section>
  );
}
