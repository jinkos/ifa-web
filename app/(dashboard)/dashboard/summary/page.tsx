"use client";
import { useEffect, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// --- Types mirroring external/IE_pydantic.py ---
// Work section removed from model

// Personal details (name/address/demographics) removed from model; no Gender type in this form
type HealthStatus = 'good' | 'some_problems' | 'mostly_good' | 'serious_problems';
type MaritalStatus =
  | 'single'
  | 'married'
  | 'civil_partnership'
  | 'divorced'
  | 'widowed'
  | 'separated'
  | 'cohabiting'
  | 'other';

type SavingType =
  | 'isa'
  | 'savings_account'
  | 'premium_bonds'
  | 'current_account'
  | 'deposit_fixed_term'
  | 'general_investment_account'
  | 'other';

type PensionTypes = 'defined_benefit' | 'workplace' | 'personal' | 'sipp' | 'ssas' | 'state' | 'other';

type DebtType = 'mortgage' | 'credit_card' | 'personal_loan' | 'student_loan' | 'auto_loan' | 'other';

type InsurancePolicyType = 'life' | 'critical_illness' | 'income_protection' | 'whole_of_life' | 'other';

type FrequencyType = 'weekly' | 'monthly' | 'quarterly' | 'annually';

type CashflowItem = {
  description?: string | null;
  inflow?: boolean | null; // kept for calculations, not shown in UI
  amount?: number | null;
  currency?: string | null; // ISO 4217
  frequency?: FrequencyType | null;
  is_gross?: boolean | null;
};

type ValueWithCurrency = {
  description?: string | null;
  amount?: number | null;
  currency?: string | null; // ISO 4217
};

type InvestmentHolding = {
  description?: string | null;
  type?: SavingType | null;
  value?: ValueWithCurrency | null;
  contribution?: CashflowItem | null;
};

type PensionHolding = {
  description?: string | null;
  type?: PensionTypes | null;
  value?: ValueWithCurrency | null;
  contribution?: CashflowItem | null;
};

type DebtHolding = {
  description?: string | null;
  type?: DebtType | null;
  balance?: ValueWithCurrency | null;
  repayment?: CashflowItem | null;
};

type InsurancePolicy = {
  description?: string | null;
  type?: InsurancePolicyType | null;
  coverage_amount?: ValueWithCurrency | null;
  premium?: CashflowItem | null;
};

type PersonSummary = {
  // Status
  health_status?: HealthStatus | null;
  smoker?: boolean | null;
  marital_status?: MaritalStatus | null;
  // Retirement & Goals
  target_retirement_age?: number | null;
  target_retirement_income?: CashflowItem | null;
  // Financials
  current_income: CashflowItem[];
  current_expenses: CashflowItem[];
  savings_or_investments: InvestmentHolding[];
  pension_holdings: PensionHolding[];
  debt_holdings: DebtHolding[];
  insurance_policies: InsurancePolicy[];
};

const healthOptions: HealthStatus[] = ['good', 'some_problems', 'mostly_good', 'serious_problems'];
const maritalOptions: MaritalStatus[] = [
  'single',
  'married',
  'civil_partnership',
  'divorced',
  'widowed',
  'separated',
  'cohabiting',
  'other',
];
const savingTypeOptions: SavingType[] = [
  'isa',
  'savings_account',
  'premium_bonds',
  'current_account',
  'deposit_fixed_term',
  'general_investment_account',
  'other',
];
const pensionTypeOptions: PensionTypes[] = ['defined_benefit', 'workplace', 'personal', 'sipp', 'ssas', 'state', 'other'];
const debtTypeOptions: DebtType[] = ['mortgage', 'credit_card', 'personal_loan', 'student_loan', 'auto_loan', 'other'];
const insuranceTypeOptions: InsurancePolicyType[] = ['life', 'critical_illness', 'income_protection', 'whole_of_life', 'other'];

const frequencyOptions: FrequencyType[] = ['weekly', 'monthly', 'quarterly', 'annually'];

// Reusable fieldsets
function CashflowItemForm(props: { value: CashflowItem | null | undefined; onChange: (v: CashflowItem | null) => void; title?: string; id?: string; hideDescription?: boolean }) {
  const { value, onChange, title, id, hideDescription } = props;
  const v = value ?? {};
  return (
    <div className="border rounded-md p-3 space-y-3">
      {title && <div className="font-medium text-sm">{title}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {!hideDescription && (
          <div>
            <Label>Description</Label>
            <Input value={v.description ?? ''} onChange={(e) => onChange({ ...v, description: e.target.value })} />
          </div>
        )}
        <div>
          <Label>Amount</Label>
          <Input type="number" value={v.amount ?? ''} onChange={(e) => onChange({ ...v, amount: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div>
          <Label>Currency</Label>
          <Input value={v.currency ?? 'GBP'} onChange={(e) => onChange({ ...v, currency: e.target.value })} />
        </div>
        <div>
          <Label>Frequency</Label>
          <select
            value={v.frequency ?? ''}
            onChange={(e) => onChange({ ...v, frequency: e.target.value ? (e.target.value as FrequencyType) : null })}
            className="border rounded px-2 py-1 w-full"
          >
            <option value="">Select frequency</option>
            {frequencyOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <Switch
            id={id ?? undefined}
            checked={!!v.is_gross}
            onCheckedChange={(checked) => onChange({ ...v, is_gross: checked })}
            label={v.is_gross ? 'Gross' : 'Net'}
          />
        </div>
      </div>
    </div>
  );
}

function ValueWithCurrencyForm({ value, onChange, title }: { value: ValueWithCurrency | null | undefined; onChange: (v: ValueWithCurrency | null) => void; title?: string }) {
  const v = value ?? {};
  return (
    <div className="border rounded-md p-3 space-y-3">
      {title && <div className="font-medium text-sm">{title}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Description</Label>
          <Input value={v.description ?? ''} onChange={(e) => onChange({ ...v, description: e.target.value })} />
        </div>
        <div>
          <Label>Amount</Label>
          <Input type="number" value={v.amount ?? ''} onChange={(e) => onChange({ ...v, amount: e.target.value === '' ? null : Number(e.target.value) })} />
        </div>
        <div>
          <Label>Currency</Label>
          <Input value={v.currency ?? 'GBP'} onChange={(e) => onChange({ ...v, currency: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

// Holding forms
function InvestmentHoldingForm({ value, onChange, onRemove, idBase }: { value: InvestmentHolding; onChange: (v: InvestmentHolding) => void; onRemove: () => void; idBase: string }) {
  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Investment</div>
        <Button variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Description</Label>
          <Input value={value.description ?? ''} onChange={(e) => onChange({ ...value, description: e.target.value })} />
        </div>
        <div>
          <Label>Type</Label>
          <select
            className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            value={value.type ?? ''}
            onChange={(e) => onChange({ ...value, type: (e.target.value || null) as SavingType | null })}
          >
            <option value="">Select…</option>
            {savingTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ValueWithCurrencyForm title="Value" value={value.value} onChange={(v) => onChange({ ...value, value: v })} />
      <CashflowItemForm title="Contribution" value={value.contribution} onChange={(v) => onChange({ ...value, contribution: v })} id={`${idBase}-contribution-is_gross`} />
    </div>
  );
}

function PensionHoldingForm({ value, onChange, onRemove, idBase }: { value: PensionHolding; onChange: (v: PensionHolding) => void; onRemove: () => void; idBase: string }) {
  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Pension</div>
        <Button variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Description</Label>
          <Input value={value.description ?? ''} onChange={(e) => onChange({ ...value, description: e.target.value })} />
        </div>
        <div>
          <Label>Type</Label>
          <select
            className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            value={value.type ?? ''}
            onChange={(e) => onChange({ ...value, type: (e.target.value || null) as PensionTypes | null })}
          >
            <option value="">Select…</option>
            {pensionTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ValueWithCurrencyForm title="Value" value={value.value} onChange={(v) => onChange({ ...value, value: v })} />
      <CashflowItemForm title="Contribution" value={value.contribution} onChange={(v) => onChange({ ...value, contribution: v })} id={`${idBase}-contribution-is_gross`} />
    </div>
  );
}

function DebtHoldingForm({ value, onChange, onRemove, idBase }: { value: DebtHolding; onChange: (v: DebtHolding) => void; onRemove: () => void; idBase: string }) {
  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Debt</div>
        <Button variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Description</Label>
          <Input value={value.description ?? ''} onChange={(e) => onChange({ ...value, description: e.target.value })} />
        </div>
        <div>
          <Label>Type</Label>
          <select
            className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            value={value.type ?? ''}
            onChange={(e) => onChange({ ...value, type: (e.target.value || null) as DebtType | null })}
          >
            <option value="">Select…</option>
            {debtTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ValueWithCurrencyForm title="Balance" value={value.balance} onChange={(v) => onChange({ ...value, balance: v })} />
      <CashflowItemForm title="Repayment" value={value.repayment} onChange={(v) => onChange({ ...value, repayment: v })} id={`${idBase}-repayment-is_gross`} />
    </div>
  );
}

function InsurancePolicyForm({ value, onChange, onRemove, idBase }: { value: InsurancePolicy; onChange: (v: InsurancePolicy) => void; onRemove: () => void; idBase: string }) {
  return (
    <div className="border rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Insurance Policy</div>
        <Button variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label>Description</Label>
          <Input value={value.description ?? ''} onChange={(e) => onChange({ ...value, description: e.target.value })} />
        </div>
        <div>
          <Label>Type</Label>
          <select
            className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            value={value.type ?? ''}
            onChange={(e) => onChange({ ...value, type: (e.target.value || null) as InsurancePolicyType | null })}
          >
            <option value="">Select…</option>
            {insuranceTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>
      <ValueWithCurrencyForm title="Coverage Amount" value={value.coverage_amount} onChange={(v) => onChange({ ...value, coverage_amount: v })} />
      <CashflowItemForm title="Premium" value={value.premium} onChange={(v) => onChange({ ...value, premium: v })} id={`${idBase}-premium-is_gross`} />
    </div>
  );
}

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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Load summary.json for selected client
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!team?.id || !selectedClient?.client_id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/summary?teamId=${team.id}&clientId=${selectedClient.client_id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load summary');
        const data = (await res.json()) as Partial<PersonSummary>;
        if (!ignore && data && typeof data === 'object') {
          // Ensure arrays exist even if missing in stored JSON
          setForm({
            health_status: (data as any).health_status ?? null,
            smoker: (data as any).smoker ?? false,
            marital_status: (data as any).marital_status ?? null,
            target_retirement_age: (data as any).target_retirement_age ?? undefined,
            target_retirement_income: (data as any).target_retirement_income ?? null,
            current_income: Array.isArray((data as any).current_income) ? (data as any).current_income : [],
            current_expenses: Array.isArray((data as any).current_expenses) ? (data as any).current_expenses : [],
            savings_or_investments: Array.isArray((data as any).savings_or_investments) ? (data as any).savings_or_investments : [],
            pension_holdings: Array.isArray((data as any).pension_holdings) ? (data as any).pension_holdings : [],
            debt_holdings: Array.isArray((data as any).debt_holdings) ? (data as any).debt_holdings : [],
            insurance_policies: Array.isArray((data as any).insurance_policies) ? (data as any).insurance_policies : [],
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

  return (
    <section className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold mb-2">Summary</h1>
      <div className="mb-6 text-lg font-medium">{selectedClient ? selectedClient.name : 'No Client Selected'}</div>

      {selectedClient && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">{loading ? 'Loading…' : saved ? 'All changes saved.' : 'Edit fields then click Save.'}</div>
          <div className="flex items-center gap-3">
            {saveError && <span className="text-red-600 text-sm">{saveError}</span>}
            <Button
              onClick={async (e) => {
                e.preventDefault();
                if (!team?.id || !selectedClient?.client_id) return;
                setSaving(true);
                setSaveError(null);
                setSaved(false);
                try {
                  const res = await fetch(`/api/summary?teamId=${team.id}&clientId=${selectedClient.client_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                  });
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to save');
                  }
                  setSaved(true);
                  setTimeout(() => setSaved(false), 3000);
                } catch (err: any) {
                  setSaveError(err.message || 'Failed to save');
                  setTimeout(() => setSaveError(null), 4000);
                } finally {
                  setSaving(false);
                }
              }}
              disabled={loading || saving}
              className={`${loading || saving ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              onClick={async (e) => {
                e.preventDefault();
                if (!team?.id || !selectedClient?.client_id) return;
                setExtracting(true);
                setExtractError(null);
                try {
                  const r = await fetch('/api/docs/extract_summary', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ team_id: team.id, client_id: selectedClient.client_id }),
                  });
                  if (!r.ok) {
                    const err = await r.json().catch(() => ({}));
                    throw new Error(err.error || 'Extract failed');
                  }
                  // Use the API response to overwrite the current form state (do not fetch from storage)
                  const data = (await r.json()) as Partial<PersonSummary>;
                  setForm({
                    health_status: (data as any).health_status ?? null,
                    smoker: (data as any).smoker ?? false,
                    marital_status: (data as any).marital_status ?? null,
                    target_retirement_age: (data as any).target_retirement_age ?? undefined,
                    target_retirement_income: (data as any).target_retirement_income ?? null,
                    current_income: Array.isArray((data as any).current_income) ? (data as any).current_income : [],
                    current_expenses: Array.isArray((data as any).current_expenses) ? (data as any).current_expenses : [],
                    savings_or_investments: Array.isArray((data as any).savings_or_investments) ? (data as any).savings_or_investments : [],
                    pension_holdings: Array.isArray((data as any).pension_holdings) ? (data as any).pension_holdings : [],
                    debt_holdings: Array.isArray((data as any).debt_holdings) ? (data as any).debt_holdings : [],
                    insurance_policies: Array.isArray((data as any).insurance_policies) ? (data as any).insurance_policies : [],
                  });
                } catch (err: any) {
                  setExtractError(err.message || 'Extract failed');
                  setTimeout(() => setExtractError(null), 4000);
                } finally {
                  setExtracting(false);
                }
              }}
              disabled={loading || extracting}
              className={`${loading || extracting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {extracting ? 'Extracting…' : 'Extract from Docs'}
            </Button>
            {extractError && <span className="text-red-600 text-sm">{extractError}</span>}
          </div>
        </div>
      )}

  <form className="space-y-8">

        {/* Work section removed */}

        {/* 5) Status */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Health status</Label>
              <select className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm" value={form.health_status ?? ''} onChange={(e) => setForm({ ...form, health_status: (e.target.value || null) as HealthStatus | null })}>
                <option value="">Select…</option>
                {healthOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input id="smoker" type="checkbox" checked={!!form.smoker} onChange={(e) => setForm({ ...form, smoker: e.target.checked })} />
              <Label htmlFor="smoker">Smoker</Label>
            </div>
            <div>
              <Label>Marital status</Label>
              <select className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm" value={form.marital_status ?? ''} onChange={(e) => setForm({ ...form, marital_status: (e.target.value || null) as MaritalStatus | null })}>
                <option value="">Select…</option>
                {maritalOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 6) Retirement & Goals */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Retirement & Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Target retirement age</Label>
              <Input type="number" value={form.target_retirement_age ?? ''} onChange={(e) => setForm({ ...form, target_retirement_age: e.target.value === '' ? null : Number(e.target.value) })} />
            </div>
          </div>
          <div className="mt-3">
            <CashflowItemForm
              title="Target retirement income (today's money)"
              value={form.target_retirement_income ? { ...form.target_retirement_income, description: 'Target retirement income' } : { description: 'Target retirement income' }}
              onChange={(v) => setForm({ ...form, target_retirement_income: v ? { ...v, description: 'Target retirement income' } : { description: 'Target retirement income' } })}
              hideDescription
              id={`retirement-income-is_gross`}
            />
          </div>
        </section>

        {/* 7) Financials */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Financials</h2>
          {/* Income */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Current Income</h3>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setForm({ ...form, current_income: [...form.current_income, {}] });
                }}
              >
                Add income
              </Button>
            </div>
            <div className="space-y-3">
              {form.current_income.map((it, idx) => (
                <div key={idx} className="border rounded-md p-3">
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setForm({ ...form, current_income: form.current_income.filter((_, i) => i !== idx) });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <CashflowItemForm
                    value={it}
                    onChange={(v) => setForm({ ...form, current_income: form.current_income.map((x, i) => (i === idx ? (v ?? {}) : x)) })}
                    id={`income-${idx}-is_gross`}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Expenses */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Current Expenses</h3>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setForm({ ...form, current_expenses: [...form.current_expenses, {}] });
                }}
              >
                Add expense
              </Button>
            </div>
            <div className="space-y-3">
              {form.current_expenses.map((it, idx) => (
                <div key={idx} className="border rounded-md p-3">
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setForm({ ...form, current_expenses: form.current_expenses.filter((_, i) => i !== idx) });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <CashflowItemForm
                    value={it}
                    onChange={(v) => setForm({ ...form, current_expenses: form.current_expenses.map((x, i) => (i === idx ? (v ?? {}) : x)) })}
                    id={`expense-${idx}-is_gross`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Savings / Investments */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Savings or Investments</h3>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setForm({ ...form, savings_or_investments: [...form.savings_or_investments, {}] as InvestmentHolding[] });
                }}
              >
                Add investment
              </Button>
            </div>
            <div className="space-y-3">
              {form.savings_or_investments.map((it, idx) => (
                <InvestmentHoldingForm
                  key={idx}
                  value={it}
                  onChange={(v) => setForm({ ...form, savings_or_investments: form.savings_or_investments.map((x, i) => (i === idx ? v : x)) })}
                  onRemove={() => setForm({ ...form, savings_or_investments: form.savings_or_investments.filter((_, i) => i !== idx) })}
                  idBase={`investment-${idx}`}
                />
              ))}
            </div>
          </div>

          {/* Pension holdings */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Pension Holdings</h3>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setForm({ ...form, pension_holdings: [...form.pension_holdings, {}] as PensionHolding[] });
                }}
              >
                Add pension
              </Button>
            </div>
            <div className="space-y-3">
              {form.pension_holdings.map((it, idx) => (
                <PensionHoldingForm
                  key={idx}
                  value={it}
                  onChange={(v) => setForm({ ...form, pension_holdings: form.pension_holdings.map((x, i) => (i === idx ? v : x)) })}
                  onRemove={() => setForm({ ...form, pension_holdings: form.pension_holdings.filter((_, i) => i !== idx) })}
                  idBase={`pension-${idx}`}
                />
              ))}
            </div>
          </div>

          {/* Debt holdings */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Debt Holdings</h3>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setForm({ ...form, debt_holdings: [...form.debt_holdings, {}] as DebtHolding[] });
                }}
              >
                Add debt
              </Button>
            </div>
            <div className="space-y-3">
              {form.debt_holdings.map((it, idx) => (
                <DebtHoldingForm
                  key={idx}
                  value={it}
                  onChange={(v) => setForm({ ...form, debt_holdings: form.debt_holdings.map((x, i) => (i === idx ? v : x)) })}
                  onRemove={() => setForm({ ...form, debt_holdings: form.debt_holdings.filter((_, i) => i !== idx) })}
                  idBase={`debt-${idx}`}
                />
              ))}
            </div>
          </div>

          {/* Insurance policies */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Insurance Policies</h3>
              <Button
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setForm({ ...form, insurance_policies: [...form.insurance_policies, {}] as InsurancePolicy[] });
                }}
              >
                Add policy
              </Button>
            </div>
            <div className="space-y-3">
              {form.insurance_policies.map((it, idx) => (
                <InsurancePolicyForm
                  key={idx}
                  value={it}
                  onChange={(v) => setForm({ ...form, insurance_policies: form.insurance_policies.map((x, i) => (i === idx ? v : x)) })}
                  onRemove={() => setForm({ ...form, insurance_policies: form.insurance_policies.filter((_, i) => i !== idx) })}
                  idBase={`insurance-${idx}`}
                />
              ))}
            </div>
          </div>
        </section>
      </form>
    </section>
  );
}
