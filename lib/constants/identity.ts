import type { HealthStatus, MaritalStatus, Gender } from '@/lib/types/identity';

export const genderOptions: Gender[] = ['male', 'female', 'other', 'undisclosed'];

export const healthOptions: HealthStatus[] = ['good', 'some_problems', 'mostly_good', 'serious_problems'];

export const smokerOptions = ['yes', 'no']

export const maritalOptions: MaritalStatus[] = [
  'single',
  'married',
  'civil_partnership',
  'divorced',
  'widowed',
  'separated',
  'cohabiting',
  'other',
];

