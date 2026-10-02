import { getRenderPayouts, isSolanaAddress, PAYOUT_SOURCES } from '../utils/solana';
import { getRenderUsdPrices } from '../utils/price';
import { defineEventHandler, getQuery, sendError, createError } from 'h3';

const DAY = 24 * 60 * 60;
const MAX_DAYS = 365;
const CACHE_TTL = 10 * 60 * 1000;
const CACHE = new Map();

export default defineEventHandler(async (event) => {
  // `after` (unix seconds) only returns payouts newer than that, for incremental updates of a client cache
  const { address, days, after } = getQuery(event);

  if (!isSolanaAddress(address)) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'invalid solana address' }));
  }
  const range = Math.min(MAX_DAYS, Math.max(1, parseInt(days) || 84));

  const afterTs = parseInt(after) || 0;
  const key = `${address}:${range}:${afterTs}`;
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.created < CACHE_TTL) {
    return cached.data;
  }

  const end = Math.floor(Date.now() / 1000);
  const start = Math.max(end - range * DAY, afterTs + 1);
  try {
    const { solanaRpcUrl } = useRuntimeConfig();
    const payouts = await getRenderPayouts(solanaRpcUrl, address, start);
    let prices = [];
    try {
      prices = await getRenderUsdPrices(payouts.map((p) => p.time));
    } catch (error) {
      // income in RENDER is still useful without USD values
      console.error(error);
    }
    payouts.forEach((p, i) => {
      p.usd = prices[i] != null ? p.amount * prices[i] : null;
    });
    const data = { address, start, end, sources: PAYOUT_SOURCES, payouts };
    if (CACHE.size > 1000) CACHE.clear();
    CACHE.set(key, { created: Date.now(), data });
    return data;
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 502, statusMessage: error.message }));
  }
});
