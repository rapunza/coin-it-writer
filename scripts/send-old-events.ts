import 'dotenv/config';
import { getAllCoins } from '../lib/supabase-queries';
import { notifyTelegramEvent } from '../lib/telegram-events';

async function main() {
  const coins = await getAllCoins(1000, 0); // adjust limit as needed
  for (const coin of coins) {
    const meta = coin.metadata || {};
    await notifyTelegramEvent({
      type: 'NEW_COIN',
      data: {
        name: coin.name,
        symbol: coin.symbol,
        marketCap: meta.marketCap || '?',
        totalSupply: meta.totalSupply || '?',
        creator: coin.creator_wallet,
        createdAt: coin.created_at,
        contract: coin.coin_address,
        description: meta.description || '',
        image: meta.image || '',
        zoraUrl: meta.zoraUrl || '?',
        baseScanUrl: meta.baseScanUrl || '?',
        dexScreenerUrl: meta.dexScreenerUrl || '?',
      },
    });
    // Optional: add delay to avoid Telegram rate limits
    await new Promise((res) => setTimeout(res, 1000));
  }
  console.log('All old events sent!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
