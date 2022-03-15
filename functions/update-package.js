import { getLatestTransactions } from './utils/polygonscan.js';

const updatePackages = async (event) => {
  const {id} = event.queryStringParameters;

  // if (!id) {
  //   return {statusCode: 400, body: 'id parameter is missing'};
  // }

  const operatorId = parseInt(id);

  const transactions = await getLatestTransactions();
  const blocks = transactions.result;

  if (!blocks || blocks.length === 0) {
  return { statusCode: 204, body: "No transactions found" };
  }
  
  return {statusCode: 200,
    body: JSON.stringify(blocks, null, 2)};
}

export async function handler(event, _context) {
  if (event.httpMethod === "GET") {
    return updatePackages(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}