"use client";
import { useState } from 'react';
import { useTeam } from '../TeamContext';
import { useSelectedClient } from '../SelectedClientContext';
import { validateIdentityModel } from '@/lib/api/identity';
import { validateBalanceSheetModel } from '@/lib/api/balance';
import { loadPlanningSettings, savePlanningSettings } from '@/lib/api/planning';
import { useRouter } from 'next/navigation';
import { signOut, signInWithCreds } from '@/app/(login)/actions';

export default function DevPage() {
  const { team } = useTeam();
  const { selectedClient } = useSelectedClient();
  const [validating, setValidating] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [debug, setDebug] = useState<any | null>(null);
  const [bsValidating, setBsValidating] = useState(false);
  const [bsOkMsg, setBsOkMsg] = useState<string | null>(null);
  const [bsErrMsg, setBsErrMsg] = useState<string | null>(null);
  const [bsDebug, setBsDebug] = useState<any | null>(null);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [planningJson, setPlanningJson] = useState<any | null>(null);
  const [planningMsg, setPlanningMsg] = useState<string | null>(null);
  const [planningErr, setPlanningErr] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [clientDeleteLoading, setClientDeleteLoading] = useState(false);
  const [clientDeleteMsg, setClientDeleteMsg] = useState<string | null>(null);
  const [clientDeleteErr, setClientDeleteErr] = useState<string | null>(null);
  const router = useRouter();

  const canRun = Boolean(team?.id && selectedClient?.client_id);

  return (
    <section className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Developer tools</h1>
          <div className="text-lg font-medium text-muted-foreground">
            {selectedClient ? selectedClient.name : 'No Client Selected'}
          </div>
        </div>
      </div>

      {!canRun && (
        <div className="text-gray-600 mb-6">Select a team and client to run tests.</div>
      )}

      <div className="grid gap-4 max-w-3xl">
        {/* Gary's Path (delete if exists, then add) */}
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Gary's Path</div>
              <div className="text-sm text-muted-foreground">Deletes Gary T if found, then opens Add Client and creates a fresh one.</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded border ${clientDeleteLoading ? 'border-indigo-300 text-indigo-300 cursor-not-allowed' : 'border-indigo-400 text-indigo-800 bg-indigo-100 hover:bg-indigo-200'}`}
                disabled={clientDeleteLoading}
                data-testid="gary-path-button"
                onClick={async () => {
                  setClientDeleteLoading(true);
                  setClientDeleteErr(null);
                  setClientDeleteMsg(null);
                  try {
                    router.push('/dashboard/clients?recreate=1&name=Gary%20T&email=garry%40everard.me.uk');
                    setClientDeleteMsg('Recreating Gary T…');
                    setTimeout(() => setClientDeleteMsg(null), 3000);
                  } catch (e: any) {
                    setClientDeleteErr(e?.message || 'Failed to recreate client');
                    setTimeout(() => setClientDeleteErr(null), 5000);
                  } finally {
                    setClientDeleteLoading(false);
                  }
                }}
              >
                {clientDeleteLoading ? 'Working…' : `Run Gary's Path`}
              </button>
            </div>
          </div>
          <div className="mt-2">
            {clientDeleteMsg && <span data-testid="gary-path-status" className="text-emerald-700 text-sm">{clientDeleteMsg}</span>}
            {clientDeleteErr && <span data-testid="gary-path-error" className="text-red-600 text-sm">{clientDeleteErr}</span>}
          </div>
        </div>

        {/* (Removed) separate drag-drop button; Gary's Path now includes upload */}

        {/* Auth helpers */}
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auth helpers</div>
              <div className="text-sm text-muted-foreground">Log out and back in as the demo user for presentations.</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded border ${authLoading ? 'border-amber-300 text-amber-300 cursor-not-allowed' : 'border-amber-400 text-amber-800 bg-amber-100 hover:bg-amber-200'}`}
                disabled={authLoading}
                onClick={async () => {
                  setAuthLoading(true);
                  setAuthErr(null);
                  setAuthMsg(null);
                  try {
                    // Ensure clean session then sign back in with demo creds
                    await signOut();
                    const res = await signInWithCreds();
                    // If credentials fail, signInWithCreds returns an object with error instead of redirecting
                    if (res && typeof res === 'object' && 'error' in res && res.error) {
                      setAuthErr(res.error as string);
                      setTimeout(() => setAuthErr(null), 5000);
                    } else {
                      setAuthMsg('Signing in…');
                      setTimeout(() => setAuthMsg(null), 3000);
                    }
                  } catch (e: any) {
                    setAuthErr(e?.message || 'Failed to log out and in');
                    setTimeout(() => setAuthErr(null), 5000);
                  } finally {
                    setAuthLoading(false);
                  }
                }}
              >
                {authLoading ? 'Working…' : 'Log out and in (demo user)'}
              </button>
            </div>
          </div>
          <div className="mt-2">
            {authMsg && <span className="text-emerald-700 text-sm">{authMsg}</span>}
            {authErr && <span className="text-red-600 text-sm">{authErr}</span>}
          </div>
        </div>

        {/* Identity validation card */}
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Validate IdentityModel</div>
              <div className="text-sm text-muted-foreground">Posts team_id, client_id, and identity_model to /test/identity_verification.</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded border ${(!canRun || validating) ? 'border-emerald-300 text-emerald-300 cursor-not-allowed' : 'border-emerald-400 text-emerald-800 bg-emerald-100 hover:bg-emerald-200'}`}
                disabled={!canRun || validating}
                onClick={async () => {
                  if (!team?.id || !selectedClient?.client_id) return;
                  setValidating(true);
                  setOkMsg(null);
                  setErrMsg(null);
                  setDebug(null);
                  try {
                    await validateIdentityModel(team.id, selectedClient.client_id);
                    setOkMsg('Identity validated successfully');
                    setTimeout(() => setOkMsg(null), 4000);
                  } catch (e: any) {
                    const meta = (e as any)?.meta;
                    setErrMsg(e?.message || 'Validation failed');
                    if (meta) setDebug(meta);
                    setTimeout(() => setErrMsg(null), 6000);
                  } finally {
                    setValidating(false);
                  }
                }}
              >
                {validating ? 'Validating…' : 'Validate'}
              </button>
            </div>
          </div>
          <div className="mt-2">
            {okMsg && <span className="text-emerald-700 text-sm">{okMsg}</span>}
            {errMsg && <span className="text-red-600 text-sm">{errMsg}</span>}
          </div>
          {(debug?.attempts || debug?.baseUrl) && (
            <div className="mt-3 text-sm">
              <div className="font-medium mb-1">Backend diagnostics</div>
              {debug?.baseUrl && (
                <div className="mb-2">Base URL: <span className="font-mono">{debug.baseUrl}</span></div>
              )}
              {debug?.attempts && Array.isArray(debug.attempts) && (
              <div className="space-y-2">
                {debug.attempts.map((a: any, i: number) => (
                  <div key={i} className="rounded border p-2 bg-muted/30">
                    <div><span className="font-mono">{a.url}</span></div>
                    <div>Status: <span className="font-mono">{a.status}</span></div>
                    <details className="mt-1">
                      <summary className="cursor-pointer">Response body</summary>
                      <pre className="mt-1 overflow-auto text-xs bg-background p-2 rounded border"><code>{typeof a.body === 'string' ? a.body : JSON.stringify(a.body, null, 2)}</code></pre>
                    </details>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}
        </div>

        {/* Balance Sheet validation card */}
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Validate BalanceSheetModel</div>
              <div className="text-sm text-muted-foreground">Posts team_id, client_id, and balance_sheet_model to /test/balance_sheet_verification.</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded border ${(!canRun || bsValidating) ? 'border-emerald-300 text-emerald-300 cursor-not-allowed' : 'border-emerald-400 text-emerald-800 bg-emerald-100 hover:bg-emerald-200'}`}
                disabled={!canRun || bsValidating}
                onClick={async () => {
                  if (!team?.id || !selectedClient?.client_id) return;
                  setBsValidating(true);
                  setBsOkMsg(null);
                  setBsErrMsg(null);
                  setBsDebug(null);
                  try {
                    await validateBalanceSheetModel(team.id, selectedClient.client_id);
                    setBsOkMsg('Balance sheet validated successfully');
                    setTimeout(() => setBsOkMsg(null), 4000);
                  } catch (e: any) {
                    const meta = (e as any)?.meta;
                    setBsErrMsg(e?.message || 'Validation failed');
                    if (meta) setBsDebug(meta);
                    setTimeout(() => setBsErrMsg(null), 6000);
                  } finally {
                    setBsValidating(false);
                  }
                }}
              >
                {bsValidating ? 'Validating…' : 'Validate'}
              </button>
            </div>
          </div>
          <div className="mt-2">
            {bsOkMsg && <span className="text-emerald-700 text-sm">{bsOkMsg}</span>}
            {bsErrMsg && <span className="text-red-600 text-sm">{bsErrMsg}</span>}
          </div>
          {(bsDebug?.attempts || bsDebug?.baseUrl) && (
            <div className="mt-3 text-sm">
              <div className="font-medium mb-1">Backend diagnostics</div>
              {bsDebug?.baseUrl && (
                <div className="mb-2">Base URL: <span className="font-mono">{bsDebug.baseUrl}</span></div>
              )}
              {bsDebug?.attempts && Array.isArray(bsDebug.attempts) && (
              <div className="space-y-2">
                {bsDebug.attempts.map((a: any, i: number) => (
                  <div key={i} className="rounded border p-2 bg-muted/30">
                    <div><span className="font-mono">{a.url}</span></div>
                    <div>Status: <span className="font-mono">{a.status}</span></div>
                    <details className="mt-1">
                      <summary className="cursor-pointer">Response body</summary>
                      <pre className="mt-1 overflow-auto text-xs bg-background p-2 rounded border"><code>{typeof a.body === 'string' ? a.body : JSON.stringify(a.body, null, 2)}</code></pre>
                    </details>
                  </div>
                ))}
              </div>
              )}
            </div>
          )}
        </div>

        {/* Planning settings card */}
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Planning settings (ifa_docs key = "planning")</div>
              <div className="text-sm text-muted-foreground">Load or reset persisted planning assumptions for this client.</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded border ${(!canRun || planningLoading) ? 'border-slate-300 text-slate-300 cursor-not-allowed' : 'border-slate-400 text-slate-800 bg-slate-100 hover:bg-slate-200'}`}
                disabled={!canRun || planningLoading}
                onClick={async () => {
                  if (!team?.id || !selectedClient?.client_id) return;
                  setPlanningLoading(true);
                  setPlanningErr(null);
                  setPlanningMsg(null);
                  try {
                    const data = await loadPlanningSettings(team.id, selectedClient.client_id);
                    setPlanningJson(data);
                    setPlanningMsg('Loaded planning settings');
                    setTimeout(() => setPlanningMsg(null), 3000);
                  } catch (e: any) {
                    setPlanningErr(e?.message || 'Failed to load planning settings');
                    setTimeout(() => setPlanningErr(null), 5000);
                  } finally {
                    setPlanningLoading(false);
                  }
                }}
              >
                {planningLoading ? 'Loading…' : 'Load'}
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded border ${(!canRun || planningLoading) ? 'border-rose-300 text-rose-300 cursor-not-allowed' : 'border-rose-400 text-rose-800 bg-rose-100 hover:bg-rose-200'}`}
                disabled={!canRun || planningLoading}
                onClick={async () => {
                  if (!team?.id || !selectedClient?.client_id) return;
                  setPlanningLoading(true);
                  setPlanningErr(null);
                  setPlanningMsg(null);
                  try {
                    await savePlanningSettings(team.id, selectedClient.client_id, { version: 1 });
                    setPlanningJson({});
                    setPlanningMsg('Reset planning settings (empty)');
                    setTimeout(() => setPlanningMsg(null), 3000);
                  } catch (e: any) {
                    setPlanningErr(e?.message || 'Failed to reset planning settings');
                    setTimeout(() => setPlanningErr(null), 5000);
                  } finally {
                    setPlanningLoading(false);
                  }
                }}
              >
                Reset
              </button>
            </div>
          </div>
          <div className="mt-2">
            {planningMsg && <span className="text-emerald-700 text-sm">{planningMsg}</span>}
            {planningErr && <span className="text-red-600 text-sm">{planningErr}</span>}
          </div>
          {planningJson ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm">Show JSON</summary>
              <pre className="mt-1 overflow-auto text-xs bg-background p-2 rounded border"><code>{JSON.stringify(planningJson, null, 2)}</code></pre>
            </details>
          ) : (
            <div className="mt-3 text-sm text-muted-foreground">No planning settings loaded. Click Load to fetch current value.</div>
          )}
        </div>
      </div>
    </section>
  );
}
