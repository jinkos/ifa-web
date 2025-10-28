import {
  BalanceEmploymentStatus,
  BalanceFrequency,
  BalanceSheetItemKind,
  BalanceSheetGroup,
  BalanceSheetGroupKey,
  NetGrossIndicator,
} from '../types/balance';

export const balanceEmploymentOptions: BalanceEmploymentStatus[] = [
  'employed',
  'self_employed',
  'retired',
  'full_time_education',
  'independent_means',
  'homemaker',
  'other',
];

export const balanceFrequencyOptions: BalanceFrequency[] = [
  'weekly',
  'monthly',
  'quarterly',
  'six_monthly',
  'annually',
  'unknown',
];

export const netGrossOptions: NetGrossIndicator[] = ['net', 'gross', 'unknown'];

export const balanceSheetItemKinds: BalanceSheetItemKind[] = [
  'salary_income',
  'side_hustle_income',
  'self_employment_income',
  'expenses',
  'buy_to_let',
  'current_account',
  'gia',
  'isa',
  'premium_bond',
  'savings_account',
  'uni_fees_savings_plan',
  'vct',
  'credit_card',
  'personal_loan',
  'student_loan',
  'main_residence',
  'holiday_home',
  'car',
  'workplace_pension',
  'defined_benefit_pension',
  'personal_pension',
  'state_pension',
];

export const balanceSheetIncomeKinds: BalanceSheetItemKind[] = [
  'salary_income',
  'side_hustle_income',
  'self_employment_income',
  'expenses',
];

export const balanceSheetAssetKinds: BalanceSheetItemKind[] = [
  'buy_to_let',
  'current_account',
  'gia',
  'isa',
  'premium_bond',
  'savings_account',
  'uni_fees_savings_plan',
  'vct',
  'main_residence',
  'holiday_home',
  'car',
];

export const balanceSheetLiabilityKinds: BalanceSheetItemKind[] = [
  'credit_card',
  'personal_loan',
  'student_loan',
];

export const balanceSheetPensionKinds: BalanceSheetItemKind[] = [
  'workplace_pension',
  'defined_benefit_pension',
  'personal_pension',
  'state_pension',
];

export const balanceSheetGroups: BalanceSheetGroup[] = [
  {
    key: 'income',
    label: 'Income streams',
    kinds: balanceSheetIncomeKinds,
    description: 'Recurring earnings such as salary, self-employment, and side hustles.',
  },
  {
    key: 'assets',
    label: 'Assets',
    kinds: balanceSheetAssetKinds,
    description: 'Accounts and properties that contribute to net worth.',
  },
  {
    key: 'liabilities',
    label: 'Liabilities',
    kinds: balanceSheetLiabilityKinds,
    description: 'Debt obligations that should be monitored and repaid.',
  },
  {
    key: 'pensions',
    label: 'Pensions',
    kinds: balanceSheetPensionKinds,
    description: 'Retirement schemes and pension plans.',
  },
  {
    key: 'other',
    label: 'Other items',
    kinds: [],
    description: 'Items that do not fit the known balance sheet categories.',
  },
];

export const balanceSheetGroupLabels = balanceSheetGroups.reduce<Record<BalanceSheetGroupKey, string>>((acc, group) => {
  acc[group.key] = group.label;
  return acc;
}, {
  income: 'Income streams',
  assets: 'Assets',
  liabilities: 'Liabilities',
  pensions: 'Pensions',
  other: 'Other items',
});

export const balanceSheetGroupByKind = balanceSheetGroups.reduce<Record<BalanceSheetItemKind, BalanceSheetGroupKey>>((acc, group) => {
  for (const kind of group.kinds) {
    acc[kind] = group.key;
  }
  return acc;
}, {} as Record<BalanceSheetItemKind, BalanceSheetGroupKey>);

export const balanceSheetLabels: Record<BalanceSheetItemKind, string> = {
  salary_income: 'Salary income',
  side_hustle_income: 'Side hustle income',
  self_employment_income: 'Self-employment income',
  buy_to_let: 'Buy to let property',
  current_account: 'Current account',
  gia: 'General investment account (GIA)',
  isa: 'ISA',
  premium_bond: 'Premium bond',
  savings_account: 'Savings account',
  uni_fees_savings_plan: 'University fees savings plan',
  vct: 'Venture capital trust',
  credit_card: 'Credit card',
  personal_loan: 'Personal loan',
  student_loan: 'Student loan',
  main_residence: 'Main residence',
  holiday_home: 'Holiday home',
  car: 'Car',
  workplace_pension: 'Workplace pension',
  defined_benefit_pension: 'Defined benefit pension',
  personal_pension: 'Personal pension',
  state_pension: 'State pension',
  expenses: 'Expenses',
};

// Field label customization per item type
// This allows different labels for the same underlying data structure
export const balanceSheetFieldLabels: Record<
  BalanceSheetItemKind,
  {
    income?: string;
    contribution?: string;
    pension?: string;
    investmentValue?: string;
    propertyValue?: string;
    balance?: string;
    repayment?: string;
    value?: string;
    loan?: string;
    employerContribution?: string;
    expenditure?: string;
  }
> = {
  // INCOME ITEMS
  salary_income: { income: 'Income' },
  side_hustle_income: { income: 'Profit' },
  self_employment_income: { income: 'Drawings' },
  
  // BUY TO LET
  buy_to_let: { 
    income: 'Rental income',
    propertyValue: 'Property value',
    loan: 'Mortgage',
    balance: 'Mortgage balance',
    repayment: 'Mortgage repayment',
  },
  
  // INVESTMENT ITEMS
  current_account: { 
    income: 'Interest income',
    investmentValue: 'Balance',
  },
  gia: { 
    contribution: 'Contribution',
    income: 'Income',
    investmentValue: 'Investment value',
  },
  isa: { 
    contribution: 'Contribution',
    income: 'Income',
    investmentValue: 'Investment value',
  },
  premium_bond: { 
    contribution: 'Contribution',
    income: 'Income',
    investmentValue: 'Investment value',
  },
  savings_account: { 
    contribution: 'Contribution',
    income: 'Interest income',
    investmentValue: 'Balance',
  },
  uni_fees_savings_plan: { 
    contribution: 'Contribution',
    income: 'Income',
    investmentValue: 'Investment value',
  },
  vct: { 
    contribution: 'Contribution',
    income: 'Dividend income',
    investmentValue: 'Investment value',
  },
  
  // LOAN ITEMS
  credit_card: { 
    balance: 'Balance',
    repayment: 'Repayment',
  },
  personal_loan: { 
    balance: 'Balance',
    repayment: 'Repayment',
  },
  student_loan: { 
    balance: 'Balance',
    repayment: 'Repayment',
  },
  
  // PROPERTY ITEMS
  main_residence: { 
    value: 'Property value',
    loan: 'Mortgage',
    balance: 'Mortgage balance',
    repayment: 'Mortgage repayment',
  },
  holiday_home: { 
    value: 'Property value',
    loan: 'Mortgage',
    balance: 'Mortgage balance',
    repayment: 'Mortgage repayment',
  },
  car: { 
    value: 'Vehicle value',
    loan: 'Loan',
    balance: 'Loan balance',
    repayment: 'Loan repayment',
  },
  
  // PENSION ITEMS
  workplace_pension: { 
    contribution: 'Personal contribution',
    income: 'Income',
    investmentValue: 'Pension value',
    employerContribution: 'Employer contribution',
  },
  defined_benefit_pension: { 
    contribution: 'Personal contribution',
    income: 'Income',
    investmentValue: 'Pension value',
    employerContribution: 'Employer contribution',
  },
  personal_pension: { 
    contribution: 'Personal contribution',
    income: 'Income',
    investmentValue: 'Pension value',
    employerContribution: 'Employer contribution',
  },
  state_pension: {
    // For state pension we only show a pension cash flow in UI
    pension: 'State pension',
  },
  expenses: {
    expenditure: 'Expenditure',
  },
};
