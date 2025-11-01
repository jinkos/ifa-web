// Pure utilities for Planning page. Keep these small and testable.

export function annualiseTarget(cf: any | undefined | null): number {
  if (!cf) return 0;
  const amt = Number((cf as any)?.periodic_amount ?? (cf as any)?.amount ?? 0) || 0;
  const freq = (cf as any)?.frequency as string | undefined;
  switch (freq) {
    case 'weekly': return amt * 52;
    case 'monthly': return amt * 12;
    case 'quarterly': return amt * 4;
    case 'six_monthly': return amt * 2;
    case 'annually': return amt * 1;
    default: return amt; // if unknown, treat as annual amount already
  }
}

export function computeYearsToRetirement(dobISO: string | null, targetAge: number | null, today: Date = new Date()): number | null {
  if (!dobISO || targetAge == null) return null;
  const dob = new Date(dobISO);
  if (isNaN(dob.getTime())) return null;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  if (age < 0) return null;
  const years = targetAge - age;
  return years < 0 ? 0 : years;
}
