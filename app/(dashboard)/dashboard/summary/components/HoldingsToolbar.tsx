"use client";
import React from 'react';
import { Button } from '@/components/ui/button';

type SuggestionSummary = {
  conflictsCount?: number;
  additionsCount?: number;
  removalsCount?: number;
};

type Props = {
  label?: string;
  suggestionSummary?: SuggestionSummary | null;
  addButtonLabel?: string;
  onAdd: (e: React.MouseEvent) => void;
  onAcceptAllConflicts?: (e: React.MouseEvent) => void;
  onAcceptAllAdditions?: (e: React.MouseEvent) => void;
  onAcceptAllRemovals?: (e: React.MouseEvent) => void;
  onClearSuggestions?: (e: React.MouseEvent) => void;
};

export default function HoldingsToolbar({
  label,
  suggestionSummary,
  addButtonLabel = 'Add',
  onAdd,
  onAcceptAllConflicts,
  onAcceptAllAdditions,
  onAcceptAllRemovals,
  onClearSuggestions,
}: Props) {
  const conflicts = suggestionSummary?.conflictsCount ?? 0;
  const additions = suggestionSummary?.additionsCount ?? 0;
  const removals = suggestionSummary?.removalsCount ?? 0;
  const hasAny = conflicts + additions + removals > 0;

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {hasAny && (
          <div className="text-sm text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-1">
            {conflicts} conflicts, {additions} additions, {removals} removals
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasAny && (
          <>
            <Button size="sm" variant="outline" onClick={onAcceptAllConflicts} aria-label={`Accept all conflicts for ${label}`}>
              Accept All Conflicts ({conflicts})
            </Button>
            <Button size="sm" variant="outline" onClick={onAcceptAllAdditions} aria-label={`Accept all additions for ${label}`}>
              Accept All Additions ({additions})
            </Button>
            <Button size="sm" variant="outline" onClick={onAcceptAllRemovals} aria-label={`Accept all removals for ${label}`}>
              Accept All Removals ({removals})
            </Button>
            <Button size="sm" variant="ghost" onClick={onClearSuggestions} aria-label={`Clear suggestions for ${label}`}>
              Clear Suggestions
            </Button>
          </>
        )}
        <Button size="sm" onClick={onAdd}>{addButtonLabel}</Button>
      </div>
    </div>
  );
}
