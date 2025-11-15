import { describe, it, expect } from 'vitest';
import { normalizeLoadedItems } from '@/lib/balance/normalize';

describe('normalizeLoadedItems', () => {
  it('assigns __localId to items lacking it', () => {
    const input = [
      { type: 'current_account', description: 'HSBC', ite: {} },
      { type: 'isa', ite: {} }, // no description
    ];
    const out = normalizeLoadedItems(input);
    expect(out).toHaveLength(2);
    expect(out[0].__localId).toBeTruthy();
    expect(typeof out[0].__localId).toBe('string');
    expect(out[1].__localId).toBeTruthy();
    // description defaults from type
    expect(out[1].description).toBe('Isa');
    // currency omitted when falsy
    expect('currency' in out[0]).toBe(false);
  });

  it('preserves existing __localId values', () => {
    const input = [
      { type: 'gia', description: 'Fidelity', __localId: 'keep-me', ite: {} },
    ];
    const out = normalizeLoadedItems(input);
    expect(out[0].__localId).toBe('keep-me');
  });
});
