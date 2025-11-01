"use client";
import React, { useRef, useState } from 'react';
import { useShoppingList } from '@/components/shopping/ShoppingListContext';
import { useTeam } from '@/app/(dashboard)/dashboard/TeamContext';
import { useSelectedClient } from '@/app/(dashboard)/dashboard/SelectedClientContext';
// We intentionally send a minimal payload (no identity/balance) for composing emails

export default function ShoppingListTab() {
  const shopping = useShoppingList();
  const items = shopping.list();
  const { team } = useTeam();
  const { selectedClient, setSelectedClient } = useSelectedClient();
  const [emailBody, setEmailBody] = useState<string>("");
  const [toEmail, setToEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendStatus, setSendStatus] = useState<null | { sent?: boolean; message_id?: string | null; error?: string }>(null);
  const composingRef = useRef(false);

  if (!items.length) return <div className="p-4 text-sm text-muted-foreground">No items in your shopping list yet.</div>;

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-end">
        <button className="text-sm text-red-600" onClick={() => shopping.clear()}>Clear all</button>
      </div>
      {items.map((it) => (
        <div key={it.id} className="border rounded p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">{it.label}</div>
            <div className="text-sm text-muted-foreground">{it.section ?? ''}</div>
          </div>
          <div className="flex gap-2">
            <button className="px-2 py-1 rounded border" onClick={() => shopping.remove(it.id)}>Remove</button>
          </div>
        </div>
      ))}
      <div className="pt-2 border-t mt-4">
        <button
          className="px-3 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
          disabled={!team?.id || !selectedClient?.client_id || !items.length || sending}
          onClick={async () => {
            if (!team?.id || !selectedClient?.client_id) return;
            if (composingRef.current) return; // hard guard against double-submit
            try {
              setSending(true);
              composingRef.current = true;
              // Preflight: ensure the selected client still exists; if not, clear selection and surface a clear error
              try {
                const verify = await fetch(`/api/clients/${selectedClient.client_id}`, { cache: 'no-store' });
                if (!verify.ok) {
                  setSelectedClient(null);
                  throw new Error('Selected client not found. Please choose a client again.');
                }
              } catch (e) {
                // Network or other failure verifying client
                if (e instanceof Error) throw e;
                throw new Error('Could not verify selected client. Please re-select and try again.');
              }
              // Minimal payload only: shopping list and ids
              const payload = {
                team_id: team.id,
                client_id: selectedClient.client_id,
                shopping_list: items,
              };
              const res = await fetch('/shopping/get_email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Compose-Mode': 'minimal' },
                body: JSON.stringify(payload),
              });
              if (!res.ok) {
                const raw = await res.text();
                let message = 'Failed to compose email';
                try {
                  const parsed = raw ? JSON.parse(raw) : {};
                  message = (parsed as any)?.error || message;
                } catch {
                  message = raw || message;
                }
                throw new Error(message);
              }
              const data: { email_body?: string; target_email?: string; subject?: string } = await res.json();
              setToEmail(data?.target_email ?? "");
              setEmailBody(data?.email_body ?? "");
              setSubject(data?.subject ?? "");
            } catch (e: any) {
              setToEmail("");
              setEmailBody(`Error: ${e?.message ?? 'Failed to compose email'}`);
              setSubject("");
            } finally {
              setSending(false);
              composingRef.current = false;
            }
          }}
        >
          {sending ? 'Composing…' : 'Compose Email'}
        </button>
        {emailBody ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="email-to">To:</label>
              <input
                id="email-to"
                type="email"
                className="flex-1 px-2 py-1 border rounded text-sm"
                value={toEmail}
                readOnly
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground" htmlFor="email-subject">Subject:</label>
              <input
                id="email-subject"
                type="text"
                className="flex-1 px-2 py-1 border rounded text-sm"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <textarea
              className="w-full p-2 border rounded font-mono text-sm"
              rows={20}
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <button
                className="px-3 py-2 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled={!team?.id || !selectedClient?.client_id || !toEmail || !subject || !emailBody || sendingEmail}
                onClick={async () => {
                  if (!team?.id || !selectedClient?.client_id) return;
                  setSendingEmail(true);
                  setSendStatus(null);
                  try {
                    const res = await fetch('/api/email/send_to_client', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        team_id: team.id,
                        client_id: selectedClient.client_id,
                        to_email: toEmail,
                        subject,
                        email_body: emailBody,
                      }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      throw new Error((data as any)?.error || 'Failed to send email');
                    }
                    setSendStatus({ sent: (data as any)?.sent, message_id: (data as any)?.message_id ?? null });
                  } catch (e: any) {
                    setSendStatus({ sent: false, error: e?.message || 'Failed to send email' });
                  } finally {
                    setSendingEmail(false);
                  }
                }}
              >
                {sendingEmail ? 'Sending…' : 'Send Email'}
              </button>
              {sendStatus?.sent && (
                <span className="text-sm text-green-700">
                  Sent ✓ {sendStatus.message_id ? `(id: ${sendStatus.message_id})` : ''}
                </span>
              )}
              {sendStatus?.error && (
                <span className="text-sm text-red-600">{sendStatus.error}</span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
