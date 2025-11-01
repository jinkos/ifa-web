import { describe, it, expect } from 'vitest';
import { annualiseTarget, computeYearsToRetirement } from '@/app/(dashboard)/dashboard/planning/selectors';

describe('planning selectors', () => {
  it('annualiseTarget converts monthly to annual', () => {
    const cf = { periodic_amount: 1000, frequency: 'monthly' };
    expect(annualiseTarget(cf)).toBe(12000);
  });

  it('computeYearsToRetirement handles date math and boundaries', () => {
    const today = new Date('2025-01-01T00:00:00Z');
    const years = computeYearsToRetirement('1990-01-01', 60, today);
    expect(years).toBe(25);
    // Invalid DOB -> null
    expect(computeYearsToRetirement('invalid-date', 60, today)).toBeNull();
  });
});
