const RENDER_MINT = 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof';

// Render Network accounts that send node reward payouts; only transfers from these count as income.
// rnoK… = render rewards (weekly emission pot split by work), rav3… = availability rewards
export const PAYOUT_SOURCES = [
  'rav3GKV8KXg4AvswaqT9HWJ4ErxU5csUwTKj549aHUH',
  'rnoKwRkj6kvrm7Zhn9qqE9tKKcsh8y66bdc9JuCvAT9',
];

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const isSolanaAddress = (address) => BASE58.test(address || '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const rpc = async (url, method, params, attempt = 0) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (res.status === 429 && attempt < 7) {
    await sleep(Math.min(16000, 1000 * 2 ** attempt));
    return rpc(url, method, params, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`Solana RPC ${method} failed: ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`Solana RPC ${method} failed: ${json.error.message}`);
  }
  return json.result;
};

// transactions are immutable, so the parsed payout of a signature can be cached forever
const PAYOUT_CACHE = new Map();

const parsePayout = (tx, owner) => {
  if (!tx || tx.meta?.err) return null;

  const pre = tx.meta.preTokenBalances || [];
  const post = tx.meta.postTokenBalances || [];
  const indexes = new Set([...pre, ...post].filter((b) => b.mint === RENDER_MINT).map((b) => b.accountIndex));
  const amount = (list, index) => Number(list.find((b) => b.accountIndex === index)?.uiTokenAmount.amount || 0);
  const decimals = [...pre, ...post].find((b) => b.mint === RENDER_MINT)?.uiTokenAmount.decimals ?? 8;

  let received = 0;
  let source = null;
  indexes.forEach((index) => {
    const balance = post.find((b) => b.accountIndex === index) || pre.find((b) => b.accountIndex === index);
    const delta = amount(post, index) - amount(pre, index);
    if (balance.owner === owner && delta > 0) received += delta;
    if (delta < 0 && PAYOUT_SOURCES.includes(balance.owner)) source = balance.owner;
  });
  return source && received > 0 ? { source, amount: received / 10 ** decimals } : null;
};

const fetchPayout = async (url, signature, owner) => {
  const key = `${owner}:${signature}`;
  if (!PAYOUT_CACHE.has(key)) {
    const tx = await rpc(url, 'getTransaction', [
      signature,
      { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0, commitment: 'finalized' },
    ]);
    // the RPC sometimes returns null for a transaction it has not indexed yet, don't remember that
    if (!tx) return null;
    if (PAYOUT_CACHE.size > 50000) PAYOUT_CACHE.clear();
    PAYOUT_CACHE.set(key, parsePayout(tx, owner));
  }
  return PAYOUT_CACHE.get(key);
};

const signaturesSince = async (url, account, since) => {
  const result = [];
  let before;
  for (;;) {
    const page = await rpc(url, 'getSignaturesForAddress', [
      account,
      { limit: 1000, before, commitment: 'finalized' },
    ]);
    for (const s of page) {
      if (s.blockTime < since) return result;
      if (!s.err) result.push(s);
    }
    if (page.length < 1000) return result;
    before = page[page.length - 1].signature;
  }
};

/**
 * RENDER reward payouts received by `owner` since `since` (unix seconds), newest first.
 * @returns {Promise<{signature: string, time: number, source: string, amount: number}[]>}
 */
export const getRenderPayouts = async (url, owner, since) => {
  const accounts = await rpc(url, 'getTokenAccountsByOwner', [
    owner,
    { mint: RENDER_MINT },
    { encoding: 'jsonParsed' },
  ]);

  const signatures = new Map();
  for (const { pubkey } of accounts.value) {
    (await signaturesSince(url, pubkey, since)).forEach((s) => signatures.set(s.signature, s));
  }

  // small concurrency, the public RPC rate limits getTransaction hard
  const queue = [...signatures.values()];
  const payouts = [];
  const worker = async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const payout = await fetchPayout(url, s.signature, owner);
      if (payout) payouts.push({ signature: s.signature, time: s.blockTime, ...payout });
    }
  };
  await Promise.all([worker(), worker()]);

  return payouts.sort((a, b) => b.time - a.time);
};
