// Types for Identity domain
export type Gender = 'male' | 'female' | 'other' | 'undisclosed';
export type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'retried'
  | 'full_time_education'
  | 'independent_means'
  | 'homemaker'
  | 'other';

export type IdentityState = {
  // Address
  address1: string;
  address2: string;
  city: string;
  postcode: string;
  // Demographics
  date_of_birth: string;
  gender: Gender | '';
  nationality: string;
  nationality2: string;
  // Work
  employment_status: EmploymentStatus | '';
  occupation: string;
};
