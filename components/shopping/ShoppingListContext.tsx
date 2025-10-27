"use client";
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { useTeam } from '@/app/(dashboard)/dashboard/TeamContext';
import { useSelectedClient } from '@/app/(dashboard)/dashboard/SelectedClientContext';

type ShoppingItem = {
  id: string;
  // Section-based shopping only (legacy field-based entries removed)
  sectionKey: string;
  label: string;
  // optional human-friendly section name
  section?: string;
  createdAt: string;
  meta?: Record<string, any>;
};

type State = ShoppingItem[];

type Action =
  | { type: 'init'; items: ShoppingItem[] }
  | { type: 'addSection'; item: { sectionKey: string; label: string; section?: string; meta?: Record<string, any> } }
  | { type: 'removeBySection'; sectionKey: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

const ShoppingCtx = createContext<any>(null);

function makeId() {
  try {
    // prefer crypto.randomUUID when available
    return (globalThis.crypto as any)?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2, 9);
  } catch {
    return String(Date.now()) + Math.random().toString(36).slice(2, 9);
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'init':
      return action.items;
    case 'addSection': {
      const newItem: ShoppingItem = { id: makeId(), createdAt: new Date().toISOString(), ...action.item } as ShoppingItem;
      // avoid duplicates by sectionKey
      const exists = state.some((s) => s.sectionKey === action.item.sectionKey);
      if (exists) return state;
      return [...state, newItem];
    }
    case 'remove':
      return state.filter((i) => i.id !== action.id);
    case 'removeBySection':
      return state.filter((i) => i.sectionKey !== action.sectionKey);
    case 'clear':
      return [];
    default:
      return state;
  }
}

export function ShoppingListProvider({ children }: { children: React.ReactNode }) {
  const { team } = useTeam();
  const { selectedClient } = useSelectedClient();
  const storageKey = useMemo(() => `shoppingList:${team?.id ?? 'anon'}:${selectedClient?.client_id ?? 'anon'}`, [team?.id, selectedClient?.client_id]);

  const [state, dispatch] = useReducer(reducer, [] as State);

  // One-time purge of legacy/local stale shopping keys in localStorage
  useEffect(() => {
    try {
      const ls = globalThis.localStorage;
      if (!ls) return;
      const keysToDelete: string[] = [];
      for (let i = 0; i < ls.length; i++) {
        const key = ls.key(i);
        if (!key) continue;
        // Remove any old prefix used historically
        if (key.startsWith('shopping:')) {
          keysToDelete.push(key);
          continue;
        }
        if (!key.startsWith('shoppingList:')) continue;
        const raw = ls.getItem(key);
        if (!raw) { keysToDelete.push(key); continue; }
        try {
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) { keysToDelete.push(key); continue; }
          const hasSection = parsed.some((x: any) => typeof x?.sectionKey === 'string');
          const hasLegacy = parsed.some((x: any) => (x && (typeof x.fieldId === 'string' || 'path' in x)));
          // Purge keys that are clearly legacy-only or malformed
          if (!hasSection || hasLegacy) {
            keysToDelete.push(key);
          }
        } catch {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((k) => {
        try { ls.removeItem(k); } catch {}
      });
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const raw = globalThis.localStorage?.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as any[];
        // Only keep well-formed section items; drop legacy field-level entries
        const items: ShoppingItem[] = parsed
          .filter((it) => typeof it?.sectionKey === 'string' && typeof it?.label === 'string')
          .map((it) => ({
            id: typeof it.id === 'string' ? it.id : makeId(),
            createdAt: typeof it.createdAt === 'string' ? it.createdAt : new Date().toISOString(),
            sectionKey: it.sectionKey,
            label: it.label,
            section: typeof it.section === 'string' ? it.section : undefined,
            meta: typeof it.meta === 'object' && it.meta ? it.meta : {},
          }));
        dispatch({ type: 'init', items });
      }
    } catch (e) {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }, [state, storageKey]);

  const api = useMemo(() => ({
    list: () => state,
    remove: (id: string) => dispatch({ type: 'remove', id }),
    clear: () => dispatch({ type: 'clear' }),
    // New section APIs
    addSection: (sectionKey: string, label: string, section?: string, meta?: Record<string, any>) => dispatch({ type: 'addSection', item: { sectionKey, label, section, meta } }),
    removeSection: (sectionKey: string) => dispatch({ type: 'removeBySection', sectionKey }),
    existsSection: (sectionKey: string) => state.some((s) => s.sectionKey === sectionKey),
  }), [state]);

  return <ShoppingCtx.Provider value={api}>{children}</ShoppingCtx.Provider>;
}

export function useShoppingList() {
  const ctx = useContext(ShoppingCtx);
  if (!ctx) {
    // When used outside of provider (for example during server prerender), return a safe no-op API.
    // This prevents runtime errors while allowing components to render server-side.
    return {
      list: () => [] as ShoppingItem[],
      remove: () => undefined,
      clear: () => undefined,
      addSection: () => undefined,
      removeSection: () => undefined,
      existsSection: () => false,
    } as {
      list: () => ShoppingItem[];
      remove: (id: string) => void;
      clear: () => void;
      addSection: (sectionKey: string, label: string, section?: string, meta?: Record<string, any>) => void;
      removeSection: (sectionKey: string) => void;
      existsSection: (sectionKey: string) => boolean;
    };
  }
  return ctx as {
    list: () => ShoppingItem[];
    remove: (id: string) => void;
    clear: () => void;
    addSection: (sectionKey: string, label: string, section?: string, meta?: Record<string, any>) => void;
    removeSection: (sectionKey: string) => void;
    existsSection: (sectionKey: string) => boolean;
  };
}
