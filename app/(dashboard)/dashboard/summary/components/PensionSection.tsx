import React from 'react';
import { Button } from '@/components/ui/button';
import InlineSuggestionCard from './InlineSuggestionCard';
import PensionHoldingForm from './PensionHoldingForm';
import HoldingsToolbar from './HoldingsToolbar';
import IncomingAdditionsPanel from './IncomingAdditionsPanel';
import type { ListSuggestions } from '@/lib/suggestions';
import type { PensionHolding, PersonSummary } from '@/lib/types/summary';

type Props = {
  form: PersonSummary;
  setForm: React.Dispatch<React.SetStateAction<PersonSummary>>;
  pensionSuggestions: ListSuggestions<PensionHolding> | null;
  setPensionSuggestions: React.Dispatch<React.SetStateAction<ListSuggestions<PensionHolding> | null>>;
  showOnlySuggestions: boolean;
  normalizeDesc: (s?: string | null) => string;
  isEmptySuggestions: (s: { conflicts: Record<string, unknown>; additions: unknown[]; removals: Set<string> }) => boolean;
  onAdd: (e: any) => void;
  onAcceptAllConflicts: (e: any) => void;
  onAcceptAllAdditions: (e: any) => void;
  onAcceptAllRemovals: (e: any) => void;
  onClearSuggestions: (e: any) => void;
};

export default function PensionSection({
  form,
  setForm,
  pensionSuggestions,
  setPensionSuggestions,
  showOnlySuggestions,
  normalizeDesc,
  isEmptySuggestions,
  onAdd,
  onAcceptAllConflicts,
  onAcceptAllAdditions,
  onAcceptAllRemovals,
  onClearSuggestions,
}: Props) {
  return (
    <div className="mb-6">
      <HoldingsToolbar
        label="Pensions"
        suggestionSummary={pensionSuggestions ? { conflictsCount: Object.keys(pensionSuggestions.conflicts).length, additionsCount: pensionSuggestions.additions.length, removalsCount: pensionSuggestions.removals.size } : null}
        addButtonLabel="Add pension"
        onAdd={onAdd}
        onAcceptAllConflicts={onAcceptAllConflicts}
        onAcceptAllAdditions={onAcceptAllAdditions}
        onAcceptAllRemovals={onAcceptAllRemovals}
        onClearSuggestions={onClearSuggestions}
      />

      <div className="space-y-3">
        {(showOnlySuggestions && pensionSuggestions
          ? form.pension_holdings.filter((it) => { const key = normalizeDesc(it.description); return !!pensionSuggestions.conflicts[key] || pensionSuggestions.removals.has(key); })
          : form.pension_holdings
        ).map((it, idx) => {
          const key = normalizeDesc(it.description);
          const reactKey = it.__localId ?? idx;
          const conflict = pensionSuggestions && key ? pensionSuggestions.conflicts[key] : undefined;
          const isRemoval = pensionSuggestions && key ? pensionSuggestions.removals.has(key) : false;
          return (
            <PensionHoldingForm
              key={reactKey}
              value={it}
              onChange={(v) => setForm((prev) => ({ ...prev, pension_holdings: prev.pension_holdings.map((x) => (x.__localId === it.__localId ? v : x)) }))}
              onRemove={() => setForm((prev) => ({ ...prev, pension_holdings: prev.pension_holdings.filter((x) => x.__localId !== it.__localId) }))}
              idBase={`pension-${reactKey}`}
            >
              {conflict && (
                <InlineSuggestionCard
                  type="conflict"
                  title={`Incoming change detected for "${it.description ?? '(no description)'}"`}
                  currentContent={<><div>Type: {it.type ?? '-'}</div><div>Value: {it.value?.amount ?? '-'} {it.value?.currency ?? ''}</div><div>Contribution: {it.contribution?.amount ?? '-'} {it.contribution?.currency ?? ''} {it.contribution?.frequency ?? ''}</div></>}
                  incomingContent={<><div>Type: {conflict.type ?? '-'}</div><div>Value: {conflict.value?.amount ?? '-'} {conflict.value?.currency ?? ''}</div><div>Contribution: {conflict.contribution?.amount ?? '-'} {conflict.contribution?.currency ?? ''} {conflict.contribution?.frequency ?? ''}</div></>}
                  onAccept={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, pension_holdings: prev.pension_holdings.map((x, i) => (i === idx ? { ...conflict, description: x.description ?? (conflict as any).description } : x)) })); setPensionSuggestions((prev) => { if (!prev) return prev; const nextConf = { ...prev.conflicts }; delete nextConf[key!]; const next = { ...prev, conflicts: nextConf }; return isEmptySuggestions(next) ? null : next; }); }}
                  onReject={(e) => { e.preventDefault(); setPensionSuggestions((prev) => { if (!prev) return prev; const nextConf = { ...prev.conflicts }; delete nextConf[key!]; const next = { ...prev, conflicts: nextConf }; return isEmptySuggestions(next) ? null : next; }); }}
                />
              )}
              {isRemoval && (
                <InlineSuggestionCard
                  type="removal"
                  onAccept={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, pension_holdings: prev.pension_holdings.filter((_, i) => i !== idx) })); setPensionSuggestions((prev) => { if (!prev) return prev; const nextRem = new Set(prev.removals); nextRem.delete(key!); const next = { ...prev, removals: nextRem }; return isEmptySuggestions(next) ? null : next; }); }}
                  onReject={(e) => { e.preventDefault(); setPensionSuggestions((prev) => { if (!prev) return prev; const nextRem = new Set(prev.removals); nextRem.delete(key!); const next = { ...prev, removals: nextRem }; return isEmptySuggestions(next) ? null : next; }); }}
                />
              )}
            </PensionHoldingForm>
          );
        })}
      </div>

      <IncomingAdditionsPanel
        additions={pensionSuggestions ? pensionSuggestions.additions : []}
        title="Incoming new pension items"
        renderItem={(inc: any) => (
          <>
            <div>Description: {inc.description ?? '(no description)'}</div>
            <div>Type: {inc.type ?? '-'}</div>
            <div>Value: {inc.value?.amount ?? '-'} {inc.value?.currency ?? ''}</div>
          </>
        )}
        onAccept={(i) => { setForm((prev) => ({ ...prev, pension_holdings: [...prev.pension_holdings, (pensionSuggestions as any).additions[i]] })); setPensionSuggestions((prev) => { if (!prev) return prev; const nextAdds = [...prev.additions]; nextAdds.splice(i, 1); const next = { ...prev, additions: nextAdds }; return isEmptySuggestions(next) ? null : next; }); }}
        onDismiss={(i) => { setPensionSuggestions((prev) => { if (!prev) return prev; const nextAdds = [...prev.additions]; nextAdds.splice(i, 1); const next = { ...prev, additions: nextAdds }; return isEmptySuggestions(next) ? null : next; }); }}
      />
    </div>
  );
}
