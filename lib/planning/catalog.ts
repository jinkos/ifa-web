import type { BalanceSheetItemKind } from '@/lib/types/balance';

export const investmentKinds: BalanceSheetItemKind[] = [
  'current_account',
  'gia',
  'isa',
  'premium_bond',
  'savings_account',
  'uni_fees_savings_plan',
  'vct',
  'workplace_pension',
  'personal_pension',
];

export const incomeOnlyPensionKinds: BalanceSheetItemKind[] = [
  'state_pension',
  'defined_benefit_pension',
];

export const loanKinds: BalanceSheetItemKind[] = [
  'credit_card',
  'personal_loan',
  'student_loan',
];

export const propertyKinds: BalanceSheetItemKind[] = [
  'main_residence',
  'holiday_home',
  'buy_to_let',
  'other_valuable_item',
];

export const DEFAULTS = {
  annual_growth_rate: 0.04,
  contribution_growth_rate: 0.03,
};
