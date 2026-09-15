import { resolveOperator } from '../utils/operator';
import { defineEventHandler, readBody, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  if (event.method !== 'PUT') {
    return sendError(event, createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }));
  }
  const body = await readBody(event);

  try {
    const operator = await resolveOperator(body);
    if (!operator) {
      return sendError(event, createError({ statusCode: 400, statusMessage: 'eth_address or sol_address required' }));
    }
    return operator.id;
  } catch (error) {
    console.error(error);
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }
});