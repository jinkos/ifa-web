#!/usr/bin/env tsx
/**
 * List all clients in the database
 * Usage: npx tsx scripts/list-clients.ts
 */

import { client, db } from '@/lib/db/drizzle';
import { clients } from '@/lib/db/schema';

async function main() {
  console.log('📋 Listing all clients...\n');
  
  const allClients = await db
    .select()
    .from(clients)
    .orderBy(clients.name);

  if (allClients.length === 0) {
    console.log('No clients found.');
    await client.end();
    return;
  }

  console.log(`Found ${allClients.length} client(s):\n`);
  allClients.forEach((c) => {
    console.log(`ID: ${c.client_id}`);
    console.log(`Name: ${c.name || '(no name)'}`);
    console.log(`Email: ${c.email || '(no email)'}`);
    console.log(`Team ID: ${c.team_id}`);
    console.log(`Created: ${c.created_at}`);
    console.log('---');
  });

  await client.end();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
