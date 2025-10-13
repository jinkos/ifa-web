// Types for Summary domain
export type HealthStatus = 'good' | 'some_problems' | 'mostly_good' | 'serious_problems';
export type MaritalStatus =
  | 'single'
  | 'married'
  | 'civil_partnership'
  | 'divorced'
  | 'widowed'
  | 'separated'
  | 'cohabiting'
  | 'other';

export type SavingType =
  | 'isa'
  | 'savings_account'
  | 'premium_bonds'
  | 'current_account'
  | 'deposit_fixed_term'
  | 'general_investment_account'
  | 'other';

export type PensionTypes = 'defined_benefit' | 'workplace' | 'personal' | 'sipp' | 'ssas' | 'state' | 'other';

export type DebtType = 'mortgage' | 'credit_card' | 'personal_loan' | 'student_loan' | 'auto_loan' | 'other';

export type InsurancePolicyType = 'life' | 'critical_illness' | 'income_protection' | 'whole_of_life' | 'other';

export type FrequencyType = 'weekly' | 'monthly' | 'quarterly' | 'annually';

export type CashflowItem = {
  description?: string | null;
  inflow?: boolean | null;
  amount?: number | null;
  currency?: string | null;
  frequency?: FrequencyType | null;
  is_gross?: boolean | null;
};

export type ValueWithCurrency = {
  description?: string | null;
  amount?: number | null;
  currency?: string | null;
};

export type InvestmentHolding = {
  description?: string | null;
  type?: SavingType | null;
  value?: ValueWithCurrency | null;
  contribution?: CashflowItem | null;
  __localId?: string;
};

export type PensionHolding = {
  description?: string | null;
  type?: PensionTypes | null;
  value?: ValueWithCurrency | null;
  contribution?: CashflowItem | null;
  __localId?: string;
};

export type DebtHolding = {
  description?: string | null;
  type?: DebtType | null;
  balance?: ValueWithCurrency | null;
  repayment?: CashflowItem | null;
  __localId?: string;
};

export type InsurancePolicy = {
  description?: string | null;
  type?: InsurancePolicyType | null;
  coverage_amount?: ValueWithCurrency | null;
  premium?: CashflowItem | null;
  __localId?: string;
};

export type PersonSummary = {
  health_status?: HealthStatus | null;
  smoker?: boolean | null;
  marital_status?: MaritalStatus | null;
  target_retirement_age?: number | null;
  target_retirement_income?: CashflowItem | null;
  current_income: CashflowItem[];
  current_expenses: CashflowItem[];
  savings_or_investments: InvestmentHolding[];
  pension_holdings: PensionHolding[];
  debt_holdings: DebtHolding[];
  insurance_policies: InsurancePolicy[];
};
