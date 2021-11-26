const faunadb = require('faunadb')
const crypto = require('crypto');
const hash = require('./utils/hash');
const q = faunadb.query;

const serverClient = new faunadb.Client({
  secret: process.env.FAUNA_DB_SERVER_SECRET,
  domain: 'db.eu.fauna.com'
});

exports.handler = async (event, _context) => {
  if (event.httpMethod === "PUT") {
    const {eth_address} = JSON.parse(event.body);
    const id = hash(eth_address);

    const operator = {
      eth_address
    };

    let result;
    try {
       result = await serverClient.query(
        q.Let({
          match: q.Match(q.Index('eth_address'), eth_address),
          data: { data: operator }
        },
        q.If(
          q.Exists(q.Var('match')),
          q.Update(q.Select('ref', q.Get(q.Var('match'))), q.Var('data')),
          q.Create(q.Ref(q.Collection('operators'), id),{ data: operator })
        )
      )
      );
    } catch (err) {
      console.error(err);
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}