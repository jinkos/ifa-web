import React from 'react';
import { Button } from '@/components/ui/button';
import InlineSuggestionCard from './InlineSuggestionCard';
import InsurancePolicyForm from './InsurancePolicyForm';
import HoldingsToolbar from './HoldingsToolbar';
import IncomingAdditionsPanel from './IncomingAdditionsPanel';
import type { ListSuggestions } from '@/lib/suggestions';
import type { InsurancePolicy, PersonSummary } from '@/lib/types/summary';

type Props = {
  form: PersonSummary;
  setForm: React.Dispatch<React.SetStateAction<PersonSummary>>;
  insuranceSuggestions: ListSuggestions<InsurancePolicy> | null;
  setInsuranceSuggestions: React.Dispatch<React.SetStateAction<ListSuggestions<InsurancePolicy> | null>>;
  showOnlySuggestions: boolean;
  normalizeDesc: (s?: string | null) => string;
  isEmptySuggestions: (s: { conflicts: Record<string, unknown>; additions: unknown[]; removals: Set<string> }) => boolean;
  onAdd: (e: any) => void;
  onAcceptAllConflicts: (e: any) => void;
  onAcceptAllAdditions: (e: any) => void;
  onAcceptAllRemovals: (e: any) => void;
  onClearSuggestions: (e: any) => void;
};

export default function InsuranceSection({
  form,
  setForm,
  insuranceSuggestions,
  setInsuranceSuggestions,
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
    <div className="mb-2">
      <HoldingsToolbar
        label="Insurance"
        suggestionSummary={insuranceSuggestions ? { conflictsCount: Object.keys(insuranceSuggestions.conflicts).length, additionsCount: insuranceSuggestions.additions.length, removalsCount: insuranceSuggestions.removals.size } : null}
        addButtonLabel="Add policy"
        onAdd={onAdd}
        onAcceptAllConflicts={onAcceptAllConflicts}
        onAcceptAllAdditions={onAcceptAllAdditions}
        onAcceptAllRemovals={onAcceptAllRemovals}
        onClearSuggestions={onClearSuggestions}
      />

      <div className="space-y-3">
        {(showOnlySuggestions && insuranceSuggestions
          ? form.insurance_policies.filter((it) => { const key = normalizeDesc(it.description); return !!insuranceSuggestions.conflicts[key] || insuranceSuggestions.removals.has(key); })
          : form.insurance_policies
        ).map((it, idx) => {
          const key = normalizeDesc(it.description);
          const reactKey = it.__localId ?? idx;
          const conflict = insuranceSuggestions && key ? insuranceSuggestions.conflicts[key] : undefined;
          const isRemoval = insuranceSuggestions && key ? insuranceSuggestions.removals.has(key) : false;
          return (
            <InsurancePolicyForm
              key={reactKey}
              value={it}
              onChange={(v) => setForm((prev) => ({ ...prev, insurance_policies: prev.insurance_policies.map((x) => (x.__localId === it.__localId ? v : x)) }))}
              onRemove={() => setForm((prev) => ({ ...prev, insurance_policies: prev.insurance_policies.filter((x) => x.__localId !== it.__localId) }))}
              idBase={`insurance-${reactKey}`}
            >
              {conflict && (
                <InlineSuggestionCard
                  type="conflict"
                  title={`Incoming change detected for "${it.description ?? '(no description)'}"`}
                  currentContent={<><div>Type: {it.type ?? '-'}</div><div>Coverage: {it.coverage_amount?.amount ?? '-'} {it.coverage_amount?.currency ?? ''}</div><div>Premium: {it.premium?.amount ?? '-'} {it.premium?.currency ?? ''} {it.premium?.frequency ?? ''}</div></>}
                  incomingContent={<><div>Type: {conflict.type ?? '-'}</div><div>Coverage: {conflict.coverage_amount?.amount ?? '-'} {conflict.coverage_amount?.currency ?? ''}</div><div>Premium: {conflict.premium?.amount ?? '-'} {conflict.premium?.currency ?? ''} {conflict.premium?.frequency ?? ''}</div></>}
                  onAccept={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, insurance_policies: prev.insurance_policies.map((x, i) => (i === idx ? { ...conflict, description: x.description ?? (conflict as any).description } : x)) })); setInsuranceSuggestions((prev) => { if (!prev) return prev; const nextConf = { ...prev.conflicts }; delete nextConf[key!]; const next = { ...prev, conflicts: nextConf }; return isEmptySuggestions(next) ? null : next; }); }}
                  onReject={(e) => { e.preventDefault(); setInsuranceSuggestions((prev) => { if (!prev) return prev; const nextConf = { ...prev.conflicts }; delete nextConf[key!]; const next = { ...prev, conflicts: nextConf }; return isEmptySuggestions(next) ? null : next; }); }}
                />
              )}
              {isRemoval && (
                <InlineSuggestionCard
                  type="removal"
                  onAccept={(e) => { e.preventDefault(); setForm((prev) => ({ ...prev, insurance_policies: prev.insurance_policies.filter((_, i) => i !== idx) })); setInsuranceSuggestions((prev) => { if (!prev) return prev; const nextRem = new Set(prev.removals); nextRem.delete(key!); const next = { ...prev, removals: nextRem }; return isEmptySuggestions(next) ? null : next; }); }}
                  onReject={(e) => { e.preventDefault(); setInsuranceSuggestions((prev) => { if (!prev) return prev; const nextRem = new Set(prev.removals); nextRem.delete(key!); const next = { ...prev, removals: nextRem }; return isEmptySuggestions(next) ? null : next; }); }}
                />
              )}
            </InsurancePolicyForm>
          );
        })}
      </div>

      <IncomingAdditionsPanel
        additions={insuranceSuggestions ? insuranceSuggestions.additions : []}
        title="Incoming new insurance policies"
        renderItem={(inc: any) => (
          <>
            <div>Description: {inc.description ?? '(no description)'}</div>
            <div>Type: {inc.type ?? '-'}</div>
            <div>Coverage: {inc.coverage_amount?.amount ?? '-'} {inc.coverage_amount?.currency ?? ''}</div>
          </>
        )}
        onAccept={(i) => { setForm((prev) => ({ ...prev, insurance_policies: [...prev.insurance_policies, (insuranceSuggestions as any).additions[i]] })); setInsuranceSuggestions((prev) => { if (!prev) return prev; const nextAdds = [...prev.additions]; nextAdds.splice(i, 1); const next = { ...prev, additions: nextAdds }; return isEmptySuggestions(next) ? null : next; }); }}
        onDismiss={(i) => { setInsuranceSuggestions((prev) => { if (!prev) return prev; const nextAdds = [...prev.additions]; nextAdds.splice(i, 1); const next = { ...prev, additions: nextAdds }; return isEmptySuggestions(next) ? null : next; }); }}
      />
    </div>
  );
}
