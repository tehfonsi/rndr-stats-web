import { sha256 } from 'js-sha256';
import { getPasswords, updateName } from '../utils/database';
import { defineEventHandler, readBody, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    return sendError(event, createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }));
  }
  let { node_id, name, password } = await readBody(event);
  password = sha256(password);

  let savedPasswords;
  try {
    savedPasswords = (await getPasswords(node_id)).map((row) => row.password);
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }

  const correctPassword = savedPasswords.map((p) => p !== null && p === password).reduce((p, c) => p && c);

  if (!correctPassword) {
    await new Promise(r => setTimeout(r, 1000));
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