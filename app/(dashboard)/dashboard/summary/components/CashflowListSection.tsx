"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import CashflowItemForm from './CashflowItemForm';
import InlineSuggestionCard from './InlineSuggestionCard';
import CashflowDetails from './CashflowDetails';
import type { CashflowItem } from '@/lib/types/summary';
import type { ListSuggestions } from '@/lib/suggestions';

type Props = {
  title: string;
  items: CashflowItem[];
  onChangeItems: (next: CashflowItem[]) => void;
  suggestions: ListSuggestions<CashflowItem> | null;
  onUpdateSuggestions: (next: ListSuggestions<CashflowItem> | null) => void;
  showOnlySuggestions?: boolean;
  idBase: string;
  addButtonLabel: string;
  normalizeDesc: (s?: string | null) => string;
};

// Helper to check if suggestions are empty
const isEmptySuggestions = (s: ListSuggestions<CashflowItem>) =>
  Object.keys(s.conflicts).length === 0 && s.additions.length === 0 && s.removals.size === 0;

export default function CashflowListSection({
  title,
  items,
  onChangeItems,
  suggestions,
  onUpdateSuggestions,
  showOnlySuggestions,
  idBase,
  addButtonLabel,
  normalizeDesc,
}: Props) {
  const hasSuggestions = !!suggestions && (Object.keys(suggestions.conflicts).length + suggestions.additions.length + suggestions.removals.size > 0);

  const filteredItems = showOnlySuggestions && suggestions
    ? items.filter((it) => {
        const key = normalizeDesc(it.description);
        return !!suggestions.conflicts[key] || suggestions.removals.has(key);
      })
    : items;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>
        {hasSuggestions && (
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-1 mr-2">
            {Object.keys(suggestions!.conflicts).length} conflicts, {suggestions!.additions.length} additions, {suggestions!.removals.size} removals
          </div>
        )}
        <Button size="sm" onClick={(e) => { e.preventDefault(); onChangeItems([...items, {}]); }}>
          {addButtonLabel}
        </Button>
      </div>

      {hasSuggestions && (
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              const conflicts = suggestions!.conflicts;
              onChangeItems(items.map((it) => {
                const key = normalizeDesc(it.description);
                const inc = conflicts[key];
                return inc ? { ...inc, description: it.description ?? inc.description } : it;
              }));
              const next = { ...suggestions!, conflicts: {} } as ListSuggestions<CashflowItem>;
              onUpdateSuggestions(isEmptySuggestions(next) ? null : next);
            }}
          >
            Accept All Conflicts ({Object.keys(suggestions!.conflicts).length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              onChangeItems([...items, ...suggestions!.additions]);
              const next = { ...suggestions!, additions: [] } as ListSuggestions<CashflowItem>;
              onUpdateSuggestions(isEmptySuggestions(next) ? null : next);
            }}
          >
            Accept All Additions ({suggestions!.additions.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              const removeKeys = suggestions!.removals;
              onChangeItems(items.filter((it) => !removeKeys.has(normalizeDesc(it.description))));
              const next = { ...suggestions!, removals: new Set<string>() } as ListSuggestions<CashflowItem>;
              onUpdateSuggestions(isEmptySuggestions(next) ? null : next);
            }}
          >
            Accept All Removals ({suggestions!.removals.size})
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); onUpdateSuggestions(null); }}>Clear Suggestions</Button>
        </div>
      )}

      <div className="space-y-3">
        {filteredItems.map((it, idx) => (
          <div key={idx} className="border rounded-md p-3">
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.preventDefault(); onChangeItems(items.filter((_, i) => i !== idx)); }}
              >
                Remove
              </Button>
            </div>
            <CashflowItemForm
              value={it}
              onChange={(v) => onChangeItems(items.map((x, i) => (i === idx ? (v ?? {}) : x)))}
              id={`${idBase}-${idx}-is_gross`}
            />
            {suggestions && (() => {
              const key = normalizeDesc(it.description);
              const conflict = key && suggestions.conflicts[key];
              const isRemoval = key && suggestions.removals.has(key);
              return (
                <>
                  {conflict && (
                    <InlineSuggestionCard
                      type="conflict"
                      title={`Incoming change detected for "${it.description ?? '(no description)'}"`}
                      currentContent={<CashflowDetails item={it} />}
                      incomingContent={<CashflowDetails item={conflict} />}
                      onAccept={(e) => {
                        e.preventDefault();
                        onChangeItems(items.map((x, i) => (i === idx ? { ...conflict, description: x.description ?? conflict.description } : x)));
                        const nextConflicts = { ...suggestions.conflicts };
                        delete nextConflicts[key!];
                        const next = { ...suggestions, conflicts: nextConflicts } as ListSuggestions<CashflowItem>;
                        onUpdateSuggestions(isEmptySuggestions(next) ? null : next);
                      }}
                      onReject={(e) => {
                        e.preventDefault();
                        const nextConflicts = { ...suggestions.conflicts };
                        delete nextConflicts[key!];
                        const next = { ...suggestions, conflicts: nextConflicts } as ListSuggestions<CashflowItem>;
                        onUpdateSuggestions(isEmptySuggestions(next) ? null : next);
                      }}
                    />
                  )}
                  {isRemoval && (
                    <InlineSuggestionCard
                      type="removal"
                      onAccept={(e) => {
                        e.preventDefault();
                        onChangeItems(items.filter((_, i) => i !== idx));
                        const nextRemovals = new Set(suggestions.removals);
                        nextRemovals.delete(key!);
                        const next = { ...suggestions, removals: nextRemovals } as ListSuggestions<CashflowItem>;
                        onUpdateSuggestions(isEmptySuggestions(next) ? null : next);
                      }}
                      onReject={(e) => {
                        e.preventDefault();
                        const nextRemovals = new Set(suggestions.removals);
                        nextRemovals.delete(key!);
                        const next = { ...suggestions, removals: nextRemovals } as ListSuggestions<CashflowItem>;
                        onUpdateSuggestions(isEmptySuggestions(next) ? null : next);
                      }}
                    />
                  )}
                </>
              );
            })()}
          </div>
        ))}
      </div>

      {suggestions && suggestions.additions.length > 0 && (
        <div className="mt-4">
          <div className="font-semibold mb-2">Incoming new {title.toLowerCase()} items</div>
          <div className="space-y-2">
            {suggestions.additions.map((inc, i) => (
              <div key={i} className="rounded-md border border-green-300 bg-green-50 p-3 text-sm suggestion-card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>Description: {inc.description ?? '(no description)'}</div>
                  <div>Amount: {inc.amount ?? '-'} {inc.currency ?? ''}</div>
                  <div>Frequency: {inc.frequency ?? '-'}</div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      onChangeItems([...items, inc]);
                      const nextAdds = [...suggestions.additions];
                      nextAdds.splice(i, 1);
                      const next = { ...suggestions, additions: nextAdds } as ListSuggestions<CashflowItem>;
                      onUpdateSuggestions(isEmptySuggestions(next) ? null : next);
                    }}
                  >
                    Accept Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      const nextAdds = [...suggestions.additions];
                      nextAdds.splice(i, 1);
                      const next = { ...suggestions, additions: nextAdds } as ListSuggestions<CashflowItem>;
                      onUpdateSuggestions(isEmptySuggestions(next) ? null : next);
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
