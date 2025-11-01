import type { ItemsOnlyBalance, PersonalBalanceSheetItem, BalanceSheetItemKind } from '@/lib/types/balance';
import type { ForwardValueAssumptions } from './calculator';

export type ProjectionCategory = 'asset' | 'property' | 'loan' | 'income';

export type ProjectionAsset = {
  category: 'asset';
  id?: number | string;
  type: BalanceSheetItemKind;
  description: string | null;
  current: number;
  future: number;
  futureToday: number;
  asIncome: number;
  key: string;
  hasContribution: boolean;
};

export type ProjectionProperty = {
  category: 'property';
  id?: number | string;
  type: BalanceSheetItemKind;
  description: string | null;
  current: number;
  future: number;
  futureToday: number;
  asIncome: number;
  key: string;
  mode: 'rent' | 'sell' | 'none';
  rentToday: number;
  asIncomeSell: number;
};

export type ProjectionLoan = {
  category: 'loan';
  id?: number | string;
  type: BalanceSheetItemKind;
  description: string | null;
  current: number;
  future: number;
  futureToday: number;
  asIncome: number; // negative contribution to income
  key: string;
};

export type ProjectionIncome = {
  category: 'income';
  id?: number | string;
  type: BalanceSheetItemKind;
  description: string | null;
  income: number; // in today's terms
  key: string;
};

export type ProjectionRow = ProjectionAsset | ProjectionProperty | ProjectionLoan | ProjectionIncome;

export interface Totals {
  currentSum: number;
  futureSum: number;
  todaySum: number;
  incomeSum: number;
}

export type ItemAssumptions = Record<string, Partial<ForwardValueAssumptions>>;
export type IncomeHighlightMap = Record<string, boolean>;
export type PropertyModeMap = Record<string, 'rent' | 'sell' | 'none'>;

export interface EngineInputs {
  pbs: ItemsOnlyBalance | null;
  yearsToRetirement: number | null;
  inflationPct: number;
  incomeEquivalentPct: number;
  itemAssumptions: ItemAssumptions;
  incomeHighlight: IncomeHighlightMap;
  propertyMode: PropertyModeMap;
}

// ForwardValueAssumptions is now sourced from calculator.ts
