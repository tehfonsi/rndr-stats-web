const faunadb = require('faunadb')
const q = faunadb.query;

const serverClient = new faunadb.Client({
  secret: process.env.FAUNA_DB_SERVER_SECRET,
  domain: 'db.eu.fauna.com'
});

const newJob = async (event) => {
  const {node_id, start, end, time, result} = JSON.parse(event.body);

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
    start: q.Time(start),
    end: q.Time(end),
    time: parseFloat(time),
    result,
    node: q.Ref(q.Collection('nodes'), node.ref.value.id)
  };

  let queryResult;
  try {
    queryResult = await serverClient.query(
        q.Create(
          q.Collection('jobs'),
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
    body: JSON.stringify(queryResult)
  };
}

exports.handler = async (event, _context) => {
  if (event.httpMethod === "POST") {
    return newJob(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}