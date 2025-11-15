// Types aligning with the new Personal Balance Sheet API (PBS)
// New schema uses composition: BSItem with type + ite (Income|BuyToLet|Investment|Loan|Property|Pension)

export type BalanceEmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'retired'
  | 'full_time_education'
  | 'independent_means'
  | 'homemaker'
  | 'other';

export type BalanceFrequency =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'six_monthly'
  | 'annually'
  | 'unknown';

export type NetGrossIndicator = 'net' | 'gross' | 'unknown';

export type CurrencyCode = string;

// Core data structures (stored as integers - no decimals)
export interface CashFlow {
  periodic_amount: number | null;
  frequency: BalanceFrequency;
  net_gross: NetGrossIndicator;
}

// Shared constants and formatters for UI and validation reuse
export const BALANCE_FREQUENCIES: readonly BalanceFrequency[] = [
  'weekly',
  'monthly',
  'quarterly',
  'six_monthly',
  'annually',
  'unknown',
] as const;

export const NET_GROSS_VALUES: readonly NetGrossIndicator[] = [
  'net',
  'gross',
  'unknown',
] as const;

// Employment statuses used in Identity and Balance contexts
export const BALANCE_EMPLOYMENT_STATUSES: readonly BalanceEmploymentStatus[] = [
  'employed',
  'self_employed',
  'retired',
  'full_time_education',
  'independent_means',
  'homemaker',
  'other',
] as const;

export function formatFrequency(f: BalanceFrequency): string {
  switch (f) {
    case 'six_monthly':
      return 'Six monthly';
    default:
      return f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function formatNetGross(ng: NetGrossIndicator): string {
  return ng.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatEmploymentStatus(s: BalanceEmploymentStatus): string {
  switch (s) {
    case 'self_employed':
      return 'Self-employed';
    case 'full_time_education':
      return 'Full-time education';
    case 'independent_means':
      return 'Independent means';
    default:
      return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export interface Debt {
  balance?: number | null;
  repayment?: CashFlow | null;
}

// The 5 core data structures
export interface IncomeData {
  income: CashFlow;
}

export interface BuyToLetData {
  rental_income: CashFlow;
  property_value?: number | null;
  loan?: Debt | null;
}

export interface InvestmentData {
  contribution?: CashFlow | null;
  income?: CashFlow | null;
  investment_value?: number | null;
}

export interface LoanData {
  balance?: number | null;
  repayment?: CashFlow | null;
}

export interface PropertyData {
  value?: number | null;
  loan?: Debt | null;
}

// Pensions are split into Non-State and State pensions
// Non-state pensions behave like investments with possible employer contributions
export interface NonStatePensionData extends InvestmentData {
  employer_contribution?: CashFlow | null;
}

// State pensions have neither a pot value nor employer contributions; instead they model a pension cash flow
export interface StatePensionData {
  pension: CashFlow;
}

// Expenses model (regular expenditure)
export interface ExpensesData {
  expenditure: CashFlow;
}

export type BalanceSheetItemKind =
  | 'salary_income'
  | 'side_hustle_income'
  | 'self_employment_income'
  | 'expenses'
  | 'buy_to_let'
  | 'current_account'
  | 'gia'
  | 'isa'
  | 'premium_bond'
  | 'savings_account'
  | 'uni_fees_savings_plan'
  | 'vct'
  | 'credit_card'
  | 'personal_loan'
  | 'student_loan'
  | 'main_residence'
  | 'holiday_home'
  | 'other_valuable_item'
  | 'workplace_pension'
  | 'defined_benefit_pension'
  | 'personal_pension'
  | 'state_pension';

type BalanceSheetBase<K extends BalanceSheetItemKind> = {
  type: K;
  // Currency is a string (server defaults to 'GBP' when omitted). Avoid nulls to match Pydantic.
  currency?: CurrencyCode;
  id?: number | string;
  __localId?: string;
  // Description is required by Pydantic BalanceSheetModel.BSItem
  description: string;
};

// INCOME ITEMS (use IncomeData)
export type SalaryIncomeItem = BalanceSheetBase<'salary_income'> & {
  ite: IncomeData;
};

export type SideHustleIncomeItem = BalanceSheetBase<'side_hustle_income'> & {
  ite: IncomeData;
};

export type SelfEmploymentIncomeItem = BalanceSheetBase<'self_employment_income'> & {
  ite: IncomeData;
};

// BUY TO LET (special structure)
export type BuyToLetItem = BalanceSheetBase<'buy_to_let'> & {
  ite: BuyToLetData;
};

// INVESTMENT ITEMS (use InvestmentData)
export type CurrentAccountItem = BalanceSheetBase<'current_account'> & {
  ite: InvestmentData;
};

export type GeneralInvestmentAccountItem = BalanceSheetBase<'gia'> & {
  ite: InvestmentData;
};

export type IsaItem = BalanceSheetBase<'isa'> & {
  ite: InvestmentData;
};

export type PremiumBondItem = BalanceSheetBase<'premium_bond'> & {
  ite: InvestmentData;
};

export type SavingAccountItem = BalanceSheetBase<'savings_account'> & {
  ite: InvestmentData;
};

export type UniFeesSavingsPlanItem = BalanceSheetBase<'uni_fees_savings_plan'> & {
  ite: InvestmentData;
};

export type VentureCapitalTrustItem = BalanceSheetBase<'vct'> & {
  ite: InvestmentData;
};

// LOAN ITEMS (use LoanData)
export type CreditCardItem = BalanceSheetBase<'credit_card'> & {
  ite: LoanData;
};

export type PersonalLoanItem = BalanceSheetBase<'personal_loan'> & {
  ite: LoanData;
};

export type StudentLoanItem = BalanceSheetBase<'student_loan'> & {
  ite: LoanData;
};

// PROPERTY ITEMS (use PropertyData)
export type MainResidenceItem = BalanceSheetBase<'main_residence'> & {
  ite: PropertyData;
};

export type HolidayHomeItem = BalanceSheetBase<'holiday_home'> & {
  ite: PropertyData;
};

export type OtherValuableItem = BalanceSheetBase<'other_valuable_item'> & {
  ite: PropertyData;
};

// PENSION ITEMS
// Non-state pension variants
export type WorkplacePensionItem = BalanceSheetBase<'workplace_pension'> & {
  ite: NonStatePensionData;
};

export type DefinedBenefitPensionItem = BalanceSheetBase<'defined_benefit_pension'> & {
  ite: NonStatePensionData;
};

export type PersonalPensionItem = BalanceSheetBase<'personal_pension'> & {
  ite: NonStatePensionData;
};

// State pension
export type StatePensionItem = BalanceSheetBase<'state_pension'> & {
  ite: StatePensionData;
};

// EXPENSES
export type ExpensesItem = BalanceSheetBase<'expenses'> & {
  ite: ExpensesData;
};

export type PersonalBalanceSheetItem =
  | SalaryIncomeItem
  | SideHustleIncomeItem
  | SelfEmploymentIncomeItem
  | BuyToLetItem
  | CurrentAccountItem
  | GeneralInvestmentAccountItem
  | IsaItem
  | PremiumBondItem
  | SavingAccountItem
  | UniFeesSavingsPlanItem
  | VentureCapitalTrustItem
  | CreditCardItem
  | PersonalLoanItem
  | StudentLoanItem
  | MainResidenceItem
  | HolidayHomeItem
  | OtherValuableItem
  | WorkplacePensionItem
  | DefinedBenefitPensionItem
  | PersonalPensionItem
  | StatePensionItem
  | ExpensesItem;

/**
 * Legacy v1 balance shape used by the Balance Sheet editor while the API still carries
 * employment/retirement fields. Prefer using ItemsOnlyBalance for new code.
 */
/**
 * Deprecated legacy shape retained for compatibility with old imports.
 * In v2, balance only contains items; person/retirement fields live in IdentityModel.
 * Use ItemsOnlyBalance instead.
 */
// Removed legacy v1 BalancePersonSummary in favor of items-only balance model

/**
 * v2 items-only balance shape. No person/retirement fields; just the list of items.
 */
export interface ItemsOnlyBalance {
  balance_sheet: PersonalBalanceSheetItem[];
}

// For clarity, this mirrors the server-side Pydantic BalanceSheetModel
export type BalanceSheetModel = ItemsOnlyBalance;

export type BalanceSheetIncomeItem =
  | SalaryIncomeItem
  | SideHustleIncomeItem
  | SelfEmploymentIncomeItem;

export type BalanceSheetAssetItem =
  | BuyToLetItem
  | CurrentAccountItem
  | GeneralInvestmentAccountItem
  | IsaItem
  | PremiumBondItem
  | SavingAccountItem
  | UniFeesSavingsPlanItem
  | VentureCapitalTrustItem
  | MainResidenceItem
  | HolidayHomeItem
  | OtherValuableItem;

export type BalanceSheetLiabilityItem =
  | CreditCardItem
  | PersonalLoanItem
  | StudentLoanItem;

export type BalanceSheetPensionItem =
  | WorkplacePensionItem
  | DefinedBenefitPensionItem
  | PersonalPensionItem
  | StatePensionItem;

export type BalanceSheetGroupKey = 'income' | 'assets' | 'liabilities' | 'pensions' | 'other';

export interface BalanceSheetGroup {
  key: BalanceSheetGroupKey;
  label: string;
  kinds: BalanceSheetItemKind[];
  description?: string;
}

// Helper: normalize arbitrary items into a transport-safe BalanceSheetModel
export function toBalanceSheetModel(input: any): BalanceSheetModel {
  // Strict items-only contract: require an object with a balance_sheet array
  const arr: any[] = Array.isArray(input?.balance_sheet) ? input.balance_sheet : [];
  const toTitle = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const items: PersonalBalanceSheetItem[] = arr.map((raw: any) => {
    const t = String(raw?.type ?? 'current_account');
    const type = t as BalanceSheetItemKind;
    const description = typeof raw?.description === 'string' && raw.description.trim().length > 0
      ? raw.description
      : toTitle(type);
    const currency = typeof raw?.currency === 'string' && raw.currency.trim().length > 0 ? raw.currency : undefined;
    const ite = (raw?.ite && typeof raw.ite === 'object') ? raw.ite : {};
    const base: any = { type, description };
    if (currency) base.currency = currency; // omit to allow server default 'GBP'
    return { ...base, ite } as PersonalBalanceSheetItem;
  });
  return { balance_sheet: items };
}
