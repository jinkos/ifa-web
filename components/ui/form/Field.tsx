"use client";
import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import LabelValue from './LabelValue';
import { Button } from '@/components/ui/button';
import { useShoppingList } from '@/components/shopping/ShoppingListContext';

type Incoming = {
  // allow any incoming value (string/number/object) and stringify for display
  value: unknown;
  onAccept?: () => void;
  onReject?: () => void;
};

export default function Field({
  id,
  label,
  fieldName,
  showShoppingAction = false,
  children,
  incoming,
  hint,
  error,
  className = '',
}: {
  id?: string;
  label?: React.ReactNode;
  fieldName?: string;
  showShoppingAction?: boolean;
  children: React.ReactNode;
  incoming?: Incoming | null;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
}) {
  const reactId = useId();
  // Prefer an explicit id. If not provided, derive a stable id from fieldName or label text
  // so shopping list membership persists across navigations. Fall back to React useId.
  const makeSlug = (s: string) =>
    s
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .slice(0, 64);

  const stableBase = fieldName ?? (typeof label === 'string' ? label : undefined);
  const fieldId = id ?? (stableBase ? `f-${makeSlug(stableBase)}` : `f-${reactId}`);
  const shopping = useShoppingList();
  const alreadyAdded = shopping.exists(fieldId);

  // If the child is a single React element and doesn't have an id prop, clone it with the generated id.
  let renderedChildren: React.ReactNode = children;
  if (React.isValidElement(children)) {
    const childHasId = (children.props as any)?.id;
    if (!childHasId) {
      // cast to any to avoid strict prop typing issues when injecting id
      renderedChildren = React.cloneElement(children as any, { id: fieldId } as any);
    }
  }

  return (
    <div data-field-id={fieldId} className={cn('', className)}>
      {label ? (
        <LabelValue label={<Label htmlFor={fieldId}>{label}{showShoppingAction && (
          <button
            type="button"
            aria-pressed={alreadyAdded}
            className={"ml-2 text-xs transition " + (alreadyAdded ? 'text-amber-700' : 'text-slate-500 hover:text-slate-700')}
            onClick={(e) => {
              e.preventDefault();
              if (alreadyAdded) {
                const item = shopping.list().find((s) => s.fieldId === fieldId);
                if (item) shopping.remove(item.id);
                return;
              }
              shopping.add({ fieldId, label: fieldName ?? (typeof label === 'string' ? label : String(fieldName ?? 'Field')), section: undefined, path: undefined, meta: {} });
            }}
            title={alreadyAdded ? 'Remove from shopping list' : 'Add to shopping list'}
          >
            {alreadyAdded ? '−' : '＋'}
          </button>
        )}</Label>}>
          {renderedChildren}
        </LabelValue>
      ) : (
        renderedChildren
      )}
      {incoming && (
        <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-amber-700">Incoming: {String(incoming.value ?? '(empty)')}</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={(e) => { e.preventDefault(); incoming.onAccept?.(); }}>Accept</Button>
              <Button size="sm" variant="outline" onClick={(e) => { e.preventDefault(); incoming.onReject?.(); }}>Reject</Button>
            </div>
          </div>
        </div>
      )}
      {error && <div className="mt-1 text-sm text-destructive">{error}</div>}
      {hint && <div className="mt-1 text-sm text-muted-foreground">{hint}</div>}
    </div>
  );
}
