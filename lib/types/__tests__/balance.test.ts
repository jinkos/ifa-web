import { describe, it, expect } from 'vitest';
import { toBalanceSheetModel, BalanceSheetItemKind } from '../balance';

describe('toBalanceSheetModel', () => {
  it('passes through known types unchanged', () => {
    const known: BalanceSheetItemKind = 'current_account';
    const input = { balance_sheet: [{ type: known, description: 'My account', ite: {} }] };
    const model = toBalanceSheetModel(input);
    expect(model.balance_sheet[0].type).toBe(known);
    expect(model.balance_sheet[0].description).toBe('My account');
  });
});
