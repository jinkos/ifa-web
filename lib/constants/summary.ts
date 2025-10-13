import { DebtType, FrequencyType, HealthStatus, InsurancePolicyType, MaritalStatus, PensionTypes, SavingType } from '../types/summary';

export const healthOptions: HealthStatus[] = ['good', 'some_problems', 'mostly_good', 'serious_problems'];

export const maritalOptions: MaritalStatus[] = [
  'single',
  'married',
  'civil_partnership',
  'divorced',
  'widowed',
  'separated',
  'cohabiting',
  'other',
];

export const savingTypeOptions: SavingType[] = [
  'isa',
  'savings_account',
  'premium_bonds',
  'current_account',
  'deposit_fixed_term',
  'general_investment_account',
  'other',
];

export const pensionTypeOptions: PensionTypes[] = ['defined_benefit', 'workplace', 'personal', 'sipp', 'ssas', 'state', 'other'];

export const debtTypeOptions: DebtType[] = ['mortgage', 'credit_card', 'personal_loan', 'student_loan', 'auto_loan', 'other'];

export const insuranceTypeOptions: InsurancePolicyType[] = ['life', 'critical_illness', 'income_protection', 'whole_of_life', 'other'];

export const frequencyOptions: FrequencyType[] = ['weekly', 'monthly', 'quarterly', 'annually'];
