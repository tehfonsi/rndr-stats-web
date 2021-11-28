const faunadb = require('faunadb')
const q = faunadb.query;

const serverClient = new faunadb.Client({
  secret: process.env.FAUNA_DB_SERVER_SECRET,
  domain: 'db.eu.fauna.com'
});

const newNode = async (event) => {
  const {eth_address, node_id, score, previews_sent, jobs_completet, thumbnails_sent, gpus} = JSON.parse(event.body);

  let operator;
  try {
    operator = await serverClient.query(
      q.Get(
        q.Match(q.Index('eth_address'), eth_address)
      )
    );
  } catch (err) {
    console.error(err);
    return {statusCode: 400, body: "No operator found"};
  }

  //TODO optimize reference (no prior read necessary)
  const node = {
    node_id,
    score: parseInt(score),
    previews_sent: parseInt(previews_sent),
    jobs_completet: parseInt(jobs_completet),
    thumbnails_sent: parseInt(thumbnails_sent),
    gpus,
    operator: q.Ref(q.Collection('operators'), operator.ref.value.id)
  };

  const newNode = {
    ...node,
    added: q.Now()
  };

  let result;
  try {
      result = await serverClient.query(
      q.Let({
        match: q.Match(q.Index('node_id'), node_id),
        data: { data: node }
      },
      q.If(
        q.Exists(q.Var('match')),
        q.Update(q.Select('ref', q.Get(q.Var('match'))), q.Var('data')),
        q.Create(q.Collection('nodes'),{ data: newNode })
      )
    )
    );
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
  if (event.httpMethod === "PUT") {
    return newNode(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}