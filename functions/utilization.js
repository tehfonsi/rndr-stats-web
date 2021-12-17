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
    result = await Database.getUtilizationForAllNodes(start, end)
  } catch (error) {
    console.error(error);
    return {statusCode: 500, body: JSON.stringify(error)};
  }

  const utilization = [
    {from: 0, to: 99, tier: 3, nodes: 0, utilization: 0.0},
    {from: 100, to: 199, tier: 3, nodes: 0, utilization: 0.0},
    {from: 200, to: 299, tier: 3, nodes: 0, utilization: 0.0},
    {from: 300, to: 999, tier: 2, nodes: 0, utilization: 0.0},
    {from: 1000, to: 1999, tier: 2, nodes: 0, utilization: 0.0},
    {from: 2000, to: 3999, tier: 2, nodes: 0, utilization: 0.0},
    {from: 4000, to: 9999, tier: 2, nodes: 0, utilization: 0.0},
  ];

  result.forEach((node) => {
    const object = utilization.find((u) => u.from <= node.score && node.score <= u.to);
    if (object) {
      object.nodes ++;
      object.utilization = (object.utilization + node.utilization) / 2;
    }
  });
  
  return {statusCode: 200, 
    headers: {'Cache-Control': 'public, s-maxage=3600'},
    body: JSON.stringify(utilization, null, 2)};
}

exports.handler = async (event, _context) => {
  if (event.httpMethod === "GET") {
    return getUtilizationOverview(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}