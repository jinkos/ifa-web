"use client";
import React from 'react';
import CashflowListSection from './CashflowListSection';
import { ListSuggestions } from '@/lib/suggestions';
import type { CashflowItem, PersonSummary } from '@/lib/types/summary';

type Props = {
  form: PersonSummary;
  setForm: React.Dispatch<React.SetStateAction<PersonSummary>>;
  incomeSuggestions: ListSuggestions<CashflowItem> | null;
  setIncomeSuggestions: React.Dispatch<React.SetStateAction<ListSuggestions<CashflowItem> | null>>;
  expenseSuggestions: ListSuggestions<CashflowItem> | null;
  setExpenseSuggestions: React.Dispatch<React.SetStateAction<ListSuggestions<CashflowItem> | null>>;
  showOnlySuggestions: boolean;
  normalizeDesc: (s?: string | null) => string;
};

export default function FinancialsSection({
  form,
  setForm,
  incomeSuggestions,
  setIncomeSuggestions,
  expenseSuggestions,
  setExpenseSuggestions,
  showOnlySuggestions,
  normalizeDesc,
}: Props) {
  return (
    <>
      {/* Income */}
      <CashflowListSection
        title="Current Income"
        items={form.current_income}
        onChangeItems={(next) => setForm({ ...form, current_income: next })}
        suggestions={incomeSuggestions}
        onUpdateSuggestions={(next) => setIncomeSuggestions(next)}
        showOnlySuggestions={showOnlySuggestions}
        idBase="income"
        addButtonLabel="Add income"
        normalizeDesc={normalizeDesc}
      />

      {/* Expenses */}
      <CashflowListSection
        title="Current Expenses"
        items={form.current_expenses}
        onChangeItems={(next) => setForm({ ...form, current_expenses: next })}
        suggestions={expenseSuggestions}
        onUpdateSuggestions={(next) => setExpenseSuggestions(next)}
        showOnlySuggestions={showOnlySuggestions}
        idBase="expense"
        addButtonLabel="Add expense"
        normalizeDesc={normalizeDesc}
      />
    </>
  );
}
