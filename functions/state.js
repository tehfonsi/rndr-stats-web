const Database = require('../functions/utils/database');

const newState = async (event) => {
  const {type, node_id} = JSON.parse(event.body);

  const state = {
    type,
    node_id
  };

  try {
      await Database.addState(state);
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify(err)
    };
  }
  
  return {
    statusCode: 200
  };
}

exports.handler = async (event, _context) => {
  if (event.httpMethod === "POST") {
    return newState(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}