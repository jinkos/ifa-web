#!/usr/bin/env tsx
/**
 * Cleanup script: Remove all "Gary T" clients
 * Usage: npx tsx scripts/cleanup-gary.ts
 */

import { client, db } from '@/lib/db/drizzle';
import { clients } from '@/lib/db/schema';
import { eq, ilike } from 'drizzle-orm';

async function main() {
  console.log('🔍 Looking for "Gary T" clients...');
  
  const garyClients = await db
    .select()
    .from(clients)
    .where(ilike(clients.name, 'Gary T'));

  if (garyClients.length === 0) {
    console.log('✅ No "Gary T" clients found.');
    await client.end();
    return;
  }

  console.log(`Found ${garyClients.length} "Gary T" client(s):`);
  garyClients.forEach((c) => {
    console.log(`  - ID: ${c.client_id}, Name: ${c.name}, Email: ${c.email}`);
  });

  console.log('\n🗑️  Deleting...');
  for (const gary of garyClients) {
    await db.delete(clients).where(eq(clients.client_id, gary.client_id));
    console.log(`  ✓ Deleted client ${gary.client_id} (${gary.name})`);
  }

  console.log('\n✨ Cleanup complete!');
  
  // Close database connection
  await client.end();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
