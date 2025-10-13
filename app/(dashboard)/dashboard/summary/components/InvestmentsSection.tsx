"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import InlineSuggestionCard from './InlineSuggestionCard';
import InvestmentHoldingForm from './InvestmentHoldingForm';
import HoldingsToolbar from './HoldingsToolbar';
import type { InvestmentHolding, PersonSummary } from '@/lib/types/summary';
import type { ListSuggestions } from '@/lib/suggestions';
import IncomingAdditionsPanel from './IncomingAdditionsPanel';

export default function InvestmentsSection({
  form,
  setForm,
  investmentSuggestions,
  setInvestmentSuggestions,
  showOnlySuggestions,
  normalizeDesc,
  onAdd,
  onAcceptAllConflicts,
  onAcceptAllAdditions,
  onAcceptAllRemovals,
  onClearSuggestions,
}: {
  form: PersonSummary;
  setForm: React.Dispatch<React.SetStateAction<PersonSummary>>;
  investmentSuggestions: ListSuggestions<InvestmentHolding> | null;
  setInvestmentSuggestions: React.Dispatch<React.SetStateAction<ListSuggestions<InvestmentHolding> | null>>;
  showOnlySuggestions: boolean;
  normalizeDesc: (s?: string | null) => string;
  onAdd: (e: any) => void;
  onAcceptAllConflicts: (e: any) => void;
  onAcceptAllAdditions: (e: any) => void;
  onAcceptAllRemovals: (e: any) => void;
  onClearSuggestions: (e: any) => void;
}) {
  return (
    <div className="mb-6">
      <HoldingsToolbar
        label="Investments"
        suggestionSummary={investmentSuggestions ? { conflictsCount: Object.keys(investmentSuggestions.conflicts).length, additionsCount: investmentSuggestions.additions.length, removalsCount: investmentSuggestions.removals.size } : null}
        addButtonLabel="Add investment"
        onAdd={onAdd}
        onAcceptAllConflicts={onAcceptAllConflicts}
        onAcceptAllAdditions={onAcceptAllAdditions}
        onAcceptAllRemovals={onAcceptAllRemovals}
        onClearSuggestions={onClearSuggestions}
      />
      <div className="space-y-3">
        {(showOnlySuggestions && investmentSuggestions
          ? form.savings_or_investments.filter((it) => { const key = normalizeDesc(it.description); return !!investmentSuggestions.conflicts[key] || investmentSuggestions.removals.has(key); })
          : form.savings_or_investments
        ).map((it, idx) => {
          const key = normalizeDesc(it.description);
          const reactKey = it.__localId ?? idx;
          const conflict = investmentSuggestions && key ? investmentSuggestions.conflicts[key] : undefined;
          const isRemoval = investmentSuggestions && key ? investmentSuggestions.removals.has(key) : false;
          return (
            <InvestmentHoldingForm
              key={reactKey}
              value={it}
              onChange={(v) => setForm((prev) => ({ ...prev, savings_or_investments: prev.savings_or_investments.map((x) => (x.__localId === it.__localId ? v : x)) }))}
              onRemove={() => setForm((prev) => ({ ...prev, savings_or_investments: prev.savings_or_investments.filter((x) => x.__localId !== it.__localId) }))}
              idBase={`investment-${reactKey}`}
            >
              {conflict && (
                <InlineSuggestionCard
                  type="conflict"
                  title={`Incoming change detected for "${it.description ?? '(no description)'}"`}
                  currentContent={<><div>Type: {it.type ?? '-'}</div><div>Value: {it.value?.amount ?? '-'} {it.value?.currency ?? ''}</div><div>Contribution: {it.contribution?.amount ?? '-'} {it.contribution?.currency ?? ''} {it.contribution?.frequency ?? ''}</div></>}
                  incomingContent={<><div>Type: {conflict.type ?? '-'}</div><div>Value: {conflict.value?.amount ?? '-'} {conflict.value?.currency ?? ''}</div><div>Contribution: {conflict.contribution?.amount ?? '-'} {conflict.contribution?.currency ?? ''} {conflict.contribution?.frequency ?? ''}</div></>}
                  onAccept={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, savings_or_investments: prev.savings_or_investments.map((x, i) => (i === idx ? { ...conflict, description: x.description ?? conflict.description } : x)) })); setInvestmentSuggestions((prev) => { if (!prev) return prev; const nextConf = { ...prev.conflicts }; delete nextConf[key!]; const next = { ...prev, conflicts: nextConf }; return Object.keys(next.conflicts).length === 0 && next.additions.length === 0 && next.removals.size === 0 ? null : next; }); }}
                  onReject={(e) => { e.preventDefault(); setInvestmentSuggestions((prev) => { if (!prev) return prev; const nextConf = { ...prev.conflicts }; delete nextConf[key!]; const next = { ...prev, conflicts: nextConf }; return Object.keys(next.conflicts).length === 0 && next.additions.length === 0 && next.removals.size === 0 ? null : next; }); }}
                />
              )}
              {isRemoval && (
                <InlineSuggestionCard
                  type="removal"
                  onAccept={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, savings_or_investments: prev.savings_or_investments.filter((_, i) => i !== idx) })); setInvestmentSuggestions((prev) => { if (!prev) return prev; const nextRem = new Set(prev.removals); nextRem.delete(key!); const next = { ...prev, removals: nextRem }; return Object.keys(next.conflicts).length === 0 && next.additions.length === 0 && next.removals.size === 0 ? null : next; }); }}
                  onReject={(e) => { e.preventDefault(); setInvestmentSuggestions((prev) => { if (!prev) return prev; const nextRem = new Set(prev.removals); nextRem.delete(key!); const next = { ...prev, removals: nextRem }; return Object.keys(next.conflicts).length === 0 && next.additions.length === 0 && next.removals.size === 0 ? null : next; }); }}
                />
              )}
            </InvestmentHoldingForm>
          );
        })}
      </div>
      <IncomingAdditionsPanel
        additions={investmentSuggestions ? investmentSuggestions.additions : []}
        title="Incoming new investment items"
        renderItem={(inc: any) => (
          <>
            <div>Description: {inc.description ?? '(no description)'}</div>
            <div>Type: {inc.type ?? '-'}</div>
            <div>Value: {inc.value?.amount ?? '-'} {inc.value?.currency ?? ''}</div>
          </>
        )}
        onAccept={(i) => { setForm((prev) => ({ ...prev, savings_or_investments: [...prev.savings_or_investments, (investmentSuggestions as any).additions[i]] })); setInvestmentSuggestions((prev) => { if (!prev) return prev; const nextAdds = [...prev.additions]; nextAdds.splice(i, 1); const next = { ...prev, additions: nextAdds }; return Object.keys(next.conflicts).length === 0 && next.additions.length === 0 && next.removals.size === 0 ? null : next; }); }}
        onDismiss={(i) => { setInvestmentSuggestions((prev) => { if (!prev) return prev; const nextAdds = [...prev.additions]; nextAdds.splice(i, 1); const next = { ...prev, additions: nextAdds }; return Object.keys(next.conflicts).length === 0 && next.additions.length === 0 && next.removals.size === 0 ? null : next; }); }}
      />
    </div>
  );
}
