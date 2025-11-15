"use client";
import React from 'react';
import StatementsTab from '@/components/statements/StatementsTab';

export default function StatementsPage() {
  return (
    <section className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold mb-2">Statements</h1>
      <div className="mb-6 text-lg font-medium">View and manage client statements</div>
      <StatementsTab />
    </section>
  );
}
