"use client";
import React from 'react';
import { useShoppingList } from '@/components/shopping/ShoppingListContext';

export default function ShoppingListTab() {
  const shopping = useShoppingList();
  const items = shopping.list();

  const jumpToField = (fieldId: string) => {
    const el = document.getElementById(fieldId) || document.querySelector(`[data-field-id="${fieldId}"]`) as HTMLElement | null;
    if (!el) {
      alert('Field not found on page (maybe collapsed or removed).');
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = el.querySelector('input,select,textarea,button') as HTMLElement | null;
    focusable?.focus?.();
  };

  if (!items.length) return <div className="p-4 text-sm text-muted-foreground">No items in your shopping list yet.</div>;

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-end">
        <button className="text-sm text-red-600" onClick={() => shopping.clear()}>Clear all</button>
      </div>
      {items.map((it) => (
        <div key={it.id} className="border rounded p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{it.label}</div>
            <div className="text-sm text-muted-foreground">{it.section ?? ''}</div>
          </div>
          <div className="flex gap-2">
            <button className="px-2 py-1 rounded border" onClick={() => jumpToField(it.fieldId)}>Jump</button>
            <button className="px-2 py-1 rounded border" onClick={() => shopping.remove(it.id)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}
