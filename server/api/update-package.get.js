import { defineEventHandler, getQuery, setResponseStatus } from 'h3';
import { getLatestTransactions } from '../../utils/polygonscan.js'; // Adjusted path

export default defineEventHandler(async (event) => {
  // Nuxt 3 automatically maps .get.js to GET requests.
  const { id } = getQuery(event); // operatorId from original, though not used by getLatestTransactions

  // Original code had 'id' as a queryStringParameter but didn't strictly require it for getLatestTransactions.
  // If 'id' (operatorId) were to be used in the future with getLatestTransactions, validation would be needed.
  // For now, mimicking original behavior where 'id' is read but not critical for the current polygonscan call.

  // const operatorId = parseInt(id); // Parsed but not used in the core logic of getLatestTransactions
  // if (id && isNaN(operatorId)) { // Only validate if id is provided
  //   setResponseStatus(event, 400);
  //   return { error: 'id parameter must be a valid number if provided' };
  // }

  try {
    const transactions = await getLatestTransactions(); // This function fetches generic transactions as per its definition
    const blocks = transactions.result;

    if (!blocks || blocks.length === 0) {
      setResponseStatus(event, 204); // No Content
      return null; // Or { message: "No transactions found" }
    }

    setResponseStatus(event, 200);
    return blocks; // Directly return the blocks array
  } catch (error) {
    console.error('Error in update-package.get.js:', error);
    setResponseStatus(event, 500);
    return { error: error.message || 'Internal Server Error' };
  }
});
