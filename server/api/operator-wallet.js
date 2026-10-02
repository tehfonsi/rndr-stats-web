import { getOperatorPasswords, getRewardWallet, setRewardWallet } from '../utils/database';
import { passwordMatches, wrongPasswordDelay } from '../utils/password';
import { isSolanaAddress } from '../utils/solana';
import { defineEventHandler, getQuery, readBody, sendError, createError } from 'h3';

// GET ?id= returns the Solana wallet that receives the operator's rewards,
// PUT { operator_id, wallet, password } saves it (empty wallet clears it)
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const id = parseInt(getQuery(event).id);
    if (!id) {
      return sendError(event, createError({ statusCode: 400, statusMessage: 'id parameter is missing' }));
    }
    try {
      return { wallet: await getRewardWallet(id) };
    } catch (error) {
      console.error(error);
      return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
    }
  }

  if (event.method !== 'PUT') {
    return sendError(event, createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }));
  }

  const { operator_id, wallet, password } = await readBody(event);
  const id = parseInt(operator_id);
  if (!id) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'operator_id is missing' }));
  }
  if (wallet && !isSolanaAddress(wallet)) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'invalid solana address' }));
  }

  try {
    if (!passwordMatches(await getOperatorPasswords(id), password)) {
      await wrongPasswordDelay();
      console.warn('Wrong password');
      return sendError(event, createError({ statusCode: 403, statusMessage: 'Password does not match' }));
    }
    const result = await setRewardWallet(id, wallet || null);
    if (!result.affectedRows) {
      return sendError(event, createError({ statusCode: 404, statusMessage: 'Operator not found' }));
    }
    return { wallet: wallet || null };
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }
});
