const hash = require('./utils/hash');
const Database = require('../functions/utils/database');

const newNode = async (event) => {
  const {eth_address, node_id, score, previews_sent, jobs_completet, thumbnails_sent, gpus, password} = JSON.parse(event.body);
  const operator_id = hash(eth_address);

  const node = {
    id: node_id,
    score: parseInt(score),
    previews_sent: parseInt(previews_sent),
    jobs_completed: parseInt(jobs_completet),
    thumbnails_sent: parseInt(thumbnails_sent),
    gpus,
    operator: operator_id,
    password
  };

  try {
    await Database.setNode(node)
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

exports.handler = async (event, _context) => {
  if (event.httpMethod === "PUT") {
    return newNode(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}