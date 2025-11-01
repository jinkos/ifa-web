// Types for Identity domain
import type { BalanceEmploymentStatus, CashFlow } from '@/lib/types/balance';
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

// UI form state (may require strings for controlled inputs); not the transport model
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

        // Work & Retirement (moved from Balance)
    employment_status?: BalanceEmploymentStatus | null;
    occupation?: string | null;
    target_retirement_age?: number | null;
    target_retirement_income?: CashFlow | null;
};

// Transport model shape used by API calls; mirrors external/pydantic_identity.py IdentityModel
export interface IdentityModel {
    // Personal Information
    date_of_birth?: string | null;
    gender?: 'male' | 'female' | 'other' | 'undisclosed' | null;
    marital_status?: MaritalStatus | null;

    // Residential Address
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    postcode?: string | null;

    // Health and Lifestyle
    health_status?: HealthStatus | null;
    smoker?: ('yes' | 'no' | 'unknown') | null;

    // National Identity
    nationality?: string | null;
    nationality2?: string | null;
    n_i_number?: string | null;

    // Retirement and goals
    target_retirement_age?: number | null;
    target_retirement_income?: CashFlow | null;

    // Work
    employment_status?: BalanceEmploymentStatus | null;
    occupation?: string | null;
}

// Helper: normalize arbitrary identity-like object into a transport-safe IdentityModel
export function toIdentityModel(input: any): IdentityModel {
    const enumGender = new Set(['male', 'female', 'other', 'undisclosed']);
    const enumSmoker = new Set(['yes', 'no', 'unknown']);
    const enumEmployment: Set<string> = new Set([
        'employed',
        'self_employed',
        'retired',
        'full_time_education',
        'independent_means',
        'homemaker',
        'other',
    ]);

    const strOrNull = (v: any): string | null => {
        if (v === null || v === undefined) return null;
        if (typeof v !== 'string') return String(v);
        const t = v.trim();
        return t.length === 0 ? null : t;
    };

    const out: IdentityModel = {};

    // Personal
    const g = (input?.gender ?? null) as any;
    out.gender = typeof g === 'string' && enumGender.has(g) ? (g as any) : null;
    out.date_of_birth = strOrNull(input?.date_of_birth ?? null);
    out.marital_status = ((): MaritalStatus | null => {
        const v = input?.marital_status;
        return v ? (v as MaritalStatus) : null;
    })();

    // Address
    out.address1 = strOrNull(input?.address1);
    out.address2 = strOrNull(input?.address2);
    out.city = strOrNull(input?.city);
    out.postcode = strOrNull(input?.postcode);

    // Health
    out.health_status = ((): HealthStatus | null => {
        const v = input?.health_status;
        return v ? (v as HealthStatus) : null;
    })();
    const sm = (input?.smoker ?? null) as any;
    out.smoker = typeof sm === 'string' && enumSmoker.has(sm) ? (sm as any) : null;

    // National Identity
    out.nationality = strOrNull(input?.nationality);
    out.nationality2 = strOrNull(input?.nationality2);
    out.n_i_number = strOrNull(input?.n_i_number);

    // Retirement & goals
    out.target_retirement_age = ((): number | null => {
        const v = input?.target_retirement_age;
        if (v === null || v === undefined || v === '') return null;
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : null;
    })();
    out.target_retirement_income = ((): CashFlow | null => {
        const cf = input?.target_retirement_income;
        return cf && typeof cf === 'object' ? cf as CashFlow : null;
    })();

    // Work
    const es = (input?.employment_status ?? null) as any;
    out.employment_status = typeof es === 'string' && enumEmployment.has(es) ? (es as any) : null;
    out.occupation = strOrNull(input?.occupation);

    return out;
}
