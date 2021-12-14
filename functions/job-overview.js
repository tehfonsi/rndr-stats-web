const Database = require('./utils/database');

const getOverview = async (event) => {
  let {id, start, end} = event.queryStringParameters;

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

  if (!id) {
    return {statusCode: 400, body: 'id parameter is missing'};
  }

  let result;
  try {
    result = await Database.getJobOverview(parseInt(id), start, end)
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