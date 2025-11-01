"use client";
import React from 'react';
import type { ProjectionRow as Row } from '@/lib/planning/types';
import type { ForwardValueAssumptions } from '@/lib/planning/calculator';
import { PercentInput } from '@/components/ui/number-input';

export interface UIAssumptionDefaults {
  annual_growth_rate: number;
  contribution_growth_rate: number;
  loan_interest_rate: number;
  tax_rate: number;
  above_inflation_growth_rate: number;
}

export interface ProjectionRowProps {
  row: Row;
  assumptions: Partial<ForwardValueAssumptions> | undefined;
  defaults: UIAssumptionDefaults;
  incomeHighlighted?: boolean;
  propertyMode?: 'rent' | 'sell' | 'none';
  onAssumptionsChange: (partial: Partial<ForwardValueAssumptions>) => void;
  onToggleHighlight: (checked: boolean) => void;
  onChangePropertyMode: (mode: 'rent' | 'sell' | 'none') => void;
}

function getItemBg(t: string): string {
  switch (t) {
    case 'salary_income':
    case 'side_hustle_income':
    case 'self_employment_income':
      return 'bg-emerald-100 border-emerald-300'; // Income
    case 'buy_to_let':
      return 'bg-orange-100 border-orange-300'; // Buy-to-let
    case 'current_account':
    case 'gia':
    case 'isa':
    case 'premium_bond':
    case 'savings_account':
    case 'uni_fees_savings_plan':
    case 'vct':
      return 'bg-sky-100 border-sky-300'; // Investments
    case 'credit_card':
    case 'personal_loan':
    case 'student_loan':
      return 'bg-rose-100 border-rose-300'; // Loans
    case 'main_residence':
    case 'holiday_home':
    case 'other_valuable_item':
      return 'bg-amber-100 border-amber-300'; // Properties
    case 'workplace_pension':
    case 'defined_benefit_pension':
    case 'personal_pension':
    case 'state_pension':
      return 'bg-violet-100 border-violet-300'; // Pensions
    default:
      return 'bg-muted/30';
  }
}

export default function ProjectionRow({ row, assumptions, defaults, incomeHighlighted, propertyMode, onAssumptionsChange, onToggleHighlight, onChangePropertyMode }: ProjectionRowProps) {
  const title = row.type.replaceAll('_', ' ');
  const effGrowthPct = (((assumptions?.annual_growth_rate) ?? defaults.annual_growth_rate) * 100).toFixed(2);
  const effContribPct = (((assumptions?.contribution_growth_rate) ?? defaults.contribution_growth_rate) * 100).toFixed(2);

  return (
    <div className={`rounded-md border p-3 ${getItemBg(row.type)} dark:bg-neutral-950`}>
      {/* Top line: name + values */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium capitalize">{title}</div>
          {row.description ? (
            <div className="text-xs text-muted-foreground">{row.description}</div>
          ) : null}
        </div>
        {row.category === 'asset' ? (
          <div className="flex items-end gap-6 text-sm">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Current</div>
              <div className={`tabular-nums font-medium ${row.current < 0 ? 'text-red-700' : ''}`}>{row.current.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Future</div>
              <div className={`tabular-nums font-medium ${row.future < 0 ? 'text-red-700' : ''}`}>{row.future.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Today</div>
              <div className={`tabular-nums font-medium ${row.futureToday < 0 ? 'text-red-700' : ''}`}>{row.futureToday.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <div className="text-xs text-muted-foreground">As Income</div>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={(incomeHighlighted ?? true)}
                  onChange={(e) => onToggleHighlight(e.target.checked)}
                  title="Toggle highlight"
                />
              </div>
              <div className={`tabular-nums font-semibold ${(incomeHighlighted ?? true) ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                {row.asIncome.toLocaleString()}
              </div>
            </div>
          </div>
        ) : row.category === 'property' ? (
          <div className="flex items-end gap-6 text-sm">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Current</div>
              <div className={`tabular-nums font-medium ${row.current < 0 ? 'text-red-700' : ''}`}>{row.current.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Future</div>
              <div className={`tabular-nums font-medium ${row.future < 0 ? 'text-red-700' : ''}`}>{row.future.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Today</div>
              <div className={`tabular-nums font-medium ${row.futureToday < 0 ? 'text-red-700' : ''}`}>{row.futureToday.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-3">
                <div className="text-xs text-muted-foreground">Income mode</div>
                {row.type === 'buy_to_let' ? (
                  <div className="inline-flex rounded-md border overflow-hidden">
                    {(['rent','sell','none'] as const).map((m) => (
                      <button
                        key={m}
                        className={`px-2 py-1 text-xs ${propertyMode === m ? 'bg-emerald-600 text-white' : 'bg-white/70 dark:bg-neutral-900'}`}
                        onClick={() => onChangePropertyMode(m)}
                      >
                        {m === 'rent' ? 'Rent' : m === 'sell' ? 'Sell' : 'None'}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="inline-flex rounded-md border overflow-hidden">
                    {(['sell','none'] as const).map((m) => (
                      <button
                        key={m}
                        className={`px-2 py-1 text-xs ${propertyMode === m ? 'bg-emerald-600 text-white' : 'bg-white/70 dark:bg-neutral-900'}`}
                        onClick={() => onChangePropertyMode(m)}
                      >
                        {m === 'sell' ? 'Sell' : 'None'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={`tabular-nums font-semibold ${row.asIncome > 0 ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                {row.asIncome.toLocaleString()}
              </div>
            </div>
          </div>
        ) : row.category === 'income' ? (
          <div className="flex items-end gap-6 text-sm">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Income</div>
              <div className="tabular-nums font-semibold text-emerald-700">{row.income.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Shown in today's money</div>
            </div>
          </div>
        ) : (
          <div className="flex items-end gap-6 text-sm">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Current</div>
              <div className={`tabular-nums font-medium ${row.current < 0 ? 'text-red-700' : ''}`}>{row.current.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Future</div>
              <div className={`tabular-nums font-medium ${row.future < 0 ? 'text-red-700' : ''}`}>{row.future.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Today</div>
              <div className={`tabular-nums font-medium ${row.futureToday < 0 ? 'text-red-700' : ''}`}>{row.futureToday.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <div className="text-xs text-muted-foreground">As Income</div>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={(incomeHighlighted ?? true)}
                  onChange={(e) => onToggleHighlight(e.target.checked)}
                  title="Toggle highlight"
                />
              </div>
              <div className={`tabular-nums font-semibold ${(incomeHighlighted ?? true) ? (row.asIncome < 0 ? 'text-red-700' : 'text-emerald-700') : 'text-muted-foreground'}`}>
                {row.asIncome.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Second line: per-item assumptions */}
      <div className="mt-3 pt-3 border-t">
        {row.category === 'asset' ? (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-muted-foreground">Assumptions</span>
            <label className="inline-flex items-center gap-2">
              <span>Growth %</span>
              <PercentInput
                className="w-28"
                value={Number.isFinite(Number(effGrowthPct)) ? Number(effGrowthPct) : 0}
                onValueChange={(v) => onAssumptionsChange({ annual_growth_rate: Number.isFinite(v ?? NaN) ? Math.max(0, v!) / 100 : undefined })}
              />
            </label>
            {row.hasContribution ? (
              <label className="inline-flex items-center gap-2">
                <span>Contribution growth %</span>
                <PercentInput
                  className="w-32"
                  value={Number.isFinite(Number(effContribPct)) ? Number(effContribPct) : 0}
                  onValueChange={(v) => onAssumptionsChange({ contribution_growth_rate: Number.isFinite(v ?? NaN) ? Math.max(0, v!) / 100 : undefined })}
                />
              </label>
            ) : null}
          </div>
        ) : row.category === 'property' ? (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-muted-foreground">Assumptions</span>
            <label className="inline-flex items-center gap-2">
              <span>Growth %</span>
              <PercentInput
                className="w-24"
                value={Number((((assumptions?.annual_growth_rate) ?? defaults.annual_growth_rate) * 100).toFixed(2))}
                onValueChange={(v) => onAssumptionsChange({ annual_growth_rate: Number.isFinite(v ?? NaN) ? Math.max(0, v!) / 100 : undefined })}
              />
            </label>
            <label className="inline-flex items-center gap-2">
              <span>Loan interest %</span>
              <PercentInput
                className="w-32"
                value={Number((((assumptions?.loan_interest_rate) ?? defaults.loan_interest_rate) * 100).toFixed(2))}
                onValueChange={(v) => onAssumptionsChange({ loan_interest_rate: Number.isFinite(v ?? NaN) ? Math.max(0, v!) / 100 : undefined })}
              />
            </label>
            {row.type === 'buy_to_let' || row.type === 'other_valuable_item' ? (
              <label className="inline-flex items-center gap-2">
                <span>Tax rate %</span>
                <PercentInput
                  className="w-24"
                  value={Number((((assumptions?.tax_rate) ?? defaults.tax_rate) * 100).toFixed(2))}
                  onValueChange={(v) => onAssumptionsChange({ tax_rate: Number.isFinite(v ?? NaN) ? Math.max(0, v!) / 100 : undefined })}
                />
              </label>
            ) : null}
          </div>
        ) : row.category === 'income' ? (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-muted-foreground">Assumptions</span>
            <label className="inline-flex items-center gap-2">
              <span>Above-inflation growth %</span>
              <PercentInput
                className="w-28"
                value={Number((((assumptions?.above_inflation_growth_rate) ?? defaults.above_inflation_growth_rate) * 100).toFixed(2))}
                onValueChange={(v) => onAssumptionsChange({ above_inflation_growth_rate: Number.isFinite(v ?? NaN) ? Math.max(0, v!) / 100 : undefined })}
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-muted-foreground">Assumptions</span>
            <label className="inline-flex items-center gap-2">
              <span>Interest %</span>
              <PercentInput
                className="w-32"
                value={Number((((assumptions?.loan_interest_rate) ?? defaults.loan_interest_rate) * 100).toFixed(2))}
                onValueChange={(v) => onAssumptionsChange({ loan_interest_rate: Number.isFinite(v ?? NaN) ? Math.max(0, v!) / 100 : undefined })}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
