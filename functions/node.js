const hash = require('./utils/hash');
const Database = require('../functions/utils/database');
const sha256 = require('js-sha256').sha256;

const newNode = async (event) => {
  let {eth_address, node_id, score, previews_sent, jobs_completet, thumbnails_sent, gpus, password} = JSON.parse(event.body);
  const operator_id = hash(eth_address);

  score = !!score ? parseInt(score) : 0;
  previews_sent = !!previews_sent ? parseInt(previews_sent) : 0;
  jobs_completet = !!jobs_completet ? parseInt(jobs_completet) : 0;
  thumbnails_sent = !!thumbnails_sent ? parseInt(thumbnails_sent) : 0;
  if (password) {
    password = sha256(password);
  }

  const node = {
    id: node_id,
    score,
    previews_sent,
    jobs_completed: jobs_completet,
    thumbnails_sent,
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