"use client";
import { useShoppingList } from '@/components/shopping/ShoppingListContext';

export function useSectionShopping(sectionKey: string, title: string, sectionLabel: string) {
  const shopping = useShoppingList();
  const inShopping = shopping.existsSection(sectionKey);
  const add = () => shopping.addSection(sectionKey, title, sectionLabel);
  const remove = () => shopping.removeSection(sectionKey);
  const toggle = () => {
    if (inShopping) remove(); else add();
  };
  return { inShopping, add, remove, toggle } as const;
}
