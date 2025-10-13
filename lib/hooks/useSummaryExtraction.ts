import { useCallback, useEffect, useRef, useState } from 'react';
import { extractSummary } from '@/lib/api/summary';
import { buildListSuggestions } from '@/lib/suggestions';
import {
  normalizeDesc,
  cashflowEqual,
  investmentEqual,
  pensionEqual,
  debtEqual,
  insuranceEqual,
} from '@/lib/summaryHelpers';
import type {
  CashflowItem,
  InvestmentHolding,
  PensionHolding,
  DebtHolding,
  InsurancePolicy,
  PersonSummary,
} from '@/lib/types/summary';
import type { ListSuggestions } from '@/lib/suggestions';

type SetSuggestions<T> = React.Dispatch<React.SetStateAction<ListSuggestions<T> | null>>;

export function useSummaryExtraction(opts: {
  teamId?: string | number | null;
  clientId?: string | number | null;
  form: PersonSummary;
  setIncomeSuggestions: SetSuggestions<CashflowItem>;
  setExpenseSuggestions: SetSuggestions<CashflowItem>;
  setInvestmentSuggestions: SetSuggestions<InvestmentHolding>;
  setPensionSuggestions: SetSuggestions<PensionHolding>;
  setDebtSuggestions: SetSuggestions<DebtHolding>;
  setInsuranceSuggestions: SetSuggestions<InsurancePolicy>;
  setFieldSuggestions: React.Dispatch<React.SetStateAction<Partial<PersonSummary> | null>>;
}) {
  const { teamId, clientId, form } = opts;
  const mounted = useRef(true);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  useEffect(() => () => { mounted.current = false; }, []);

  const onExtract = useCallback(async () => {
    if (!teamId || !clientId) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const data = await extractSummary(teamId as any, clientId as any);

      // Income
      const incomingIncome: CashflowItem[] = Array.isArray((data as any).current_income) ? (data as any).current_income : [];
      const currentIncome: CashflowItem[] = form.current_income ?? [];
      opts.setIncomeSuggestions(buildListSuggestions<CashflowItem>(
        currentIncome,
        incomingIncome,
        (it) => normalizeDesc(it.description),
        (a, b) => cashflowEqual(a ?? undefined, b ?? undefined)
      ));

      // Expenses
      const incomingExpenses: CashflowItem[] = Array.isArray((data as any).current_expenses) ? (data as any).current_expenses : [];
      const currentExpenses: CashflowItem[] = form.current_expenses ?? [];
      opts.setExpenseSuggestions(buildListSuggestions<CashflowItem>(
        currentExpenses,
        incomingExpenses,
        (it) => normalizeDesc(it.description),
        (a, b) => cashflowEqual(a ?? undefined, b ?? undefined)
      ));

      // Investments
      const incomingInvestments: InvestmentHolding[] = Array.isArray((data as any).savings_or_investments) ? (data as any).savings_or_investments : [];
      const currentInvestments: InvestmentHolding[] = form.savings_or_investments ?? [];
      opts.setInvestmentSuggestions(buildListSuggestions<InvestmentHolding>(
        currentInvestments,
        incomingInvestments,
        (it) => normalizeDesc(it.description),
        (a, b) => investmentEqual(a ?? undefined, b ?? undefined)
      ));

      // Pensions
      const incomingPensions: PensionHolding[] = Array.isArray((data as any).pension_holdings) ? (data as any).pension_holdings : [];
      const currentPensions: PensionHolding[] = form.pension_holdings ?? [];
      opts.setPensionSuggestions(buildListSuggestions<PensionHolding>(
        currentPensions,
        incomingPensions,
        (it) => normalizeDesc(it.description),
        (a, b) => pensionEqual(a ?? undefined, b ?? undefined)
      ));

      // Debts
      const incomingDebts: DebtHolding[] = Array.isArray((data as any).debt_holdings) ? (data as any).debt_holdings : [];
      const currentDebts: DebtHolding[] = form.debt_holdings ?? [];
      opts.setDebtSuggestions(buildListSuggestions<DebtHolding>(
        currentDebts,
        incomingDebts,
        (it) => normalizeDesc(it.description),
        (a, b) => debtEqual(a ?? undefined, b ?? undefined)
      ));

      // Insurance
      const incomingInsurance: InsurancePolicy[] = Array.isArray((data as any).insurance_policies) ? (data as any).insurance_policies : [];
      const currentInsurance: InsurancePolicy[] = form.insurance_policies ?? [];
      opts.setInsuranceSuggestions(buildListSuggestions<InsurancePolicy>(
        currentInsurance,
        incomingInsurance,
        (it) => normalizeDesc(it.description),
        (a, b) => insuranceEqual(a ?? undefined, b ?? undefined)
      ));

      // Non-list field suggestions (skip null/undefined incoming)
      const nextFieldSuggestions: Partial<PersonSummary> = {};
      const incHealth = (data as any).health_status;
      if (incHealth !== undefined && incHealth !== null && incHealth !== (form.health_status ?? null)) {
        nextFieldSuggestions.health_status = incHealth as any;
      }
      const incSmoker = (data as any).smoker;
      if (typeof incSmoker === 'boolean' && incSmoker !== (form.smoker ?? false)) {
        nextFieldSuggestions.smoker = incSmoker as any;
      }
      const incMarital = (data as any).marital_status;
      if (incMarital !== undefined && incMarital !== null && incMarital !== (form.marital_status ?? null)) {
        nextFieldSuggestions.marital_status = incMarital as any;
      }
      const incAge = (data as any).target_retirement_age;
      if (typeof incAge === 'number' && incAge !== (form.target_retirement_age ?? null)) {
        nextFieldSuggestions.target_retirement_age = incAge as any;
      }
      const incIncome: CashflowItem | null = (data as any).target_retirement_income ?? null;
      if (incIncome !== null && !cashflowEqual(form.target_retirement_income ?? null, incIncome)) {
        nextFieldSuggestions.target_retirement_income = incIncome as any;
      }
      opts.setFieldSuggestions(nextFieldSuggestions);
    } catch (err: any) {
      if (!mounted.current) return;
      setExtractError(err.message || 'Extract failed');
      setTimeout(() => setExtractError(null), 4000);
    } finally {
      if (mounted.current) setExtracting(false);
    }
  }, [teamId, clientId, form, opts]);

  return { extracting, extractError, onExtract } as const;
}

export default useSummaryExtraction;
