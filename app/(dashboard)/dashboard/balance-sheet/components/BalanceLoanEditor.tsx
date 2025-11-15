"use client";
import React from 'react';
import Field from '@/components/ui/form/Field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { CashFlowFieldset } from '@/components/ui/form/CashFlowFieldset';
import type { PersonalBalanceSheetItem, CashFlow, LoanData } from '@/lib/types/balance';

type LoanKinds = 'credit_card' | 'personal_loan' | 'student_loan';

export default function BalanceLoanEditor({
  item,
  onChange,
  descriptionError,
}: {
  item: Extract<PersonalBalanceSheetItem, { type: LoanKinds }> & { ite: LoanData };
  onChange: (next: PersonalBalanceSheetItem) => void;
  descriptionError?: string;
}) {
  const ensureRepayment = (): CashFlow =>
    item.ite.repayment ?? { periodic_amount: null, frequency: 'monthly', net_gross: 'net' };

  const repayment = item.ite.repayment ?? null;
  

  return (
    <div className="mt-3 rounded-md border p-3 bg-muted/30 space-y-4">
      {/* Row 1: Description (2x), Balance, Currency */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Description" className="md:col-span-2" error={descriptionError}>
          <Input
            required
            value={item.description ?? ''}
            onChange={(e) => onChange({ ...item, description: e.target.value })}
            onBlur={(e) => {
              const v = (e.target.value ?? '').trim();
              if (!v) {
                const toTitle = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                onChange({ ...item, description: toTitle(String(item.type)) });
              }
            }}
          />
        </Field>
        <Field label="Balance">
          <NumberInput
            value={item.ite.balance ?? null}
            placeholder="balance"
            onValueChange={(v) => {
              const val = v == null ? null : Math.round(v);
              onChange({ ...item, ite: { ...item.ite, balance: val } });
            }}
          />
        </Field>
        <Field label="Currency">
          <Input
            value={item.currency ?? ''}
            onChange={(e) => onChange({ ...item, currency: e.target.value })}
            placeholder="GBP"
          />
        </Field>
      </div>

      {/* Row 2: Repayment amount, frequency, net/gross */}
      <div className="md:col-span-3">
        <CashFlowFieldset
          label="Repayment"
          value={repayment}
          onChange={(next) => onChange({ ...item, ite: { ...item.ite, repayment: next } })}
        />
      </div>
    </div>
  );
}
