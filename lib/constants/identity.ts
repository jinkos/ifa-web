import type { EmploymentStatus, Gender } from '@/lib/types/identity';

export const genderOptions: Gender[] = ['male', 'female', 'other', 'undisclosed'];

export const employmentOptions: EmploymentStatus[] = [
  'employed',
  'self_employed',
  'retried',
  'full_time_education',
  'independent_means',
  'homemaker',
  'other',
];
