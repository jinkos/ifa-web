"use client";
import { useSelectedClient } from '../SelectedClientContext';

export default function SummaryPage() {
  const { selectedClient } = useSelectedClient();
  return (
    <section className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold mb-2">Summary</h1>
      <div className="mb-4 text-lg font-medium">
        {selectedClient ? selectedClient.name : 'No Client Selected'}
      </div>
      <p className="text-muted-foreground">Summary section is coming soon.</p>
    </section>
  );
}
