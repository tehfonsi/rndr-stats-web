const hash = require('./utils/hash');
const Database = require('../functions/utils/database');

exports.handler = async (event, _context) => {
  if (event.httpMethod === "PUT") {
    const {eth_address} = JSON.parse(event.body);
    const id = hash(eth_address);

    const operator = {
      id,
      eth_address
    };

    try {
      await Database.setOperator(operator)
    } catch (error) {
      console.error(error);
      return {
        statusCode: 500,
        body: JSON.stringify(error)
      };
    }
    
    return {
      statusCode: 200
    };
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}