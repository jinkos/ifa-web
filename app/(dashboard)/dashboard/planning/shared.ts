import type { BalanceSheetItemKind } from '@/lib/types/balance';

// Shared helpers for Planning tabs
export const getItemBg = (t: BalanceSheetItemKind): string => {
  switch (t) {
    case 'salary_income':
    case 'side_hustle_income':
    case 'self_employment_income':
    case 'expenses':
      return 'bg-emerald-100 border-emerald-300'; // Income
    case 'buy_to_let':
      return 'bg-orange-100 border-orange-300'; // Buy-to-let
    case 'current_account':
    case 'deposit_account':
    case 'gia':
    case 'isa':
    case 'premium_bond':
    case 'savings_account':
    case 'uni_fees_savings_plan':
    case 'vct':
    case 'eis':
    case 'IHT_scheme':
      return 'bg-sky-100 border-sky-300'; // Investments
    case 'life_insurance':
    case 'whole_of_life_policy':
      return 'bg-cyan-100 border-cyan-300'; // Insurance products
    case 'credit_card':
    case 'personal_loan':
    case 'student_loan':
      return 'bg-rose-100 border-rose-300'; // Loans
    case 'main_residence':
    case 'holiday_home':
    case 'other_valuable_item':
      return 'bg-amber-100 border-amber-300'; // Properties
    case 'collectable':
      return 'bg-lime-100 border-lime-300';
    case 'workplace_pension':
    case 'defined_benefit_pension':
    case 'personal_pension':
    case 'sipp':
      return 'bg-violet-100 border-violet-300'; // Pensions
    case 'state_pension':
    case 'annuity_pension':
      return 'bg-indigo-100 border-indigo-300'; // Pension income streams
    default:
      return 'bg-muted/30';
  }
};

export const getItemKey = (it: any, idx: number): string => String(it?.id ?? it?.__localId ?? `idx:${idx}`);
