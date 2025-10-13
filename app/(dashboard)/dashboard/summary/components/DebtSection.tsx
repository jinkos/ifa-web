import React from 'react';
import { Button } from '@/components/ui/button';
import InlineSuggestionCard from './InlineSuggestionCard';
import DebtHoldingForm from './DebtHoldingForm';
import HoldingsToolbar from './HoldingsToolbar';
import IncomingAdditionsPanel from './IncomingAdditionsPanel';
import type { ListSuggestions } from '@/lib/suggestions';
import type { DebtHolding, PersonSummary } from '@/lib/types/summary';

type Props = {
  form: PersonSummary;
  setForm: React.Dispatch<React.SetStateAction<PersonSummary>>;
  debtSuggestions: ListSuggestions<DebtHolding> | null;
  setDebtSuggestions: React.Dispatch<React.SetStateAction<ListSuggestions<DebtHolding> | null>>;
  showOnlySuggestions: boolean;
  normalizeDesc: (s?: string | null) => string;
  isEmptySuggestions: (s: { conflicts: Record<string, unknown>; additions: unknown[]; removals: Set<string> }) => boolean;
  onAdd: (e: any) => void;
  onAcceptAllConflicts: (e: any) => void;
  onAcceptAllAdditions: (e: any) => void;
  onAcceptAllRemovals: (e: any) => void;
  onClearSuggestions: (e: any) => void;
};

export default function DebtSection({
  form,
  setForm,
  debtSuggestions,
  setDebtSuggestions,
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
        label="Debts"
        suggestionSummary={debtSuggestions ? { conflictsCount: Object.keys(debtSuggestions.conflicts).length, additionsCount: debtSuggestions.additions.length, removalsCount: debtSuggestions.removals.size } : null}
        addButtonLabel="Add debt"
        onAdd={onAdd}
        onAcceptAllConflicts={onAcceptAllConflicts}
        onAcceptAllAdditions={onAcceptAllAdditions}
        onAcceptAllRemovals={onAcceptAllRemovals}
        onClearSuggestions={onClearSuggestions}
      />

      <div className="space-y-3">
        {(showOnlySuggestions && debtSuggestions
          ? form.debt_holdings.filter((it) => { const key = normalizeDesc(it.description); return !!debtSuggestions.conflicts[key] || debtSuggestions.removals.has(key); })
          : form.debt_holdings
        ).map((it, idx) => {
          const key = normalizeDesc(it.description);
          const reactKey = it.__localId ?? idx;
          const conflict = debtSuggestions && key ? debtSuggestions.conflicts[key] : undefined;
          const isRemoval = debtSuggestions && key ? debtSuggestions.removals.has(key) : false;
          return (
            <DebtHoldingForm
              key={reactKey}
              value={it}
              onChange={(v) => setForm((prev) => ({ ...prev, debt_holdings: prev.debt_holdings.map((x) => (x.__localId === it.__localId ? v : x)) }))}
              onRemove={() => setForm((prev) => ({ ...prev, debt_holdings: prev.debt_holdings.filter((x) => x.__localId !== it.__localId) }))}
              idBase={`debt-${reactKey}`}
            >
              {conflict && (
                <InlineSuggestionCard
                  type="conflict"
                  title={`Incoming change detected for "${it.description ?? '(no description)'}"`}
                  currentContent={<><div>Type: {it.type ?? '-'}</div><div>Balance: {it.balance?.amount ?? '-'} {it.balance?.currency ?? ''}</div><div>Repayment: {it.repayment?.amount ?? '-'} {it.repayment?.currency ?? ''} {it.repayment?.frequency ?? ''}</div></>}
                  incomingContent={<><div>Type: {conflict.type ?? '-'}</div><div>Balance: {conflict.balance?.amount ?? '-'} {conflict.balance?.currency ?? ''}</div><div>Repayment: {conflict.repayment?.amount ?? '-'} {conflict.repayment?.currency ?? ''} {conflict.repayment?.frequency ?? ''}</div></>}
                  onAccept={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, debt_holdings: prev.debt_holdings.map((x, i) => (i === idx ? { ...conflict, description: x.description ?? (conflict as any).description } : x)) })); setDebtSuggestions((prev) => { if (!prev) return prev; const nextConf = { ...prev.conflicts }; delete nextConf[key!]; const next = { ...prev, conflicts: nextConf }; return isEmptySuggestions(next) ? null : next; }); }}
                  onReject={(e) => { e.preventDefault(); setDebtSuggestions((prev) => { if (!prev) return prev; const nextConf = { ...prev.conflicts }; delete nextConf[key!]; const next = { ...prev, conflicts: nextConf }; return isEmptySuggestions(next) ? null : next; }); }}
                />
              )}
              {isRemoval && (
                <InlineSuggestionCard
                  type="removal"
                  onAccept={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, debt_holdings: prev.debt_holdings.filter((_, i) => i !== idx) })); setDebtSuggestions((prev) => { if (!prev) return prev; const nextRem = new Set(prev.removals); nextRem.delete(key!); const next = { ...prev, removals: nextRem }; return isEmptySuggestions(next) ? null : next; }); }}
                  onReject={(e) => { e.preventDefault(); setDebtSuggestions((prev) => { if (!prev) return prev; const nextRem = new Set(prev.removals); nextRem.delete(key!); const next = { ...prev, removals: nextRem }; return isEmptySuggestions(next) ? null : next; }); }}
                />
              )}
            </DebtHoldingForm>
          );
        })}
      </div>

      <IncomingAdditionsPanel
        additions={debtSuggestions ? debtSuggestions.additions : []}
        title="Incoming new debt items"
        renderItem={(inc: any) => (
          <>
            <div>Description: {inc.description ?? '(no description)'}</div>
            <div>Type: {inc.type ?? '-'}</div>
            <div>Balance: {inc.balance?.amount ?? '-'} {inc.balance?.currency ?? ''}</div>
          </>
        )}
        onAccept={(i) => { setForm((prev) => ({ ...prev, debt_holdings: [...prev.debt_holdings, (debtSuggestions as any).additions[i]] })); setDebtSuggestions((prev) => { if (!prev) return prev; const nextAdds = [...prev.additions]; nextAdds.splice(i, 1); const next = { ...prev, additions: nextAdds }; return isEmptySuggestions(next) ? null : next; }); }}
        onDismiss={(i) => { setDebtSuggestions((prev) => { if (!prev) return prev; const nextAdds = [...prev.additions]; nextAdds.splice(i, 1); const next = { ...prev, additions: nextAdds }; return isEmptySuggestions(next) ? null : next; }); }}
      />
    </div>
  );
}
