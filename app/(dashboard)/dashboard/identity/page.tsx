"use client";
import { useEffect, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import ActionBar from '@/components/action-bar';
import type { IdentityState, Gender, EmploymentStatus } from '@/lib/types/identity';
import { extractIdentity, loadIdentity, saveIdentity } from '@/lib/api/identity';
import AddressSection from './components/AddressSection';
import DemographicsSection from './components/DemographicsSection';
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
    nationality: '',
    nationality2: '',
    employment_status: '',
    occupation: '',
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
            nationality: (data as any)?.nationality ?? '',
            nationality2: (data as any)?.nationality2 ?? '',
            employment_status: ((data as any)?.employment_status as EmploymentStatus | undefined) ?? '',
            occupation: (data as any)?.occupation ?? '',
          });
          setBase({
            address1: data.address1 ?? '',
            address2: data.address2 ?? '',
            city: (data as any)?.city ?? '',
            postcode: (data as any)?.postcode ?? '',
            date_of_birth: (data as any)?.date_of_birth ?? '',
            gender: ((data as any)?.gender as Gender | undefined) ?? '',
            nationality: (data as any)?.nationality ?? '',
            nationality2: (data as any)?.nationality2 ?? '',
            employment_status: ((data as any)?.employment_status as EmploymentStatus | undefined) ?? '',
            occupation: (data as any)?.occupation ?? '',
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
      await saveIdentity<IdentityState>(team.id, selectedClient.client_id, payload);
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
              await saveIdentity<IdentityState>(team.id, selectedClient.client_id, state);
              setBase(state);
              setIncoming(null);
            }}
            onExtract={async () => {
              if (!team?.id || !selectedClient?.client_id) return;
              setExtracting(true);
              setExtractError(null);
              try {
                const payload = await extractIdentity<IdentityState>(team.id, selectedClient.client_id);
                // Build an incoming diff of only changed fields compared to current state
                const diff: Partial<IdentityState> = {};
                const keys: (keyof IdentityState)[] = [
                  'address1',
                  'address2',
                  'city',
                  'postcode',
                  'date_of_birth',
                  'gender',
                  'nationality',
                  'nationality2',
                  'employment_status',
                  'occupation',
                ];
                for (const k of keys) {
                  const incomingVal = (payload as any)?.[k];
                  // Normalize undefined to empty string for string fields
                  const normalizedIncoming = incomingVal ?? '';
                  if ((state as any)[k] !== normalizedIncoming) {
                    (diff as any)[k] = normalizedIncoming;
                  }
                }
                setIncoming(diff);
              } catch (e: any) {
                setExtractError(e.message || 'Extract failed');
                setTimeout(() => setExtractError(null), 4000);
              } finally {
                setExtracting(false);
              }
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
          {/* Demographics */}
          <DemographicsSection
            value={{
              date_of_birth: state.date_of_birth,
              gender: state.gender,
              nationality: state.nationality,
              nationality2: state.nationality2,
              employment_status: state.employment_status,
              occupation: state.occupation,
            }}
            update={(patch) => setState((prev) => ({ ...prev, ...patch }))}
            suggestions={incoming ? {
              date_of_birth: incoming.date_of_birth,
              gender: incoming.gender,
              nationality: incoming.nationality,
              nationality2: incoming.nationality2,
              employment_status: incoming.employment_status,
              occupation: incoming.occupation,
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
        </div>
      )}
    </section>
  );
}
