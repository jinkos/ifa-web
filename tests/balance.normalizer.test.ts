import { describe, it, expect } from 'vitest';
import { toBalanceSheetModel, BalanceSheetItemKind } from '@/lib/types/balance';

describe('Balance normalizer', () => {
  it("maps legacy 'car' type to 'other_valuable_item'", () => {
    const input = {
      balance_sheet: [
        { type: 'car', description: '', currency: '', ite: { value: 10000, loan: { balance: 2000 } } },
      ],
    };

    const model = toBalanceSheetModel(input);
    expect(model.balance_sheet).toHaveLength(1);

    const item = model.balance_sheet[0];
    expect(item.type).toBe('other_valuable_item');

    // When description is blank, we title-case the type as a fallback
    expect(item.description).toBe('Other Valuable Item');

    // Empty currency should be omitted (undefined)
    expect('currency' in item ? (item as any).currency : undefined).toBeUndefined();

    // ite should be preserved as an object
    expect(typeof (item as any).ite).toBe('object');
  });

  it('passes through known types unchanged', () => {
    const known: BalanceSheetItemKind = 'current_account';
    const input = { balance_sheet: [{ type: known, description: 'My account', ite: {} }] };
    const model = toBalanceSheetModel(input);
    expect(model.balance_sheet[0].type).toBe(known);
    expect(model.balance_sheet[0].description).toBe('My account');
  });
});
