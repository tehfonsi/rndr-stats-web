import { getOperatorPackage, getNodeOverview } from './utils/database.js';

const getOverview = async (event) => {
  const {id} = event.queryStringParameters;

  if (!id) {
    return {statusCode: 400, body: 'id parameter is missing'};
  }

  const operatorId = parseInt(id);

  let result;
  try {
    result = await Promise.all([getOperatorPackage(operatorId), getNodeOverview(operatorId)]);
  } catch (error) {
    console.error(error);
    return {statusCode: 500, body: JSON.stringify(error)};
  }

  const pckg = result[0];
  const nodes = result[1];

  if (!pckg.length) {
    nodes.forEach((node) => {
      delete node.updated;
    })
  }
  
  return {statusCode: 200,
    body: JSON.stringify(nodes, null, 2)};
}

export async function handler(event, _context) {
  if (event.httpMethod === "GET") {
    return getOverview(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}