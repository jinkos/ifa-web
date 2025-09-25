"use client";
import { useState } from 'react';
import { useSelectedClient } from '../SelectedClientContext';
import { useTeam } from '../TeamContext';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { askRag } from '@/lib/rag/askRag';

export default function ChatPage() {
  const { selectedClient } = useSelectedClient();
  const { team } = useTeam();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAsk(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!question.trim()) return;
    if (!team?.id || !selectedClient?.client_id) {
      setError('Select a client first.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await askRag({
        team_id: Number(team.id),
        client_id: Number(selectedClient.client_id),
        question: question.trim(),
      });
      setAnswer((prev) => (prev ? prev + "\n\n" : "") + `Q: ${question.trim()}` + "\nA: " + (res.answer ?? ''));
      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Failed to ask');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold mb-2">Chat</h1>
      <div className="mb-4 text-lg font-medium">
        {selectedClient ? selectedClient.name : 'No Client Selected'}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block mb-1 text-sm text-muted-foreground">Answer</label>
          <Textarea value={answer} readOnly placeholder="Server answers will appear here" />
        </div>

        <form onSubmit={onAsk} className="flex items-center gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question…"
            disabled={submitting}
          />
          <Button type="submit" disabled={submitting || !question.trim()}>
            {submitting ? 'Sending…' : 'Send'}
          </Button>
        </form>

        {error && (
          <div className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
