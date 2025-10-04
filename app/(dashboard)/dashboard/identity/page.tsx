"use client";
import { useEffect, useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Gender = 'male' | 'female' | 'other' | 'undisclosed';
type EmploymentStatus =
  | 'employed'
  | 'self_employed'
  | 'retried'
  | 'full_time_education'
  | 'independent_means'
  | 'homemaker'
  | 'other';

const genderOptions: Gender[] = ['male', 'female', 'other', 'undisclosed'];
const employmentOptions: EmploymentStatus[] = [
  'employed',
  'self_employed',
  'retried',
  'full_time_education',
  'independent_means',
  'homemaker',
  'other',
];

type IdentityState = {
  // Address
  address1: string;
  address2: string;
  city: string;
  postcode: string; // keeping existing naming in UI/API
  // Demographics
  date_of_birth: string; // ISO YYYY-MM-DD
  gender: Gender | '';
  nationality: string;
  nationality2: string;
  // Work
  employment_status: EmploymentStatus | '';
  occupation: string;
};

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

  // Fetch identity.json for current client when selection or team changes
  useEffect(() => {
    let ignore = false;
    const fetchClient = async () => {
      if (!selectedClient?.client_id || !team?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/identity?teamId=${team.id}&clientId=${selectedClient.client_id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load identity');
        const data = (await res.json()) as Partial<IdentityState>;
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

  const onChange = <K extends keyof IdentityState>(key: K) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold mb-2">Identity</h1>
      <div className="mb-4 text-lg font-medium">
        {selectedClient ? selectedClient.name : 'No Client Selected'}
      </div>

      {!canEdit ? (
        <div className="text-gray-600">Select a client to edit identity details.</div>
      ) : (
        <div className="max-w-3xl space-y-8">
          {/* Actions row */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {loading ? 'Loading…' : saved ? 'All changes saved.' : 'Edit fields then click Save.'}
            </div>
            <div className="flex items-center gap-3">
              {saveError && (
                <span className="text-red-600 text-sm">{saveError}</span>
              )}
              <button
                className={`px-4 py-2 rounded text-white ${saving || loading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
                disabled={saving || loading || !team?.id || !selectedClient?.client_id}
                onClick={async () => {
                  if (!team?.id || !selectedClient?.client_id) return;
                  setSaving(true);
                  setSaveError(null);
                  setSaved(false);
                  try {
                    const res = await fetch(`/api/identity?teamId=${team.id}&clientId=${selectedClient.client_id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(state),
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error || 'Failed to save');
                    }
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                  } catch (e: any) {
                    setSaveError(e.message || 'Failed to save');
                    setTimeout(() => setSaveError(null), 4000);
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${extracting || loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                disabled={extracting || loading || !team?.id || !selectedClient?.client_id}
                onClick={async () => {
                  if (!team?.id || !selectedClient?.client_id) return;
                  setExtracting(true);
                  setExtractError(null);
                  try {
                    // Call server to extract identity summary from docs
                    const r = await fetch('/api/docs/extract_identity', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ team_id: team.id, client_id: selectedClient.client_id }),
                    });
                    if (!r.ok) {
                      const err = await r.json().catch(() => ({}));
                      throw new Error(err.error || 'Extract failed');
                    }
                    // Use the API response to overwrite the current form state (do not fetch from storage)
                    const payload = (await r.json()) as Partial<IdentityState> & { postal_code?: string };
                    setState({
                      address1: (payload as any)?.address1 ?? '',
                      address2: (payload as any)?.address2 ?? '',
                      city: (payload as any)?.city ?? '',
                      postcode: ((payload as any)?.postcode ?? (payload as any)?.postal_code) ?? '',
                      date_of_birth: (payload as any)?.date_of_birth ?? '',
                      gender: ((payload as any)?.gender as Gender | undefined) ?? '',
                      nationality: (payload as any)?.nationality ?? '',
                      nationality2: (payload as any)?.nationality2 ?? '',
                      employment_status: ((payload as any)?.employment_status as EmploymentStatus | undefined) ?? '',
                      occupation: (payload as any)?.occupation ?? '',
                    });
                  } catch (e: any) {
                    setExtractError(e.message || 'Extract failed');
                    setTimeout(() => setExtractError(null), 4000);
                  } finally {
                    setExtracting(false);
                  }
                }}
              >
                {extracting ? 'Extracting…' : 'Extract from Docs'}
              </button>
              {extractError && <span className="text-red-600 text-sm">{extractError}</span>}
            </div>
          </div>
          {/* Address */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address1">Address line 1</Label>
                <Input
                  id="address1"
                  value={state.address1}
                  onChange={onChange('address1')}
                  placeholder="Address line 1"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="address2">Address line 2</Label>
                <Input
                  id="address2"
                  value={state.address2}
                  onChange={onChange('address2')}
                  placeholder="Address line 2"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={state.city}
                  onChange={onChange('city')}
                  placeholder="City"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  id="postcode"
                  value={state.postcode}
                  onChange={onChange('postcode')}
                  placeholder="Postcode"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          {/* Demographics */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Demographics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date_of_birth">Date of birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={state.date_of_birth}
                  onChange={onChange('date_of_birth')}
                  placeholder="YYYY-MM-DD"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Gender</Label>
                <select
                  className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                  value={state.gender}
                  onChange={(e) => setState((prev) => ({ ...prev, gender: e.target.value as Gender | '' }))}
                  disabled={loading}
                >
                  <option value="">Select…</option>
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={state.nationality}
                  onChange={onChange('nationality')}
                  placeholder="Nationality"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="nationality2">Second nationality</Label>
                <Input
                  id="nationality2"
                  value={state.nationality2}
                  onChange={onChange('nationality2')}
                  placeholder="Second nationality (optional)"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          {/* Work */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Employment status</Label>
                <select
                  className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                  value={state.employment_status}
                  onChange={(e) => setState((prev) => ({ ...prev, employment_status: e.target.value as EmploymentStatus | '' }))}
                  disabled={loading}
                >
                  <option value="">Select…</option>
                  {employmentOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={state.occupation}
                  onChange={onChange('occupation')}
                  placeholder="Occupation"
                  disabled={loading}
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
