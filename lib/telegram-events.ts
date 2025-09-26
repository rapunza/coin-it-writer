import { sendTelegramMessage, sendTelegramPhoto } from "./telegram";

export type TelegramEventType =
  | "NEW_COIN"
  | "TRADING"
  | "BUY"
  | "SELL"
  | "NEW_MARKETCAP"
  | "NEW_CREATOR"
  | "TOP_CREATORS";

export interface TelegramEvent {
  type: TelegramEventType;
  data: any;
}

function shortAddr(addr: string) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
}

export async function notifyTelegramEvent(event: TelegramEvent) {
  switch (event.type) {
    case "NEW_COIN": {
      const {
        name,
        symbol,
        marketCap,
        totalSupply,
        creator,
        createdAt,
        contract,
        description,
        image,
        zoraUrl,
        baseScanUrl,
        dexScreenerUrl,
        price
      } = event.data;

      // Fallbacks for missing data
      const safeName = name || "N/A";
      const safeSymbol = symbol || "N/A";
      const safeMarketCap = marketCap !== undefined && marketCap !== null && marketCap !== "" ? marketCap : "N/A";
      const safeTotalSupply = totalSupply !== undefined && totalSupply !== null && totalSupply !== "" ? totalSupply : "N/A";
      const safePrice = price !== undefined && price !== null && price !== "" ? price : "N/A";
      const safeCreator = creator || "N/A";
      const safeCreatedAt = createdAt || "N/A";
      const safeContract = contract || "N/A";
      const safeDescription = description || "";

      // Only show links if present
      const links = [
        zoraUrl ? `<a href=\"${zoraUrl}\">View on Zora</a>` : null,
        baseScanUrl ? `<a href=\"${baseScanUrl}\">BaseScan</a>` : null,
        dexScreenerUrl ? `<a href=\"${dexScreenerUrl}\">DexScreener</a>` : null
      ].filter(Boolean).join(" | ");

      const msg = `🆕🪙 <b>NEW CREATOR COIN CREATED</b>\n\n` +
        `📛 ${safeName} (${safeSymbol})\n` +
        `💰 Market Cap: $${safeMarketCap}\n` +
        `💵 Price: $${safePrice}\n` +
        `📊 Total Supply: ${safeTotalSupply}\n` +
        `👤 <a href=\"https://zora.co/profile/${safeCreator}\">${shortAddr(safeCreator)}</a>\n` +
        `📅 Created: ${safeCreatedAt}\n` +
        `📄 Contract: ${shortAddr(safeContract)}\n` +
        (safeDescription ? `📝 ${safeDescription}\n` : "") +
        (links ? `\n🔗 ${links}` : "");

      if (image) {
        try {
          await sendTelegramPhoto(image, msg);
        } catch (err) {
          await sendTelegramMessage(msg + "\n\n[Image could not be loaded]");
        }
      } else {
        await sendTelegramMessage(msg);
      }
      break;
    }
    case "TRADING": {
      const { name, symbol, marketCap, volume24h, totalSupply, holders, creator, contract, createdAt, activityAt, zoraUrl, baseScanUrl, dexScreenerUrl } = event.data;
      const msg = `🔄📊 <b>TRADING ACTIVITY</b>\n\n📛 ${name} (${symbol})\n💰 Market Cap: $${marketCap}\n📊 24h Volume: $${volume24h}\n📊 Total Supply: ${totalSupply}\n👥 Holders: ${holders}\n👤 <a href=\"https://zora.co/profile/${creator}\">${shortAddr(creator)}</a>\n📄 Contract: ${shortAddr(contract)}\n📅 Created: ${createdAt}\n⏰ Activity: ${activityAt}\n\n🔗 <a href=\"${zoraUrl}\">View on Zora</a> | <a href=\"${baseScanUrl}\">BaseScan</a> | <a href=\"${dexScreenerUrl}\">DexScreener</a>`;
      await sendTelegramMessage(msg);
      break;
    }
    case "BUY":
    case "SELL": {
      const { name, symbol, marketCap, totalSupply, holders, creator, contract, createdAt, activityAt, zoraUrl, baseScanUrl, dexScreenerUrl } = event.data;
      const emoji = event.type === "BUY" ? "🟢💰 BUY ACTIVITY" : "🔴💸 SELL ACTIVITY";
      const msg = `${emoji}\n\n📛 ${name} (${symbol})\n💰 Market Cap: $${marketCap}\n📊 Total Supply: ${totalSupply}\n👥 Holders: ${holders}\n👤 <a href=\"https://zora.co/profile/${creator}\">${shortAddr(creator)}</a>\n📄 Contract: ${shortAddr(contract)}\n📅 Created: ${createdAt}\n⏰ Activity: ${activityAt}\n\n🔗 <a href=\"${zoraUrl}\">View on Zora</a> | <a href=\"${baseScanUrl}\">BaseScan</a> | <a href=\"${dexScreenerUrl}\">DexScreener</a>`;
      await sendTelegramMessage(msg);
      break;
    }
    case "NEW_MARKETCAP": {
      // Implement as needed
      break;
    }
    case "NEW_CREATOR": {
      // Implement as needed
      break;
    }
    case "TOP_CREATORS": {
      // Implement as needed
      break;
    }
    default:
      throw new Error("Unknown event type");
  }
}
