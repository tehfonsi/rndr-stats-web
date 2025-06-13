import { defineEventHandler, readBody, setResponseStatus } from 'h3';
import hash from '../../utils/hash'; // Adjusted path
import { setOperator } from '../../utils/database'; // Adjusted path

export default defineEventHandler(async (event) => {
  // Nuxt 3 automatically maps .put.js to PUT requests.
  // Original code checked event.httpMethod === "PUT".

  try {
    const { eth_address } = await readBody(event);

    if (!eth_address) {
      setResponseStatus(event, 400);
      return { error: 'eth_address is missing from the request body.' };
    }

    const id = hash(eth_address); // Assuming hash function is ESM default export

    const operator = {
      id,
      eth_address
    };

    await setOperator(operator);
    setResponseStatus(event, 200); // OK or 201 Created could also be appropriate
    // The original returned the ID in the body.
    return { success: true, operator_id: id };
  } catch (error) {
    console.error('Error in operator.put.js:', error);
    setResponseStatus(event, 500);
    return { error: error.message || 'Internal Server Error' };
  }
});
