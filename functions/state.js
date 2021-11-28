const faunadb = require('faunadb')
const q = faunadb.query;

const serverClient = new faunadb.Client({
  secret: process.env.FAUNA_DB_SERVER_SECRET,
  domain: 'db.eu.fauna.com'
});

const newState = async (event) => {
  const {type, node_id} = JSON.parse(event.body);

  let node;
  try {
    node = await serverClient.query(
      q.Get(
        q.Match(q.Index('node_id'), node_id)
      )
    );
  } catch (err) {
    console.error(err);
    return {statusCode: 400, body: "No node found"};
  }

  //TODO optimize reference (no prior read necessary)
  const state = {
    type,
    start: q.Now(),
    node: q.Ref(q.Collection('nodes'), node.ref.value.id)
  };

  let result;
  try {
      result = await serverClient.query(
        q.Create(
          q.Collection('states'),
          { data: state },
        )
      )
  } catch (err) {
    console.error(err);
    return {
      statusCode: 200,
      body: JSON.stringify(err)
    };
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
}

exports.handler = async (event, _context) => {
  if (event.httpMethod === "POST") {
    return newState(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}