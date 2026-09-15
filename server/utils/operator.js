import hash from './hash';
import { findOperatorBySol, mergeOperator, setOperator } from './database';

// SOLANAWALLETADDRESS from the RNDR client registry is an obfuscated hex string:
// [24 hex machine-specific prefix][stable wallet part][32 hex machine-specific suffix]
// Only the middle part is identical across machines with the same wallet.
const solIdentity = (raw) => raw.length > 56 ? raw.slice(24, -32) : raw;

/**
 * Resolves the operator for a watchdog request and upserts the operators row.
 * eth_address is the primary identity (existing ids stay stable), sol_address is the fallback.
 *
 * @returns {Promise<{id: number, eth_address: string|null, sol_address: string|null}|null>} null if no address was given
 */
export const resolveOperator = async ({ eth_address, sol_address }) => {
  const eth = (eth_address || '').trim();
  const sol = sol_address ? solIdentity(sol_address.trim()) : '';
  if (!eth && !sol) {
    return null;
  }

  if (eth) {
    const id = hash(eth);
    if (sol) {
      // a sol-only node may have registered earlier under hash(sol): fold it into the ETH operator
      const existing = await findOperatorBySol(sol);
      if (existing && existing.id !== id && !existing.eth_address) {
        await mergeOperator(existing.id, id);
      }
    }
    const operator = { id, eth_address: eth, sol_address: sol || null };
    await setOperator(operator);
    return operator;
  }

  // sol only: reuse an operator already known by this wallet (ETH-based or not)
  const existing = await findOperatorBySol(sol);
  if (existing) {
    return existing;
  }
  const operator = { id: hash(sol), eth_address: null, sol_address: sol };
  await setOperator(operator);
  return operator;
};
