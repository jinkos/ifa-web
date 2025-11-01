"use client";
import React from 'react';

export interface TotalsCardProps {
  totals: { currentSum: number; futureSum: number; todaySum: number; incomeSum: number } | null;
  targetIncomeAnnual: number;
}

export function TotalsCard({ totals, targetIncomeAnnual }: TotalsCardProps) {
  if (!totals) return null;
  return (
    <div className="rounded-md border p-3 bg-white dark:bg-neutral-950">
      <div className="flex flex-wrap items-end justify-between gap-6 text-sm">
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Current</div>
          <div className={`tabular-nums font-semibold ${totals.currentSum < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{totals.currentSum.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Future</div>
          <div className={`tabular-nums font-semibold ${totals.futureSum < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{totals.futureSum.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Today</div>
          <div className={`tabular-nums font-semibold ${totals.todaySum < 0 ? 'text-red-700' : 'text-emerald-700'}`}>{totals.todaySum.toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Income</div>
          <div className={`tabular-nums text-lg font-bold ${(totals.incomeSum < 0 || (targetIncomeAnnual > 0 && totals.incomeSum < targetIncomeAnnual)) ? 'text-red-700' : 'text-blue-700'}`}>{totals.incomeSum.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

export default TotalsCard;
