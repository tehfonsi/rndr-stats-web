import hash from '../utils/hash';
import { setOperator } from '../utils/database';
import { defineEventHandler, readBody, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  if (event.method !== 'PUT') {
    return sendError(event, createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }));
  }
  const body = await readBody(event);
  const { eth_address } = body;
  const id = hash(eth_address);

  const operator = {
    id,
    eth_address
  };


  try {
    await setOperator(operator);
    return id;
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }
});