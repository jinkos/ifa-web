
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { getTeamForUser } from '@/lib/db/queries';
import 'server-only';
import { ClientsTable } from './ClientsTable';
import type { Client } from '@/lib/types/client';
import { getServerClient } from '@/lib/supabase/client.server';

export default async function ClientsPage() {
  // Get the current user's team (server-side)
  const team = await getTeamForUser();
  if (!team?.id) {
    return <div className="p-4 text-red-500">Could not determine your team. Please reload the page.</div>;
  }
  // Get the clients for this team directly via Supabase (server-side)
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('team_id', team.id);
  if (error) {
    return <div className="p-4 text-red-500">Failed to fetch clients.</div>;
  }
  const clients = (data ?? []) as Client[];
  return (
    <section className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link href="/dashboard/clients/client_details/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white font-medium">Add Client</Button>
        </Link>
      </div>
      <ClientsTable clients={clients} />
    </section>
  );
}

