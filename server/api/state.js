import { addState } from '../utils/database';
import { defineEventHandler, readBody, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    return sendError(event, createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }));
  }
  const body = await readBody(event);
  const { type, node_id } = body;

  const state = {
    type,
    node_id
  };

  try {
    await addState(state);
  } catch (err) {
    console.error(err);
    return sendError(event, createError({ statusCode: 500, statusMessage: err.message }));
  }
});