const Database = require('./utils/database');

const getOverview = async (event) => {
  const {id} = event.queryStringParameters;

  if (!id) {
    return {statusCode: 400, body: 'id parameter is missing'};
  }

  let result;
  try {
    result = await Database.getNodeOverview(parseInt(id))
  } catch (error) {
    console.error(error);
    return {statusCode: 500, body: JSON.stringify(error)};
  }
  
  return {statusCode: 200,
    body: JSON.stringify(result, null, 2)};
}

exports.handler = async (event, _context) => {
  if (event.httpMethod === "GET") {
    return getOverview(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}