// Types for Identity domain
export type Gender = 'male' | 'female' | 'other' | 'undisclosed';

export type HealthStatus = 'good' | 'some_problems' | 'mostly_good' | 'serious_problems';
export type MaritalStatus =
    | 'single'
    | 'married'
    | 'civil_partnership'
    | 'divorced'
    | 'widowed'
    | 'separated'
    | 'cohabiting'
    | 'other';


export type YesNo = 'yes' | 'no';

export type IdentityState = {

    // Personal Information
    date_of_birth: string;
    gender: Gender | '';
    marital_status?: MaritalStatus | null;

    // Residential Address
    address1: string;
    address2: string;
    city: string;
    postcode: string;

    // National Identity
    nationality: string;
    nationality2: string;
    n_i_number: string

    // Health and Lifestyle
    health_status?: HealthStatus | null;
    smoker?: YesNo | null;
};
