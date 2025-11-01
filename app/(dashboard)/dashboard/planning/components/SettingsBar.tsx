"use client";
import React from 'react';
import { PercentInput } from '@/components/ui/number-input';

export interface SettingsBarProps {
  loading: boolean;
  yearsToRetirement: number | null;
  inflationPct: number;
  onInflationChange: (v: number) => void;
  incomeEquivalentPct: number;
  onIncomeEquivalentChange: (v: number) => void;
  onReset: () => void;
  missing: string[];
}

export function SettingsBar(props: SettingsBarProps) {
  const {
    loading,
    yearsToRetirement,
    inflationPct,
    onInflationChange,
    incomeEquivalentPct,
    onIncomeEquivalentChange,
    onReset,
    missing,
  } = props;

  if (loading) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  if (yearsToRetirement == null) {
    return <div className="text-red-700">No planning can be done without {missing.join(' and ')}.</div>;
  }

  return (
    <div className="flex flex-wrap items-end gap-8">
      {/* Years to retirement */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Years to retirement</div>
        <div className="text-3xl font-semibold text-blue-700">{yearsToRetirement}</div>
      </div>

      {/* Inflation rate */}
      <div className="flex flex-col gap-1">
        <label htmlFor="inflation-rate" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inflation rate</label>
        <PercentInput
          id="inflation-rate"
          className="w-36"
          value={Number.isFinite(inflationPct) ? inflationPct : 0}
          onValueChange={(v) => onInflationChange(Math.max(0, v ?? 0))}
          showSuffix
        />
      </div>

      {/* Sustainable investment withdrawal rate */}
      <div className="flex flex-col gap-1">
        <label htmlFor="income-equivalent" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sustainable investment withdrawal rate</label>
        <PercentInput
          id="income-equivalent"
          className="w-36"
          value={Number.isFinite(incomeEquivalentPct) ? incomeEquivalentPct : 0}
          onValueChange={(v) => onIncomeEquivalentChange(Math.max(0, v ?? 0))}
          showSuffix
        />
      </div>

      {/* Reset planning settings */}
      <div className="ml-auto">
        <button
          className="px-3 py-1.5 text-xs rounded-md border border-red-300 text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={onReset}
          title="Clear all planning inputs and assumptions for this client"
        >
          Reset settings
        </button>
      </div>
    </div>
  );
}

export default SettingsBar;
