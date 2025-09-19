import { getBrowserClient } from './client.browser';

// Example: Fetch all clients for a team
export async function getClients(teamId: string) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('team_id', teamId);
  if (error) throw error;
  return data;
}

// Example: Fetch a single client by ID
export async function getClientById(clientId: string) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('client_id', clientId)
    .single();
  if (error) throw error;
  return data;
}

// Example: Create a new client
export async function createClient(client: any) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .single();
  if (error) throw error;
  return data;
}

// Example: Update a client
export async function updateClient(clientId: string, updates: any) {
  const supabase = getBrowserClient();
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('client_id', clientId)
    .single();
  if (error) throw error;
  return data;
}

// Example: Delete a client
export async function deleteClient(clientId: string) {
  const supabase = getBrowserClient();
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('client_id', clientId);
  if (error) throw error;
  return { success: true };
}
