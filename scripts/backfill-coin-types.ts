// scripts/backfill-coin-types.ts
// Usage: npx ts-node scripts/backfill-coin-types.ts
// This script updates all coins in Supabase missing metadata.type, setting it to 'blog' or 'image' based on heuristics.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  // 1. Fetch all coins
  const { data: coins, error } = await supabase
    .from('coins')
    .select('id, metadata')
    .limit(1000); // adjust as needed

  if (error) {
    console.error('Error fetching coins:', error);
    process.exit(1);
  }

  let updated = 0;
  for (const coin of coins || []) {
    if (!coin.metadata || coin.metadata.type) continue;
    let type: string | null = null;
    // Heuristic: if metadata has image and no audio, assume image; else blog
    if (coin.metadata.image && !coin.metadata.audio) {
      type = 'image';
    } else {
      type = 'blog';
    }
    const newMetadata = { ...coin.metadata, type };
    const { error: updateError } = await supabase
      .from('coins')
      .update({ metadata: newMetadata })
      .eq('id', coin.id);
    if (updateError) {
      console.error(`Failed to update coin ${coin.id}:`, updateError);
    } else {
      updated++;
      console.log(`Updated coin ${coin.id} with type: ${type}`);
    }
  }
  console.log(`Backfill complete. Updated ${updated} coins.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
