import type { BalanceSheetItemKind } from '@/lib/types/balance';

// Centralized rules for what counts toward IHT estate net worth
export const IHT_ASSET_KINDS: BalanceSheetItemKind[] = [
  'current_account', 'deposit_account', 'gia', 'isa',
  'premium_bond', 'savings_account', 'uni_fees_savings_plan', 'vct',
  'eis', 'IHT_scheme', 'life_insurance', 'whole_of_life_policy',
  'main_residence', 'holiday_home', 'other_valuable_item', 'collectable', 'buy_to_let',
  'workplace_pension', 'personal_pension', 'sipp',
];

export function isIhtAsset(kind: BalanceSheetItemKind): boolean {
  return IHT_ASSET_KINDS.includes(kind);
}

// Standardized value extraction order for IHT
export function getIhtItemValue(it: any): number {
  const val = (it?.ite?.investment_value ?? it?.ite?.value ?? it?.ite?.property_value ?? 0);
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}
