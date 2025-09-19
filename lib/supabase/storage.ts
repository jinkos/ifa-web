import { getBrowserClient } from './client.browser';

/**
 * Upload a file to the ifa_docs bucket at the given path (team_id/client_id/filename)
 */
export async function uploadDocument({
  file,
  teamId,
  clientId,
  onProgress
}: {
  file: File;
  teamId: string;
  clientId: string;
  onProgress?: (percent: number) => void;
}) {
  const path = `${teamId}/${clientId}/${file.name}`;
  // Supabase JS v2 does not support progress natively, so onProgress is a placeholder for future use
  const supabase = getBrowserClient();
  const { data, error } = await supabase.storage.from('ifa_docs').upload(path, file, {
    upsert: true
  });
  if (error) throw error;
  return data;
}

/**
 * List all files for a client in the ifa_docs bucket
 */
export async function listDocuments({
  teamId,
  clientId
}: {
  teamId: string;
  clientId: string;
}) {
  const path = `${teamId}/${clientId}`;
  const supabase = getBrowserClient();
  const { data, error } = await supabase.storage.from('ifa_docs').list(path);
  if (error) throw error;
  return data;
}

/**
 * Get a public URL for a file in the ifa_docs bucket
 */
export function getDocumentUrl({
  teamId,
  clientId,
  filename
}: {
  teamId: string;
  clientId: string;
  filename: string;
}) {
  const path = `${teamId}/${clientId}/${filename}`;
  const supabase = getBrowserClient();
  return supabase.storage.from('ifa_docs').getPublicUrl(path).data.publicUrl;
}
