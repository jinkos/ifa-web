"use client";
import React, { useMemo, useState } from 'react';
import Field from '@/components/ui/form/Field';
import FormGrid from '@/components/ui/form/FormGrid';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import BalanceIncomeEditor from './BalanceIncomeEditor';
import BalanceBuyToLetEditor from './BalanceBuyToLetEditor';
import BalanceInvestmentEditor from './BalanceInvestmentEditor';
import BalanceLoanEditor from './BalanceLoanEditor';
import BalancePensionEditor from './BalancePensionEditor';
import BalancePropertyEditor from './BalancePropertyEditor';
import type {
  BalanceSheetItemKind,
  PersonalBalanceSheetItem,
  CashFlow,
  BalanceFrequency,
  NetGrossIndicator,
} from '@/lib/types/balance';
import SuggestionInline from '@/components/ui/suggestion-inline';
import { useShoppingList } from '@/components/shopping/ShoppingListContext';
import { Tooltip } from '@/components/ui/tooltip';
import { IconNotepad } from '@/components/ui/icons/IconNotepad';

const balanceItemLabels: Record<BalanceSheetItemKind, string> = {
  salary_income: 'Salary income',
  side_hustle_income: 'Side hustle income',
  self_employment_income: 'Self-employment income',
  expenses: 'Expenses',
  buy_to_let: 'Buy-to-let property',
  current_account: 'Current account',
  gia: 'General investment account (GIA)',
  isa: 'Individual savings account (ISA)',
  premium_bond: 'Premium Bonds',
  savings_account: 'Savings account',
  uni_fees_savings_plan: 'University fees savings plan',
  vct: 'Venture Capital Trust (VCT)',
  credit_card: 'Credit card',
  personal_loan: 'Personal loan',
  student_loan: 'Student loan',
  main_residence: 'Main residence',
  holiday_home: 'Holiday home',
  other_valuable_item: 'Other valuable item',
  workplace_pension: 'Workplace pension',
  defined_benefit_pension: 'Defined benefit pension',
  personal_pension: 'Personal pension',
  state_pension: 'State pension',
};

const defaultCashFlow = (): CashFlow => ({ periodic_amount: null, frequency: 'monthly', net_gross: 'gross' });

type IncomeKind = 'salary_income' | 'side_hustle_income' | 'self_employment_income';

const incomeConfig: Record<IncomeKind, { amountLabel: string; defaultFrequency: BalanceFrequency; defaultNetGross: NetGrossIndicator }> = {
  salary_income: { amountLabel: 'Salary', defaultFrequency: 'monthly', defaultNetGross: 'net' },
  self_employment_income: { amountLabel: 'Profits', defaultFrequency: 'annually', defaultNetGross: 'gross' },
  side_hustle_income: { amountLabel: 'Drawings', defaultFrequency: 'monthly', defaultNetGross: 'gross' },
};

const makeDefaultItem = (kind: BalanceSheetItemKind): PersonalBalanceSheetItem => {
  const id = (crypto as any).randomUUID?.() ?? String(Date.now());
  const common = { type: kind, currency: 'GBP', __localId: id, description: balanceItemLabels[kind] } as any;
  switch (kind) {
    // INCOME
    case 'salary_income':
    case 'side_hustle_income':
    case 'self_employment_income': {
      const cfg = incomeConfig[kind as IncomeKind];
      const income: CashFlow = { periodic_amount: null, frequency: cfg.defaultFrequency, net_gross: cfg.defaultNetGross };
      return { ...common, ite: { income } };
    }

    // BUY TO LET
    case 'buy_to_let':
      return {
        ...common,
        ite: {
          rental_income: defaultCashFlow(),
          property_value: null,
          loan: { balance: null, repayment: { periodic_amount: null, frequency: 'monthly', net_gross: 'net' } },
        },
      };

    // INVESTMENTS
    case 'current_account':
    case 'gia':
    case 'isa':
    case 'premium_bond':
    case 'savings_account':
    case 'uni_fees_savings_plan':
    case 'vct':
      return { ...common, ite: { contribution: null, income: null, investment_value: null } };

    // LOANS
    case 'credit_card':
    case 'personal_loan':
    case 'student_loan':
      return { ...common, ite: { balance: null, repayment: null } };

    // PROPERTIES
    case 'main_residence':
    case 'holiday_home':
    case 'other_valuable_item':
      return { ...common, ite: { value: null, loan: null } };

    // PENSIONS (non-state default cashflows; state uses pension cashflow)
    case 'workplace_pension':
    case 'defined_benefit_pension':
    case 'personal_pension':
      return {
        ...common,
        ite: {
          contribution: { periodic_amount: null, frequency: 'monthly', net_gross: 'gross' },
          income: { periodic_amount: null, frequency: 'monthly', net_gross: 'net' },
          investment_value: null,
          employer_contribution: { periodic_amount: null, frequency: 'monthly', net_gross: 'gross' },
        },
      };
    case 'state_pension':
      return {
        ...common,
        ite: {
          pension: { periodic_amount: null, frequency: 'monthly', net_gross: 'net' },
        } as any,
      };
    case 'expenses':
      return {
        ...common,
        ite: {
          expenditure: { periodic_amount: null, frequency: 'monthly', net_gross: 'gross' },
        } as any,
      };
  }
  // Fallback (should not hit): treat as investment-like
  return { ...(common as any), ite: { contribution: null, income: null, investment_value: null } } as any;
};

type ItemPatch = { type: BalanceSheetItemKind; description: string | null; patch: Partial<PersonalBalanceSheetItem> };

export default function BalanceSheetSection({
  items,
  onChange,
  suggestions,
  onAccept,
  onReject,
  onAcceptChange,
  onRejectChange,
}: {
  items: PersonalBalanceSheetItem[];
  onChange: (next: PersonalBalanceSheetItem[]) => void;
  suggestions?: ItemPatch[] | null;
  onAccept?: (type: BalanceSheetItemKind, description: string | null) => void;
  onReject?: (type: BalanceSheetItemKind, description: string | null) => void;
  onAcceptChange?: (type: BalanceSheetItemKind, description: string | null, path: string) => void;
  onRejectChange?: (type: BalanceSheetItemKind, description: string | null, path: string) => void;
}) {
  const shopping = useShoppingList();
  const [kind, setKind] = useState<BalanceSheetItemKind>('salary_income');

  const options = useMemo(() => Object.entries(balanceItemLabels) as Array<[BalanceSheetItemKind, string]>, []);
  // Category-based accents with higher contrast
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
        return 'bg-violet-100 border-violet-300'; // Pensions
      default:
        return 'bg-muted/30';
    }
  };

  // Compute duplicate descriptions (trimmed, case-insensitive)
  const descCounts = useMemo(() => {
    const m = new Map<string, number>();
    (items ?? []).forEach((it) => {
      const d = (it.description ?? '').trim().toLowerCase();
      if (!d) return;
      m.set(d, (m.get(d) ?? 0) + 1);
    });
    return m;
  }, [items]);

  const getDescriptionError = (it: PersonalBalanceSheetItem): string | undefined => {
    const raw = (it.description ?? '');
    const trimmed = raw.trim();
    if (trimmed.length === 0) return 'Description is required';
    const d = trimmed.toLowerCase();
    const c = descCounts.get(d) ?? 0;
    return c > 1 ? 'Description must be unique' : undefined;
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    const newItem = makeDefaultItem(kind);
    onChange([...(items ?? []), newItem]);
  };

  // Sorting by sub type: Income, Pension, Investment, Buy to let, Property, Loan
  type Category = 'income' | 'pension' | 'investment' | 'buy_to_let' | 'property' | 'loan';
  const getCategory = (t: BalanceSheetItemKind): Category => {
    switch (t) {
      case 'salary_income':
      case 'side_hustle_income':
      case 'self_employment_income':
      case 'expenses':
        return 'income';
      case 'workplace_pension':
      case 'defined_benefit_pension':
      case 'personal_pension':
      case 'state_pension':
        return 'pension';
      case 'current_account':
      case 'gia':
      case 'isa':
      case 'premium_bond':
      case 'savings_account':
      case 'uni_fees_savings_plan':
      case 'vct':
        return 'investment';
      case 'buy_to_let':
        return 'buy_to_let';
      case 'main_residence':
      case 'holiday_home':
      case 'other_valuable_item':
        return 'property';
      case 'credit_card':
      case 'personal_loan':
      case 'student_loan':
        return 'loan';
      default:
        return 'investment';
    }
  };

  const categoryWeight: Record<Category, number> = {
    income: 0,
    pension: 1,
    investment: 2,
    buy_to_let: 3,
    property: 4,
    loan: 5,
  };

  const handleSortByCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    const weighted = (items ?? []).map((it, idx) => ({
      it,
      idx,
      w: categoryWeight[getCategory(it.type as BalanceSheetItemKind)],
    }));
    weighted.sort((a, b) => (a.w - b.w) || (a.idx - b.idx)); // stable within same category
    onChange(weighted.map((x) => x.it));
  };

  const handleRemove = (localId: string | undefined) => {
    if (!localId) return;
    // If this item is in the shopping list, remove it as well
    const it = items.find((x) => x.__localId === localId);
    if (it) {
      const normDesc = (it.description ?? '').trim().toLowerCase();
      const sectionKey = `balance.item:${it.type}|${normDesc}`;
      if (shopping.existsSection(sectionKey)) shopping.removeSection(sectionKey);
    }
    onChange(items.filter((it) => it.__localId !== localId));
  };

  const updateItem = (localId: string | undefined, next: PersonalBalanceSheetItem) => {
    if (!localId) return;
    onChange(items.map((it) => (it.__localId === localId ? next : it)));
  };

  // Reordering helpers
  const move = <T,>(arr: T[], from: number, to: number): T[] => {
    if (from === to) return arr;
    if (from < 0 || from >= arr.length) return arr;
    if (to < 0 || to >= arr.length) return arr;
    const next = arr.slice();
    const [spliced] = next.splice(from, 1);
    next.splice(to, 0, spliced);
    return next;
  };

  const moveByIndex = (index: number, delta: number) => {
    const to = index + delta;
    onChange(move(items, index, to));
  };

  const normalize = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
  const flattenKeys = (obj: any, prefix = ''): string[] => {
    if (!obj || typeof obj !== 'object') return [];
    const out: string[] = [];
    for (const k of Object.keys(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      const v = obj[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        out.push(...flattenKeys(v, path));
      } else {
        out.push(path);
      }
    }
    return out;
  };

  const incomeAmountLabel = (kind: BalanceSheetItemKind): string => {
    if (kind === 'salary_income') return 'Salary';
    if (kind === 'self_employment_income') return 'Profits';
    if (kind === 'side_hustle_income') return 'Drawings';
    return 'Amount';
  };

  const investmentIncomeLabel = (kind: BalanceSheetItemKind): string => {
    if (kind === 'current_account' || kind === 'premium_bond' || kind === 'savings_account') return 'Interest';
    if (kind === 'gia' || kind === 'vct') return 'Dividends';
    if (kind === 'isa') return 'Withdrawals';
    return 'Income';
  };

  const labelForPath = (type: BalanceSheetItemKind, path: string): string => {
    // Common
    if (path === 'currency') return 'Currency';

    // Income items
    if (type === 'salary_income' || type === 'side_hustle_income' || type === 'self_employment_income') {
      if (path === 'ite.income.periodic_amount') return incomeAmountLabel(type);
      if (path === 'ite.income.frequency') return 'Frequency';
      if (path === 'ite.income.net_gross') return 'Net/Gross';
    }

    // Buy to let
  if (type === 'buy_to_let') {
      if (path === 'ite.property_value') return 'Property value';
      if (path === 'ite.rental_income.periodic_amount') return 'Rent';
      if (path === 'ite.rental_income.frequency') return 'Rent frequency';
      if (path === 'ite.rental_income.net_gross') return 'Rent net/gross';
      if (path === 'ite.loan.balance') return 'Mortgage Balance';
      if (path === 'ite.loan.repayment.periodic_amount') return 'Repayment';
      if (path === 'ite.loan.repayment.frequency') return 'Repayment frequency';
      if (path === 'ite.loan.repayment.net_gross') return 'Repayment net/gross';
    }

    // Investment items
  if (
      type === 'current_account' ||
      type === 'gia' ||
      type === 'isa' ||
      type === 'premium_bond' ||
      type === 'savings_account' ||
      type === 'uni_fees_savings_plan' ||
      type === 'vct'
    ) {
      if (path === 'ite.investment_value') return 'Investment value';
      if (path === 'ite.contribution.periodic_amount') return 'Contribution';
      if (path === 'ite.contribution.frequency') return 'Contribution frequency';
      if (path === 'ite.contribution.net_gross') return 'Contribution net/gross';
      if (path === 'ite.income.periodic_amount') return investmentIncomeLabel(type);
      if (path === 'ite.income.frequency') return `${investmentIncomeLabel(type)} frequency`;
      if (path === 'ite.income.net_gross') return `${investmentIncomeLabel(type)} net/gross`;
    }

    // Loan items
  if (type === 'credit_card' || type === 'personal_loan' || type === 'student_loan') {
      if (path === 'ite.balance') return 'Balance';
      if (path === 'ite.repayment.periodic_amount') return 'Repayment';
      if (path === 'ite.repayment.frequency') return 'Repayment frequency';
      if (path === 'ite.repayment.net_gross') return 'Repayment net/gross';
    }

    // Property items
    if (type === 'main_residence' || type === 'holiday_home' || type === 'other_valuable_item') {
      if (path === 'ite.value') return type === 'other_valuable_item' ? 'Item value' : 'Property value';
      if (path === 'ite.loan.balance') return type === 'other_valuable_item' ? 'Loan Balance' : 'Mortgage Balance';
      if (path === 'ite.loan.repayment.periodic_amount') return 'Repayment';
      if (path === 'ite.loan.repayment.frequency') return 'Repayment frequency';
      if (path === 'ite.loan.repayment.net_gross') return 'Repayment net/gross';
    }

    // Pension items
    if (type === 'workplace_pension' || type === 'defined_benefit_pension' || type === 'personal_pension') {
      if (path === 'ite.investment_value') return 'Pension value';
      if (path === 'ite.contribution.periodic_amount') return 'Personal Contribution';
      if (path === 'ite.contribution.frequency') return 'Personal Contribution frequency';
      if (path === 'ite.contribution.net_gross') return 'Personal Contribution net/gross';
      if (path === 'ite.employer_contribution.periodic_amount') return 'Employer Contribution';
      if (path === 'ite.employer_contribution.frequency') return 'Employer Contribution frequency';
      if (path === 'ite.employer_contribution.net_gross') return 'Employer Contribution net/gross';
      if (path === 'ite.income.periodic_amount') return 'Drawings';
      if (path === 'ite.income.frequency') return 'Drawings frequency';
      if (path === 'ite.income.net_gross') return 'Drawings net/gross';
    }
    if (type === 'state_pension') {
      if (path === 'ite.pension.periodic_amount') return 'State pension';
      if (path === 'ite.pension.frequency') return 'State pension frequency';
      if (path === 'ite.pension.net_gross') return 'State pension net/gross';
    }

    // Expenses
    if (type === 'expenses') {
      if (path === 'ite.expenditure.periodic_amount') return 'Expenditure';
      if (path === 'ite.expenditure.frequency') return 'Expenditure frequency';
      if (path === 'ite.expenditure.net_gross') return 'Expenditure net/gross';
    }

    // Fallback: prettify path
    const last = path.split('.').pop() || path;
    return last.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  };

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2">Balance Sheet</h2>

      <FormGrid colsMd={3}>
        <Field label="Add item">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as BalanceSheetItemKind)}
          >
            {options.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
        </Field>
        <div className="flex items-end">
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="flex items-end justify-end">
          <Button variant="outline" onClick={handleSortByCategory} aria-label="Sort by category">
            Sort by category
          </Button>
        </div>
      </FormGrid>

      <div className="mt-6 space-y-2">
        {(!items || items.length === 0) && (
          <div className="text-sm text-muted-foreground">No items added yet.</div>
        )}
        {items?.map((it, idx) => {
          const key = it.__localId ?? it.id ?? Math.random().toString();
          const isIncome = it.type === 'salary_income' || it.type === 'side_hustle_income' || it.type === 'self_employment_income' || it.type === 'expenses';
          const isBuyToLet = it.type === 'buy_to_let';
          const isInvestment = (
            it.type === 'current_account' ||
            it.type === 'gia' ||
            it.type === 'isa' ||
            it.type === 'premium_bond' ||
            it.type === 'savings_account' ||
            it.type === 'uni_fees_savings_plan' ||
            it.type === 'vct'
          );
          const isLoan = it.type === 'credit_card' || it.type === 'personal_loan' || it.type === 'student_loan';
          const isPension = it.type === 'workplace_pension' || it.type === 'defined_benefit_pension' || it.type === 'personal_pension' || it.type === 'state_pension';
          const isProperty = it.type === 'main_residence' || it.type === 'holiday_home' || it.type === 'other_valuable_item';
          const itemPatch = (suggestions ?? [])?.find((p) => p.type === (it.type as any) && normalize(p.description) === normalize(it.description));
          const label = balanceItemLabels[it.type as BalanceSheetItemKind] ?? it.type;
          const sectionKey = `balance.item:${it.type}|${normalize(it.description)}`;
          const shoppingLabel = `${label}${it.description ? ' — ' + it.description : ''}`;
          const inShopping = shopping.existsSection(sectionKey);
          return (
            <div key={key} className={`border rounded p-3 shadow-sm ${getItemBg(it.type as BalanceSheetItemKind)}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium">{label}</div>
                <div className="flex gap-2 items-center">
                  <Tooltip content="Add to shopping list">
                    <button
                      aria-pressed={inShopping}
                      title="Add to shopping list"
                      type="button"
                      className={"p-1 rounded " + (inShopping ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100')}
                      onClick={() => {
                        if (inShopping) shopping.removeSection(sectionKey);
                        else shopping.addSection(sectionKey, shoppingLabel, 'Balance sheet', { type: it.type, description: it.description, localId: it.__localId });
                      }}
                    >
                      <IconNotepad filled={inShopping} />
                    </button>
                  </Tooltip>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveByIndex(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Move up"
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveByIndex(idx, 1)}
                    disabled={idx === (items.length - 1)}
                    aria-label="Move down"
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleRemove(it.__localId)} aria-label="Remove" title="Remove">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {itemPatch ? (
                <div className="mt-2 space-y-2">
                  {flattenKeys(itemPatch.patch).map((path) => (
                    <SuggestionInline
                      key={path}
                      label={`Incoming ${labelForPath(it.type as any, path)}:`}
                      value={String(path.split('.').reduce((acc: any, k: string) => (acc ? acc[k] : undefined), itemPatch.patch) ?? '')}
                      onAccept={() => onAcceptChange?.(it.type as any, it.description ?? null, path)}
                      onReject={() => onRejectChange?.(it.type as any, it.description ?? null, path)}
                    />
                  ))}
                </div>
              ) : null}
              {isIncome && (
                <BalanceIncomeEditor
                  item={it as any}
                  amountLabel={it.type === 'expenses' ? 'Expenditure' : incomeConfig[it.type as IncomeKind]?.amountLabel ?? 'Amount'}
                  descriptionError={getDescriptionError(it)}
                  onChange={(next) => updateItem(it.__localId, next)}
                />
              )}
              {isBuyToLet && (
                <BalanceBuyToLetEditor
                  item={it as any}
                  descriptionError={getDescriptionError(it)}
                  onChange={(next) => updateItem(it.__localId, next)}
                />
              )}
              {isInvestment && (
                <BalanceInvestmentEditor
                  item={it as any}
                  descriptionError={getDescriptionError(it)}
                  onChange={(next) => updateItem(it.__localId, next)}
                />
              )}
              {isLoan && (
                <BalanceLoanEditor
                  item={it as any}
                  descriptionError={getDescriptionError(it)}
                  onChange={(next) => updateItem(it.__localId, next)}
                />
              )}
              {isPension && (
                <BalancePensionEditor
                  item={it as any}
                  descriptionError={getDescriptionError(it)}
                  onChange={(next) => updateItem(it.__localId, next)}
                />
              )}
              {isProperty && (
                <BalancePropertyEditor
                  item={it as any}
                  descriptionError={getDescriptionError(it)}
                  onChange={(next) => updateItem(it.__localId, next)}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
