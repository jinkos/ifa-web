"use client";
import React from "react";
import SettingsBar from "./SettingsBar";

interface Props {
  selectedClientPresent: boolean;
  teamPresent: boolean;
  loading: boolean;
  yearsToRetirement: number | null;
  inflationPct: number;
  onInflationChange: (v: number) => void;
  incomeEquivalentPct: number;
  onIncomeEquivalentChange: (v: number) => void;
  onReset: () => void;
  missing: string[];
}

export default function PensionSummary(props: Props) {
  const { selectedClientPresent, teamPresent, loading, yearsToRetirement, inflationPct, onInflationChange, incomeEquivalentPct, onIncomeEquivalentChange, onReset, missing } = props;
  return (
    <div className="mb-6">
      {selectedClientPresent && teamPresent ? (
        <div className="border rounded-md p-4 bg-white dark:bg-black">
          <SettingsBar
            loading={loading}
            yearsToRetirement={yearsToRetirement ?? null}
            inflationPct={inflationPct}
            onInflationChange={onInflationChange}
            incomeEquivalentPct={incomeEquivalentPct}
            onIncomeEquivalentChange={onIncomeEquivalentChange}
            onReset={onReset}
            missing={missing}
          />
        </div>
      ) : (
        <div className="text-muted-foreground">Select a client to see planning details.</div>
      )}
    </div>
  );
}
