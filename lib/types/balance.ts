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
  | 'car'
  | 'workplace_pension'
  | 'defined_benefit_pension'
  | 'personal_pension'
  | 'state_pension';

type BalanceSheetBase<K extends BalanceSheetItemKind> = {
  type: K;
  currency?: CurrencyCode | null;
  id?: string;
  __localId?: string;
  description?: string | null;
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

export type CarItem = BalanceSheetBase<'car'> & {
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
  | CarItem
  | WorkplacePensionItem
  | DefinedBenefitPensionItem
  | PersonalPensionItem
  | StatePensionItem
  | ExpensesItem;

export interface BalancePersonSummary {
  target_retirement_age?: number | null;
  target_retirement_income?: CashFlow | null;
  employment_status?: BalanceEmploymentStatus | null;
  occupation?: string | null;

  balance_sheet: PersonalBalanceSheetItem[];
}

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
  | CarItem;

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
