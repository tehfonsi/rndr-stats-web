import { getPasswords, updateName } from '../utils/database';
import { passwordMatches, wrongPasswordDelay } from '../utils/password';
import { defineEventHandler, readBody, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    return sendError(event, createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }));
  }
  const { node_id, name, password } = await readBody(event);

  let savedPasswords;
  try {
    savedPasswords = await getPasswords(node_id);
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }

  if (!passwordMatches(savedPasswords, password)) {
    await wrongPasswordDelay();
    console.warn('Wrong password');
    return sendError(event, createError({ statusCode: 403, statusMessage: 'Password does not match' }));
  }

  try {
    await updateName(node_id, name);
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }
});
