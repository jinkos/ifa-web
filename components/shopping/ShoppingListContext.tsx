"use client";
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { useTeam } from '@/app/(dashboard)/dashboard/TeamContext';
import { useSelectedClient } from '@/app/(dashboard)/dashboard/SelectedClientContext';

type ShoppingItem = {
  id: string;
  fieldId: string;
  label: string;
  section?: string;
  path?: string;
  createdAt: string;
  meta?: Record<string, any>;
};

type State = ShoppingItem[];

type Action =
  | { type: 'init'; items: ShoppingItem[] }
  | { type: 'add'; item: Omit<ShoppingItem, 'id' | 'createdAt'> }
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
    case 'add': {
      const newItem: ShoppingItem = { id: makeId(), createdAt: new Date().toISOString(), ...action.item } as ShoppingItem;
      return [...state, newItem];
    }
    case 'remove':
      return state.filter((i) => i.id !== action.id);
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

  useEffect(() => {
    try {
      const raw = globalThis.localStorage?.getItem(storageKey);
      if (raw) dispatch({ type: 'init', items: JSON.parse(raw) });
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
    add: (payload: Omit<ShoppingItem, 'id' | 'createdAt'>) => dispatch({ type: 'add', item: payload }),
    remove: (id: string) => dispatch({ type: 'remove', id }),
    clear: () => dispatch({ type: 'clear' }),
    exists: (fieldId: string) => state.some((s) => s.fieldId === fieldId),
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
      add: () => undefined,
      remove: () => undefined,
      clear: () => undefined,
      exists: () => false,
    } as {
      list: () => ShoppingItem[];
      add: (p: Omit<ShoppingItem, 'id' | 'createdAt'>) => void;
      remove: (id: string) => void;
      clear: () => void;
      exists: (fieldId: string) => boolean;
    };
  }
  return ctx as {
    list: () => ShoppingItem[];
    add: (p: Omit<ShoppingItem, 'id' | 'createdAt'>) => void;
    remove: (id: string) => void;
    clear: () => void;
    exists: (fieldId: string) => boolean;
  };
}
