const DAY = 24 * 60 * 60 * 1000;
const CACHE_TTL = 60 * 60 * 1000;
let CACHE = null;

// daily RENDER/USD closes as [{ start: ms, close: number }], oldest first
const fromBinance = async (days) => {
  const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=RENDERUSDT&interval=1d&limit=${days}`);
  if (!res.ok) throw new Error(`Binance price request failed: ${res.status}`);
  const rows = await res.json();
  return rows.map((k) => ({ start: k[0], close: parseFloat(k[4]) }));
};

const fromCoingecko = async (days) => {
  const res = await fetch(`https://api.coingecko.com/api/v3/coins/render-token/market_chart?vs_currency=usd&days=${days}&interval=daily`);
  if (!res.ok) throw new Error(`CoinGecko price request failed: ${res.status}`);
  const { prices } = await res.json();
  return prices.map(([t, price]) => ({ start: Math.floor(t / DAY) * DAY, close: price }));
};

const getDailyPrices = async () => {
  if (CACHE && Date.now() - CACHE.created < CACHE_TTL) return CACHE.prices;
  let prices;
  try {
    prices = await fromBinance(366);
  } catch (error) {
    console.error(error);
    prices = await fromCoingecko(365);
  }
  CACHE = { created: Date.now(), prices };
  return prices;
};

/**
 * USD price of RENDER on the day of each timestamp (unix seconds); the current day uses the latest price.
 * @returns {Promise<(number|null)[]>}
 */
export const getRenderUsdPrices = async (times) => {
  const prices = await getDailyPrices();
  return times.map((t) => {
    const ms = t * 1000;
    const day = prices.find((p) => p.start <= ms && ms < p.start + DAY);
    return day ? day.close : null;
  });
};
