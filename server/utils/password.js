import { sha256 } from 'js-sha256';

/**
 * Operator changes (node names, reward wallet) need the password set in the watchdog .ini.
 * It has to match the password of every node of the operator that reported in the last month.
 *
 * @param {{password: string|null}[]} rows saved password hashes of the operator's nodes
 * @param {string} password plain password entered by the user
 */
export const passwordMatches = (rows, password) => {
  if (!password || !rows.length) return false;
  const hash = sha256(password);
  return rows.every((row) => row.password !== null && row.password === hash);
};

// slow down guessing
export const wrongPasswordDelay = () => new Promise((r) => setTimeout(r, 1000));
