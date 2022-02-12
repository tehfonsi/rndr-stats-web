import hash from './utils/hash';
import { setOperator } from '../functions/utils/database';

export async function handler(event, _context) {
  if (event.httpMethod === "PUT") {
    const {eth_address} = JSON.parse(event.body);
    const id = hash(eth_address);

    const operator = {
      id,
      eth_address
    };

    let result;
    try {
      result = await setOperator(operator)
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        body: JSON.stringify(error)
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(id)
    };
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}