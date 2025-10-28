"use client";
import React from 'react';
import ShoppingListTab from '@/components/shopping/ShoppingListTab';

export default function ShoppingPage() {
  return (
    <section className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold mb-2">Shopping list</h1>
      <div className="mb-6 text-lg font-medium">Your selected fields</div>
      <ShoppingListTab />
    </section>
  );
}
