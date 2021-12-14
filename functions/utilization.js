const Database = require('./utils/database');

const getUtilizationOverview = async (event) => {
  let {start, end} = event.queryStringParameters;

  if (!start) {
    var d = new Date();
    d.setDate(d.getDate()-1);
    start = d.toISOString();
  } else {
    start = new Date(parseInt(start * 1000)).toISOString();
  }

  if (!end) {
    end = new Date().toISOString();
  } else {
    end = new Date(parseInt(end * 1000)).toISOString();
  }

  let result;
  try {
    result = await Database.getUtilizationOverview(start, end)
  } catch (error) {
    console.error(error);
    return {statusCode: 500, body: JSON.stringify(error)};
  }
  
  return {statusCode: 200, 
    headers: {'Cache-Control': 'public, s-maxage=3600'},
    body: JSON.stringify(result, null, 2)};
}

exports.handler = async (event, _context) => {
  if (event.httpMethod === "GET") {
    return getUtilizationOverview(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}