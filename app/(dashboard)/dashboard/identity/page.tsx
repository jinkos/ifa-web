"use client";
import { useEffect, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import ActionBar from '@/components/action-bar';
import type { IdentityState, Gender } from '@/lib/types/identity';
import { toIdentityModel } from '@/lib/types/identity';
import { extractIdentity, loadIdentity, saveIdentity } from '@/lib/api/identity';
import { mergeIdentityFields, isBlank } from '@/lib/utils';
import AddressSection from './components/AddressSection';
import DemographicsSection from './components/DemographicsSection';
import PersonalSection from './components/PersonalSection';
import NationalIdentitySection from './components/NationalIdentitySection';
import EmploymentSection from './components/EmploymentSection';
import RetirementGoalsSection from './components/RetirementGoalsSection';
import { useAutosave } from '@/lib/hooks/useAutosave';

export default function IdentityPage() {
  const { selectedClient } = useSelectedClient();
  const { team } = useTeam();

  const [state, setState] = useState<IdentityState>({
    address1: '',
    address2: '',
    city: '',
    postcode: '',
    date_of_birth: '',
    gender: '',
    marital_status: null,
    nationality: '',
    nationality2: '',
    n_i_number: '',
    health_status: null,
    smoker: null,
    employment_status: null,
    occupation: '',
    target_retirement_age: null,
    target_retirement_income: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  
  // Track last loaded/saved server state and incoming suggested changes from extract
  const [base, setBase] = useState<IdentityState | null>(null);
  const [incoming, setIncoming] = useState<Partial<IdentityState> | null>(null);

  // Fetch identity.json for current client when selection or team changes
  useEffect(() => {
    let ignore = false;
    const fetchClient = async () => {
      if (!selectedClient?.client_id || !team?.id) return;
      setLoading(true);
      try {
        const data = await loadIdentity<IdentityState>(team.id, selectedClient.client_id);
        if (!ignore) {
          setState({
            address1: data.address1 ?? '',
            address2: data.address2 ?? '',
            city: (data as any)?.city ?? '',
            postcode: (data as any)?.postcode ?? '',
            date_of_birth: (data as any)?.date_of_birth ?? '',
            gender: ((data as any)?.gender as Gender | undefined) ?? '',
            marital_status: (data as any)?.marital_status ?? null,
            nationality: (data as any)?.nationality ?? '',
            nationality2: (data as any)?.nationality2 ?? '',
            n_i_number: (data as any)?.n_i_number ?? '',
            health_status: (data as any)?.health_status ?? null,
            smoker: (data as any)?.smoker ?? null,
            employment_status: (data as any)?.employment_status ?? null,
            occupation: (data as any)?.occupation ?? '',
            target_retirement_age: (data as any)?.target_retirement_age ?? null,
            target_retirement_income: (data as any)?.target_retirement_income ?? null,
          });
          setBase({
            address1: data.address1 ?? '',
            address2: data.address2 ?? '',
            city: (data as any)?.city ?? '',
            postcode: (data as any)?.postcode ?? '',
            date_of_birth: (data as any)?.date_of_birth ?? '',
            gender: ((data as any)?.gender as Gender | undefined) ?? '',
            marital_status: (data as any)?.marital_status ?? null,
            nationality: (data as any)?.nationality ?? '',
            nationality2: (data as any)?.nationality2 ?? '',
            n_i_number: (data as any)?.n_i_number ?? '',
            health_status: (data as any)?.health_status ?? null,
            smoker: (data as any)?.smoker ?? null,
            employment_status: (data as any)?.employment_status ?? null,
            occupation: (data as any)?.occupation ?? '',
            target_retirement_age: (data as any)?.target_retirement_age ?? null,
            target_retirement_income: (data as any)?.target_retirement_income ?? null,
          });
          setIncoming(null);
        }
      } catch (e) {
        // For now, ignore load errors; fields remain editable but unsaved
        // console.warn('Failed to load client identity fields', e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchClient();
    return () => {
      ignore = true;
    };
  }, [selectedClient?.client_id, team?.id]);

  const canEdit = Boolean(selectedClient?.client_id);
  const canSave = Boolean(team?.id && selectedClient?.client_id);

  const { status: autosaveStatus, error: autosaveError } = useAutosave<IdentityState>({
    data: state,
    canSave,
    delay: 1200,
    saveFn: async (payload) => {
      if (!team?.id || !selectedClient?.client_id) return;
      const transport = toIdentityModel(payload);
      await saveIdentity(team.id, selectedClient.client_id, transport);
      setBase(payload);
    },
  });

  // Field change handling is delegated to subcomponents via `update` patch function

  return (
    <section className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold mb-2">Identity</h1>
      <div className="mb-4 text-lg font-medium">
        {selectedClient ? selectedClient.name : 'No Client Selected'}
      </div>
      
      {incoming && Object.keys(incoming).length > 0 && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Incoming changes: {Object.keys(incoming).length} pending. Review inline or use the toolbar.
        </div>
      )}

      {!canEdit ? (
        <div className="text-gray-600">Select a client to edit identity details.</div>
      ) : (
        <div className="max-w-3xl space-y-8">
          {
            <>
              {/* Actions row */}
              <ActionBar
                loading={loading}
                saving={autosaveStatus === 'saving'}
                saved={autosaveStatus === 'saved'}
                saveError={autosaveError}
                extracting={extracting}
                extractError={extractError}
                canAct={Boolean(team?.id && selectedClient?.client_id)}
                extras={incoming && Object.keys(incoming).length > 0 ? (
                  <div className="flex items-center gap-2 mr-2">
                    <button
                      type="button"
                      className="px-3 py-1 rounded border border-amber-400 text-amber-800 bg-amber-100 hover:bg-amber-200"
                      onClick={() => {
                        // Accept all suggestions
                        if (!incoming) return;
                        setState((prev) => ({ ...prev, ...incoming } as IdentityState));
                        setIncoming(null);
                      }}
                    >
                      Accept All ({Object.keys(incoming).length})
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                      onClick={() => setIncoming(null)}
                    >
                      Reject All
                    </button>
                  </div>
                ) : null}
                onSave={async () => {
                  // Manual save is redundant with autosave but kept as a no-op or forced flush
                  if (!team?.id || !selectedClient?.client_id) return;
                  const transport = toIdentityModel(state);
                  await saveIdentity(team.id, selectedClient.client_id, transport);
                  setBase(state);
                  setIncoming(null);
                }}
                onExtract={async () => {
                  if (!team?.id || !selectedClient?.client_id) return;
                  setExtracting(true);
                  setExtractError(null);
                  try {
                    const payload = await extractIdentity<IdentityState>(team.id, selectedClient.client_id);
                    // Auto-merge by filling only blanks from payload
                    const merged = mergeIdentityFields(state, payload);
                    setState(merged);

                    // Build a suggestion list only for conflicting non-blank values
                    const suggest: Partial<IdentityState> = {};
                    const keys: (keyof IdentityState)[] = [
                      'address1',
                      'address2',
                      'city',
                      'postcode',
                      'date_of_birth',
                      'gender',
                      'marital_status',
                      'nationality',
                      'nationality2',
                      'n_i_number',
                      'health_status',
                      'smoker',
                      'employment_status',
                      'occupation',
                      'target_retirement_age',
                    ];
                    for (const k of keys) {
                      const cur = (state as any)[k];
                      const inc = (payload as any)?.[k];
                      if (typeof inc === 'undefined') continue; // not present in payload
                      // Suggest only when both are non-blank and different
                      if (!isBlank(cur) && !isBlank(inc) && cur !== inc) {
                        (suggest as any)[k] = inc;
                      }
                    }
                    // Nested suggestions for target_retirement_income
                    const curTRI = (state as any)?.target_retirement_income ?? {};
                    const incTRI = (payload as any)?.target_retirement_income ?? {};
                    const triFields = ['periodic_amount', 'frequency', 'net_gross'] as const;
                    const triSugg: any = {};
                    for (const f of triFields) {
                      const c = (curTRI as any)[f];
                      const i = (incTRI as any)[f];
                      if (typeof i === 'undefined') continue;
                      if (!isBlank(c) && !isBlank(i) && c !== i) triSugg[f] = i;
                    }
                    if (Object.keys(triSugg).length > 0) {
                      (suggest as any).target_retirement_income = triSugg;
                    }
                    setIncoming(Object.keys(suggest).length ? suggest : null);
                  } catch (e: any) {
                    setExtractError(e.message || 'Extract failed');
                    setTimeout(() => setExtractError(null), 4000);
                  } finally {
                    setExtracting(false);
                  }
                }}
              />
              {/* Personal Information */}
              <PersonalSection
            value={{
              date_of_birth: state.date_of_birth,
              gender: state.gender,
              marital_status: state.marital_status,
            }}
            update={(patch) => setState((prev) => ({ ...prev, ...patch }))}
            suggestions={incoming ? {
              date_of_birth: incoming.date_of_birth,
              gender: incoming.gender,
              marital_status: incoming.marital_status,
            } : undefined}
            onAccept={(key) => {
              if (!incoming) return;
              const val = (incoming as any)[key];
              if (typeof val !== 'undefined') {
                setState((prev) => ({ ...prev, [key]: val } as IdentityState));
              }
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                delete next[key];
                return next as Partial<IdentityState>;
              });
            }}
            onReject={(key) => {
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                delete next[key];
                return next as Partial<IdentityState>;
              });
            }}
            loading={loading}
          />
          {/* Work */}
          <EmploymentSection
            value={{ employment_status: state.employment_status ?? null, occupation: state.occupation ?? '' }}
            update={(patch) => setState((prev) => ({ ...prev, ...patch }))}
            suggestions={incoming ? {
              employment_status: incoming.employment_status,
              occupation: incoming.occupation,
            } : undefined}
            onAccept={(key) => {
              setState((prev) => ({ ...prev, [key]: (incoming as any)?.[key] } as IdentityState));
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                delete next[key];
                return next as Partial<IdentityState>;
              });
            }}
            onReject={(key) => {
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                delete next[key];
                return next as Partial<IdentityState>;
              });
            }}
          />
          {/* Retirement Goals */}
          <RetirementGoalsSection
            value={{ target_retirement_age: state.target_retirement_age ?? null, target_retirement_income: state.target_retirement_income ?? null }}
            update={(patch) => setState((prev) => ({ ...prev, ...patch }))}
            suggestions={incoming ? {
              target_retirement_age: incoming.target_retirement_age,
              target_retirement_income: (incoming as any)?.target_retirement_income,
            } : undefined}
            onAccept={(key, subkey) => {
              setState((prev) => {
                const next = { ...prev } as IdentityState;
                if (key === 'target_retirement_age') {
                  next.target_retirement_age = (incoming as any)?.target_retirement_age ?? null;
                }
                if (key === 'target_retirement_income') {
                  const cur = next.target_retirement_income ?? {} as any;
                  const inc = (incoming as any)?.target_retirement_income ?? {};
                  if (subkey) {
                    cur[subkey as any] = inc[subkey as any];
                    next.target_retirement_income = cur;
                  } else {
                    next.target_retirement_income = { ...cur, ...inc } as any;
                  }
                }
                return next;
              });
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                if (key === 'target_retirement_age') {
                  delete next.target_retirement_age;
                }
                if (key === 'target_retirement_income') {
                  if (subkey) {
                    if (next.target_retirement_income) {
                      delete next.target_retirement_income[subkey as any];
                      if (Object.keys(next.target_retirement_income).length === 0) delete next.target_retirement_income;
                    }
                  } else {
                    delete next.target_retirement_income;
                  }
                }
                return Object.keys(next).length === 0 ? null : next;
              });
            }}
            onReject={(key, subkey) => {
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                if (key === 'target_retirement_age') {
                  delete next.target_retirement_age;
                }
                if (key === 'target_retirement_income') {
                  if (subkey) {
                    if (next.target_retirement_income) {
                      delete next.target_retirement_income[subkey as any];
                      if (Object.keys(next.target_retirement_income).length === 0) delete next.target_retirement_income;
                    }
                  } else {
                    delete next.target_retirement_income;
                  }
                }
                return Object.keys(next).length === 0 ? null : next;
              });
            }}
          />
          {/* Address */}
          <AddressSection
            value={{ address1: state.address1, address2: state.address2, city: state.city, postcode: state.postcode }}
            update={(patch) => setState((prev) => ({ ...prev, ...patch }))}
            suggestions={incoming ? {
              address1: incoming.address1,
              address2: incoming.address2,
              city: incoming.city,
              postcode: incoming.postcode,
            } : undefined}
            onAccept={(key) => {
              if (!incoming) return;
              const val = (incoming as any)[key];
              if (typeof val !== 'undefined') {
                setState((prev) => ({ ...prev, [key]: val } as IdentityState));
              }
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                delete next[key];
                return next as Partial<IdentityState>;
              });
            }}
            onReject={(key) => {
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                delete next[key];
                return next as Partial<IdentityState>;
              });
            }}
            loading={loading}
          />
          {/* National Identity */}
          <NationalIdentitySection
            value={{
              nationality: state.nationality,
              nationality2: state.nationality2,
              n_i_number: state.n_i_number,
            }}
            update={(patch) => setState((prev) => ({ ...prev, ...patch }))}
            suggestions={incoming ? {
              nationality: incoming.nationality,
              nationality2: incoming.nationality2,
              n_i_number: incoming.n_i_number,
            } : undefined}
            onAccept={(key) => {
              if (!incoming) return;
              const val = (incoming as any)[key];
              if (typeof val !== 'undefined') {
                setState((prev) => ({ ...prev, [key]: val } as IdentityState));
              }
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                delete next[key];
                return next as Partial<IdentityState>;
              });
            }}
            onReject={(key) => {
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                delete next[key];
                return next as Partial<IdentityState>;
              });
            }}
            loading={loading}
          />
          {/* Health and Lifestyle */}
          <DemographicsSection
            value={{
              health_status: state.health_status,
              smoker: state.smoker,
            }}
            update={(patch) => setState((prev) => ({ ...prev, ...patch }))}
            suggestions={incoming ? {
              health_status: incoming.health_status,
              smoker: incoming.smoker,
            } : undefined}
            onAccept={(key) => {
              if (!incoming) return;
              const val = (incoming as any)[key];
              if (typeof val !== 'undefined') {
                setState((prev) => ({ ...prev, [key]: val } as IdentityState));
              }
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                delete next[key];
                return next as Partial<IdentityState>;
              });
            }}
            onReject={(key) => {
              setIncoming((prev) => {
                if (!prev) return prev;
                const next = { ...prev } as any;
                delete next[key];
                return next as Partial<IdentityState>;
              });
            }}
            loading={loading}
          />
            </>
          }
        </div>
      )}
    </section>
  );
}
