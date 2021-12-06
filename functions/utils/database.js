const mysql = require('promise-mysql');
const sha256 = require('js-sha256');

const SETUP_CONNECTION_PARAMS = {
  host: 'rndr-stats.cfmuykp6mt1h.eu-central-1.rds.amazonaws.com',
  user: 'admin',
  password: process.env.DB_PASSWORD
};

const CONNECTION_PARAMS = {
  ...SETUP_CONNECTION_PARAMS,
  database: 'rndrstats'
}

const setup = async () => {
  const con = await mysql.createConnection(SETUP_CONNECTION_PARAMS);

  await con.query('CREATE DATABASE IF NOT EXISTS rndrstats;');
  await con.query('USE rndrstats;');
  await con.query('create table if not exists `operators` (`id` int unsigned not null auto_increment primary key,`eth_address` VARCHAR(255) not null,`created` DATETIME null default CURRENT_TIMESTAMP)');

  await con.end();
}

const setOperator = async (operator) => {
  const con = await mysql.createConnection(CONNECTION_PARAMS);
  const result = await con.query(`REPLACE into operators (id, eth_address) 
                  values(${operator.id}, '${operator.eth_address}')`);
  await con.end();
  return result;
}

const setNode = async (node) => {
  const con = await mysql.createConnection(CONNECTION_PARAMS);
  const password = (!node.password || node.password === '') ? `NULL` : `'${sha256(node.password)}'`;
  await con.query(`REPLACE into nodes (id, operator, jobs_completed, previews_sent, thumbnails_sent, score, gpus, password) 
                  values('${node.id}', ${node.operator}, ${node.jobs_completed}, ${node.previews_sent}, ${node.thumbnails_sent}, ${node.score}, '${node.gpus}', ${password})`);
  await con.end();
}

const addState = async (state) => {
  const con = await mysql.createConnection(CONNECTION_PARAMS);
  await con.query(`INSERT into states (node, type) 
                  values('${state.node_id}', '${state.type}')`);
  await con.end();
}

const addJob = async (job) => {
  const con = await mysql.createConnection(CONNECTION_PARAMS);
  await con.query(`INSERT into jobs (node, start, end, time, result) 
                  values('${job.node}', FROM_UNIXTIME(${job.start}), FROM_UNIXTIME(${job.end}), ${job.time}, '${job.result}')`);
  await con.end();
}

const getNodeOverview = async (operator_id) => {
  const con = await mysql.createConnection(CONNECTION_PARAMS);
  const result = await con.query(`SELECT n.id, n.gpus, n.score, n.jobs_completed, n.previews_sent, n.thumbnails_sent, s.type as state, s.created as since
  FROM states s
    INNER JOIN nodes n ON s.node = n.id
  WHERE s.id IN (SELECT MAX(id) FROM states GROUP BY node) 
  AND s.node IN (SELECT id FROM nodes WHERE operator = ${operator_id})`);
  await con.end();
  return result;
}

module.exports = {
  setup,
  setOperator,
  setNode,
  addState,
  addJob,
  getNodeOverview
}