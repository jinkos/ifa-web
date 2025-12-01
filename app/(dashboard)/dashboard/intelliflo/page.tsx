'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { connectToIntelliflo } from '@/lib/auth/intelliflo';
import { useTeam } from '../TeamContext';
import { useSelectedClient } from '../SelectedClientContext';
import { loadIdentity, saveIdentity } from '@/lib/api/identity';
import { toIdentityModel } from '@/lib/types/identity';

export default function IntellifloPage() {
  const { team } = useTeam();
  const { selectedClient, setSelectedClient, refreshSelectedClient } = useSelectedClient();
  const [findLoading, setFindLoading] = useState(false);
  const [findResult, setFindResult] = useState<any>(null);
  const [findError, setFindError] = useState<string | null>(null);
  const [selectedFound, setSelectedFound] = useState<{ full_name: string; iid: number } | null>(null);
  const [linkSaving, setLinkSaving] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [pullLoading, setPullLoading] = useState(false);
  const [pullResult, setPullResult] = useState<any>(null);
  const [pullError, setPullError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [backendLoggedIn, setBackendLoggedIn] = useState<boolean | null>(null);

  // All calls go through Next.js API proxy

  const decodeJwtPayload = (token: string) => {
    try {
      const base64Payload = token.split('.')[1];
      if (!base64Payload) {
        return null;
      }
      const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(normalized)
          .split('')
          .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.warn('Failed to decode Intelliflo id_token', err);
      return null;
    }
  };

  const isIdTokenExpired = (idToken: string) => {
    const payload = decodeJwtPayload(idToken);
    if (!payload || !payload.exp) return true; // Treat missing exp as expired
    // exp is seconds since epoch
    const expiresAtMs = payload.exp * 1000;
    return Date.now() >= expiresAtMs;
  };



  // Check backend status and refresh client data on mount
  useEffect(() => {
    void checkBackendStatus();
    void refreshSelectedClient();
  }, []);



  const findClient = async () => {
    setFindLoading(true);
    setFindError(null);
    setFindResult(null);
    try {
      const name = selectedClient?.name || '';
      if (!name) {
        setFindError('No client selected to search by name.');
        setFindLoading(false);
        return;
      }
      // Get current user ID
      const userResponse = await fetch('/api/user');
      if (!userResponse.ok) {
        setFindError('Failed to get user information');
        setFindLoading(false);
        return;
      }
      const userData = await userResponse.json();

      const url = `/api/intelliflo/find_client?full_name=${encodeURIComponent(name)}&user_id=${userData.id}`;
      const resp = await fetch(url, {
        headers: {
          Accept: 'application/json'
        }
      });

      // Try to parse response as JSON regardless of status
      const data = await resp.json().catch(() => null);

      // Check if login is required (can come with 401 status)
      if (data && data.detail === 'NEED_LOGIN') {
        setFindLoading(false);
        // Trigger login
        connectToIntelliflo();
        setFindError('Authentication required. Redirecting to login...');
        return;
      }

      if (!resp.ok) {
        const txt = data ? JSON.stringify(data) : `Search failed (${resp.status})`;
        setFindError(txt);
      } else {
        setFindResult(data);
        setSelectedFound(null);
      }
    } catch (e: any) {
      setFindError(e.message || 'Find client failed');
    } finally {
      setFindLoading(false);
    }
  };

  const saveBackendLink = async () => {
    if (!selectedFound || !selectedClient?.client_id) return;
    setLinkSaving(true);
    setLinkError(null);
    setLinkSuccess(false);
    try {
      const resp = await fetch(`/api/clients/${selectedClient.client_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ back_end: 'intelliflo', back_end_id: String(selectedFound.iid) })
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Failed to save backend link');
      }
      const updated = await resp.json();
      setSelectedClient(updated);
      setLinkSuccess(true);
    } catch (e: any) {
      setLinkError(e.message || 'Error saving link');
    } finally {
      setLinkSaving(false);
      setTimeout(() => {
        setLinkSuccess(false);
      }, 3000);
    }
  };

  const pullData = async () => {
    setPullLoading(true);
    setPullError(null);
    setPullResult(null);
    try {
      const clientId = selectedClient?.back_end_id;
      if (!clientId) {
        setPullError('No Intelliflo ID linked to this client.');
        setPullLoading(false);
        return;
      }
      // Get current user ID
      const userResponse = await fetch('/api/user');
      if (!userResponse.ok) {
        setPullError('Failed to get user information');
        setPullLoading(false);
        return;
      }
      const userData = await userResponse.json();

      const url = `/api/intelliflo/pull?client_id=${encodeURIComponent(clientId)}&user_id=${userData.id}`;
      const resp = await fetch(url, {
        headers: {
          Accept: 'application/json'
        }
      });
      if (!resp.ok) {
        const txt = await resp.text();
        setPullError(txt || `Pull failed (${resp.status})`);
      } else {
        const pullData = await resp.json();
        setPullResult(pullData);

        // Update records with non-blank fields from Intelliflo
        if (pullData?.data && selectedClient?.client_id && team?.id) {
          const d = pullData.data;
          const clientUpdates: Record<string, any> = {};
          const identityUpdates: Record<string, any> = {};

          // Client name (only field not synced via identity)
          if (d.full_name && d.full_name.trim()) clientUpdates.name = d.full_name.trim();

          // All address/contact fields go to identity (will auto-sync to clients table)
          if (d.contacts?.email && d.contacts.email.trim()) identityUpdates.email = d.contacts.email.trim();
          if (d.contacts?.mobile && d.contacts.mobile.trim()) identityUpdates.mobile = d.contacts.mobile.trim();
          if (d.contacts?.landline && d.contacts.landline.trim()) identityUpdates.landline = d.contacts.landline.trim();
          if ((d.addr?.address1 && d.addr.address1.trim()) || (d.addr?.address2 && d.addr.address2.trim())) {
            if (d.addr.address1) identityUpdates.address1 = d.addr.address1.trim();
            if (d.addr.address2) identityUpdates.address2 = d.addr.address2.trim();
          }
          if (d.addr?.city && d.addr.city.trim()) identityUpdates.city = d.addr.city.trim();
          if (d.addr?.postcode && d.addr.postcode.trim()) identityUpdates.postcode = d.addr.postcode.trim();

          // Identity-specific fields
          if (d.date_of_birth && d.date_of_birth.trim()) identityUpdates.date_of_birth = d.date_of_birth.trim();
          if (d.gender && d.gender.trim()) {
            const g = d.gender.toLowerCase();
            if (['male', 'female', 'other', 'undisclosed'].includes(g)) identityUpdates.gender = g;
          }
          if (d.ni_number && d.ni_number.trim()) identityUpdates.n_i_number = d.ni_number.trim();

          // Update client name if needed
          if (Object.keys(clientUpdates).length > 0) {
            const clientResp = await fetch(`/api/clients/${selectedClient.client_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(clientUpdates)
            });
            if (clientResp.ok) {
              const updated = await clientResp.json();
              setSelectedClient(updated);
            }
          }

          // Save to identity (will auto-sync address/contact fields to clients table)
          if (Object.keys(identityUpdates).length > 0) {
            const current = await loadIdentity<any>(team.id, selectedClient.client_id).catch(() => ({}));
            const merged = { ...current, ...identityUpdates };
            const transport = toIdentityModel(merged);
            await saveIdentity(team.id, selectedClient.client_id, transport);

            // Refresh selectedClient to get synced address/contact fields
            const refreshResp = await fetch(`/api/clients/${selectedClient.client_id}`);
            if (refreshResp.ok) {
              const refreshed = await refreshResp.json();
              setSelectedClient(refreshed);
            }
          }
        }
      }
    } catch (e: any) {
      setPullError(e.message || 'Pull data failed');
    } finally {
      setPullLoading(false);
    }
  };

  const createClient = async () => {
    setCreateLoading(true);
    setPushError(null);
    setPushSuccess(false);
    try {
      if (!selectedClient?.client_id) {
        setPushError('No client selected.');
        setCreateLoading(false);
        return;
      }
      if (!team?.id) {
        setPushError('No team context available.');
        setCreateLoading(false);
        return;
      }

      // Get current user ID
      const userResponse = await fetch('/api/user');
      if (!userResponse.ok) {
        setPushError('Failed to get user information');
        setCreateLoading(false);
        return;
      }
      const userData = await userResponse.json();

      // Load identity data
      const identity: any = await loadIdentity<any>(team.id, selectedClient.client_id).catch(() => ({}));

      // Format data with empty id for creation
      // Address/contact fields from clients table, identity-specific fields from blob
      const payload = {
        id: '',
        full_name: selectedClient.name || '',
        date_of_birth: identity.date_of_birth || '',
        ni_number: identity.n_i_number || '',
        gender: identity.gender ? (identity.gender.charAt(0).toUpperCase() + identity.gender.slice(1)) : '',
        addr: {
          address1: selectedClient.address1 || '',
          address2: selectedClient.address2 || '',
          city: selectedClient?.city || '',
          postcode: selectedClient.postcode || ''
        },
        contacts: {
          mobile: selectedClient.mobile || '',
          landline: selectedClient.landline || '',
          email: selectedClient.email || ''
        }
      };

      const url = `/api/intelliflo/create?user_id=${userData.id}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const txt = await resp.text();
        setPushError(txt || `Create failed (${resp.status})`);
      } else {
        const data = await resp.json();
        // If creation successful and we get back client_id, link it to our client
        if (data && data.status === 'OK' && data.client_id) {
          const intellifloId = data.client_id;
          const linkResp = await fetch(`/api/clients/${selectedClient.client_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ back_end: 'intelliflo', back_end_id: String(intellifloId) })
          });
          if (linkResp.ok) {
            const updated = await linkResp.json();
            setSelectedClient(updated);
          }
        }
        setPushSuccess(true);
        setTimeout(() => setPushSuccess(false), 3000);
      }
    } catch (e: any) {
      setPushError(e.message || 'Create client failed');
    } finally {
      setCreateLoading(false);
    }
  };

  const deleteClient = async () => {
    if (!confirm('Are you sure you want to delete this client from Intelliflo? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    setPushError(null);
    setPushSuccess(false);
    try {
      if (!selectedClient?.back_end_id) {
        setPushError('No Intelliflo ID linked to this client.');
        setDeleteLoading(false);
        return;
      }

      // Get current user ID
      const userResponse = await fetch('/api/user');
      if (!userResponse.ok) {
        setPushError('Failed to get user information');
        setDeleteLoading(false);
        return;
      }
      const userData = await userResponse.json();

      const url = `/api/intelliflo/delete?client_id=${encodeURIComponent(selectedClient.back_end_id)}&user_id=${userData.id}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!resp.ok) {
        const txt = await resp.text();
        setPushError(txt || `Delete failed (${resp.status})`);
      } else {
        // Unlink the client locally
        if (selectedClient?.client_id) {
          const linkResp = await fetch(`/api/clients/${selectedClient.client_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ back_end: null, back_end_id: null })
          });
          if (linkResp.ok) {
            const updated = await linkResp.json();
            setSelectedClient(updated);
          }
        }
        setPushSuccess(true);
        setTimeout(() => setPushSuccess(false), 3000);
      }
    } catch (e: any) {
      setPushError(e.message || 'Delete client failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const pushData = async () => {
    setPushLoading(true);
    setPushError(null);
    setPushSuccess(false);
    try {
      if (!selectedClient?.client_id || !selectedClient?.back_end_id) {
        setPushError('No client selected or Intelliflo ID linked.');
        setPushLoading(false);
        return;
      }
      if (!team?.id) {
        setPushError('No team context available.');
        setPushLoading(false);
        return;
      }

      // Get current user ID
      const userResponse = await fetch('/api/user');
      if (!userResponse.ok) {
        setPushError('Failed to get user information');
        setPushLoading(false);
        return;
      }
      const userData = await userResponse.json();

      // Load identity data
      const identity: any = await loadIdentity<any>(team.id, selectedClient.client_id).catch(() => ({}));

      // Format data without wrapping in "data" field
      // Address/contact fields from clients table, identity-specific fields from blob
      const payload = {
        id: selectedClient.back_end_id,
        full_name: selectedClient.name || '',
        date_of_birth: identity.date_of_birth || '',
        ni_number: identity.n_i_number || '',
        gender: identity.gender ? (identity.gender.charAt(0).toUpperCase() + identity.gender.slice(1)) : '',
        addr: {
          address1: selectedClient.address1 || '',
          address2: selectedClient.address2 || '',
          city: selectedClient.city || '',
          postcode: selectedClient.postcode || ''
        },
        contacts: {
          mobile: selectedClient.mobile || '',
          landline: selectedClient.landline || '',
          email: selectedClient.email || ''
        }
      };

      const url = `/api/intelliflo/push?user_id=${userData.id}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const txt = await resp.text();
        setPushError(txt || `Push failed (${resp.status})`);
      } else {
        setPushSuccess(true);
        setTimeout(() => setPushSuccess(false), 3000);
      }
    } catch (e: any) {
      setPushError(e.message || 'Push data failed');
    } finally {
      setPushLoading(false);
    }
  };

  const checkBackendStatus = async () => {
    try {
      // Get current user ID
      const userResponse = await fetch('/api/user');
      if (!userResponse.ok) {
        console.error('Failed to get user information');
        return;
      }
      const userData = await userResponse.json();

      const resp = await fetch(`/api/intelliflo/status?user_id=${userData.id}`);
      if (resp.ok) {
        const data = await resp.json();
        setBackendLoggedIn(data.logged_in || false);
      } else {
        setBackendLoggedIn(false);
      }
    } catch (e: any) {
      console.error('Failed to check backend status:', e.message);
      setBackendLoggedIn(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      // Get current user ID
      const userResponse = await fetch('/api/user');
      if (!userResponse.ok) {
        console.error('Failed to get user information');
        return;
      }
      const userData = await userResponse.json();

      const resp = await fetch(`/api/intelliflo/logout?user_id=${userData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (resp.ok) {
        const data = await resp.json();
        console.log('Logout response:', data);

        // Clear session storage
        sessionStorage.removeItem('intellifloIdToken');
        sessionStorage.removeItem('intellifloAuthData');

        // Redirect to Intelliflo logout URL to clear cookies
        // The Intelliflo logout page should redirect back to /logged-out automatically
        if (data.logout_url) {
          window.location.href = data.logout_url;
        } else {
          // Fallback: redirect directly to logged-out page
          window.location.href = '/logged-out';
        }
      } else {
        const txt = await resp.text();
        console.error('Logout failed:', txt);
      }
    } catch (e: any) {
      console.error('Logout error:', e.message);
    } finally {
      setLogoutLoading(false);
    }
  };  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Intelliflo</h1>

      {/* Client Linking Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Client Linking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-3">
            <div className="flex gap-2 items-center">
              <Button
                onClick={connectToIntelliflo}
                variant="outline"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Login
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                disabled={logoutLoading || !backendLoggedIn}
              >
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </Button>
            </div>
            {backendLoggedIn !== null && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${backendLoggedIn ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-medium ${backendLoggedIn ? 'text-green-600' : 'text-gray-600'}`}>
                  Backend Status: {backendLoggedIn ? 'Logged In' : 'Not Logged In'}
                </span>
              </div>
            )}
          </div>
          {!selectedClient ? (
            <p className="text-muted-foreground">Select a client to link with Intelliflo.</p>
          ) : (
            <div className="space-y-3">
              <p className="font-medium">{selectedClient.name}</p>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => findClient()}
                  disabled={findLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {findLoading ? 'Searching...' : 'Link Client'}
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  onClick={createClient}
                  variant="outline"
                  disabled={!selectedClient?.client_id || !!selectedClient?.back_end_id || createLoading}
                  title={selectedClient?.back_end_id ? 'Client already linked to Intelliflo' : 'Create new client in Intelliflo'}
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  onClick={pushData}
                  variant="outline"
                  disabled={pushLoading || !selectedClient?.back_end_id}
                  title={!selectedClient?.back_end_id ? 'Link a client to Intelliflo first' : 'Push data to Intelliflo'}
                >
                  {pushLoading ? 'Pushing...' : 'Push'}
                </Button>
                <Button
                  onClick={pullData}
                  variant="outline"
                  disabled={pullLoading || !selectedClient?.back_end_id}
                  title={!selectedClient?.back_end_id ? 'Link a client to Intelliflo first' : 'Pull data from Intelliflo'}
                >
                  {pullLoading ? 'Pulling...' : 'Pull'}
                </Button>
                <Button
                  onClick={deleteClient}
                  variant="outline"
                  disabled={deleteLoading || !selectedClient?.back_end_id}
                  title={!selectedClient?.back_end_id ? 'Link a client to Intelliflo first' : 'Delete client from Intelliflo'}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {selectedClient.back_end === 'intelliflo' && selectedClient.back_end_id ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 font-medium">
                      Linked (ID: {selectedClient.back_end_id})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Not Linked</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>



      {pushSuccess && (
        <Card className="mb-6 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-600">Push Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600">Data pushed to Intelliflo successfully.</p>
          </CardContent>
        </Card>
      )}

      {pushError && (
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Push Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{pushError}</p>
          </CardContent>
        </Card>
      )}

      {findResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Find Client Result ({selectedClient?.name})</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(findResult?.data) ? (
              <ul className="space-y-2">
                {(findResult.data as any[]).map((item, idx) => {
                  const isSelected = selectedFound?.iid === item.iid;
                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        onClick={() => setSelectedFound({ full_name: item.full_name, iid: item.iid })}
                        className={`w-full text-left px-3 py-2 rounded border transition-colors text-sm ${
                          isSelected
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="font-medium">{item.full_name}</span>
                        <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">iid: {item.iid}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-64 text-xs">
{JSON.stringify(findResult, null, 2)}
              </pre>
            )}
            {selectedFound && (
              <div className="mt-4 space-y-2">
                <div className="text-xs text-green-700 dark:text-green-300">
                  Selected: {selectedFound.full_name} (iid {selectedFound.iid})
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={saveBackendLink}
                    disabled={linkSaving || !selectedClient}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {linkSaving ? 'Saving...' : 'Save Link'}
                  </Button>
                  {!selectedClient && (
                    <span className="text-xs text-gray-600">Select a local client first.</span>
                  )}
                  {linkSuccess && (
                    <span className="text-xs text-green-600">Linked successfully.</span>
                  )}
                  {linkError && (
                    <span className="text-xs text-red-600">{linkError}</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {findError && (
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Find Client Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 text-sm">{findError}</p>
          </CardContent>
        </Card>
      )}
      {pullResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Pull Data Result ({selectedClient?.name})</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(pullResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
      {pullError && (
        <Card className="mt-6 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Pull Data Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 text-sm">{pullError}</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
