import { getLatestTransactions } from '../utils/polygonscan.js';
import { defineEventHandler, getQuery, sendError, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);

  // if (!id) {
  //   return sendError(event, createError({ statusCode: 400, statusMessage: 'id parameter is missing' }));
  // }

  const operatorId = parseInt(id);

  let transactions, blocks;
  try {
    transactions = await getLatestTransactions();
    blocks = transactions.result;
  } catch (error) {
    return sendError(event, createError({ statusCode: 500, statusMessage: error.message }));
  }

  if (!blocks || blocks.length === 0) {
    return send(event, { statusCode: 204, body: 'No transactions found' });
  }

  return blocks;
});