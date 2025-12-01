"use client";
import React from "react";
import TotalsCard from "./TotalsCard";
import ProjectionList from "./ProjectionList";
import type { ForwardValueAssumptions } from "@/lib/planning/calculator";

interface Props {
  enabled: boolean;
  loading: boolean;
  projections: any[];
  totals: any;
  targetIncomeAnnual: number;
  itemAssumptions: Record<string, Partial<ForwardValueAssumptions>>;
  incomeHighlight: Record<string, boolean>;
  propertyMode: Record<string, 'rent' | 'sell' | 'none'>;
  defaults: Pick<ForwardValueAssumptions, 'annual_growth_rate' | 'contribution_growth_rate'> & {
    loan_interest_rate: number;
    tax_rate: number;
    above_inflation_growth_rate: number;
  };
  setItemAssumptions: React.Dispatch<React.SetStateAction<Record<string, Partial<ForwardValueAssumptions>>>>;
  setIncomeHighlight: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setPropertyMode: React.Dispatch<React.SetStateAction<Record<string, 'rent' | 'sell' | 'none'>>>;
}

export default function PensionProjections(props: Props) {
  const { enabled, loading, projections, totals, targetIncomeAnnual, itemAssumptions, incomeHighlight, propertyMode, defaults, setItemAssumptions, setIncomeHighlight, setPropertyMode } = props;
  if (!enabled) return null;
  return (
    <div className="mt-6 border rounded-md bg-white dark:bg-black">
      <div className="px-4 py-3 border-b font-medium">Projected values at retirement</div>
      {loading ? (
        <div className="p-4 text-muted-foreground">Loading…</div>
      ) : projections.length > 0 ? (
        <div>
          <TotalsCard totals={totals} targetIncomeAnnual={targetIncomeAnnual} />
          <ProjectionList
            rows={projections}
            itemAssumptions={itemAssumptions}
            incomeHighlight={incomeHighlight}
            propertyMode={propertyMode}
            defaults={defaults}
            setItemAssumptions={setItemAssumptions}
            setIncomeHighlight={setIncomeHighlight}
            setPropertyMode={setPropertyMode}
          />
        </div>
      ) : (
        <div className="p-4 text-muted-foreground">No investment or pension items to project.</div>
      )}
    </div>
  );
}
