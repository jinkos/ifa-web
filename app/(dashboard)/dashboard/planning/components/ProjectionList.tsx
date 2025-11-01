"use client";
import React from 'react';
import type { ProjectionRow as Row } from '@/lib/planning/types';
import type { ForwardValueAssumptions } from '@/lib/planning/calculator';
import ProjectionRow from './ProjectionRow';
import type { UIAssumptionDefaults } from './ProjectionRow';

export interface ProjectionListProps {
  rows: Row[];
  itemAssumptions: Record<string, Partial<ForwardValueAssumptions>>;
  incomeHighlight: Record<string, boolean>;
  propertyMode: Record<string, 'rent' | 'sell' | 'none'>;
  defaults: UIAssumptionDefaults;
  setItemAssumptions: React.Dispatch<React.SetStateAction<Record<string, Partial<ForwardValueAssumptions>>>>;
  setIncomeHighlight: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setPropertyMode: React.Dispatch<React.SetStateAction<Record<string, 'rent' | 'sell' | 'none'>>>;
}

export default function ProjectionList({ rows, itemAssumptions, incomeHighlight, propertyMode, defaults, setItemAssumptions, setIncomeHighlight, setPropertyMode }: ProjectionListProps) {
  return (
    <div className="p-4 grid grid-cols-1 gap-4">
      {rows.map((p) => (
        <ProjectionRow
          key={p.key}
          row={p}
          assumptions={itemAssumptions[p.key]}
          defaults={defaults}
          incomeHighlighted={incomeHighlight[p.key] ?? true}
          propertyMode={propertyMode[p.key] ?? (p.type === 'buy_to_let' ? 'rent' : 'none')}
          onAssumptionsChange={(partial) => {
            setItemAssumptions((prev) => ({ ...prev, [p.key]: { ...prev[p.key], ...partial } }));
          }}
          onToggleHighlight={(checked) => {
            setIncomeHighlight((prev) => ({ ...prev, [p.key]: checked }));
          }}
          onChangePropertyMode={(mode) => {
            setPropertyMode((prev) => ({ ...prev, [p.key]: mode }));
          }}
        />
      ))}
    </div>
  );
}
