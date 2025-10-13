"use client";
import React from 'react';
import type { CashflowItem } from '@/lib/types/summary';

type Props = {
  item?: CashflowItem | null;
};

export default function CashflowDetails({ item }: Props) {
  const it = item ?? {};
  return (
    <>
      <div>Amount: {it.amount ?? '-'} {it.currency ?? ''}</div>
      <div>Frequency: {it.frequency ?? '-'}</div>
      <div>{it.is_gross ? 'Gross' : 'Net'}</div>
    </>
  );
}
