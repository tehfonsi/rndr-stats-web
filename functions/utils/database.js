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
  await con.query(`insert into nodes (id, operator, jobs_completed, previews_sent, thumbnails_sent, score, gpus, password) 
                  values('${node.id}', ${node.operator}, ${node.jobs_completed}, ${node.previews_sent}, ${node.thumbnails_sent}, ${node.score}, '${node.gpus}', ${password})
                  on duplicate key update 
                  operator=${node.operator},
                  jobs_completed=${node.jobs_completed},
                  previews_sent=${node.previews_sent}, 
                  thumbnails_sent=${node.thumbnails_sent}, 
                  score=${node.score},
                  gpus='${node.gpus}',
                  password=${password},
                  updated=CURRENT_TIMESTAMP()
                  `);
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
  const result = await con.query(`SELECT n.id, n.name, n.gpus, n.score, n.jobs_completed, n.previews_sent, n.thumbnails_sent, s.type as state, s.created as since
  FROM states s
    INNER JOIN nodes n ON s.node = n.id
  WHERE s.id IN (SELECT MAX(id) FROM states GROUP BY node) 
  AND s.node IN (SELECT id FROM nodes WHERE operator = ${operator_id})`);
  await con.end();
  return result;
}

const getUtilizationForAllNodes = async (start, end) => {
const con = await mysql.createConnection(CONNECTION_PARAMS);
  const result = await con.query(`select n.id, n.gpus, n.score, count(*) as job_count, sum(j.time) as total, 
      sum(j.time) / 60 / 60 / TIMESTAMPDIFF(HOUR, "${start}", "${end}") as utilization
    from jobs j
      inner join nodes n ON j.node = n.id
    where start >= "${start}" AND start <= "${end}"
    group by node`);
  await con.end();
  return result;
};

const getJobOverview = async (operator_id, start, end) => {
  const con = await mysql.createConnection(CONNECTION_PARAMS);
  const result = await con.query(`select n.id, n.gpus, n.score, count(*) as job_count, sum(j.time) as total, 
    sum(j.time) / 60 / 60 / TIMESTAMPDIFF(HOUR, "${start}", "${end}") as utilization
  from jobs j
    inner join nodes n ON j.node = n.id
  where start >= "${start}" AND end <= "${end}"
  and n.operator = ${operator_id}
  group by node`);
  await con.end();
  return result;
}

const getPasswords = async (node_id) => {
  const con = await mysql.createConnection(CONNECTION_PARAMS);
  const result = await con.query(`select password from nodes
    where operator = (select operator from nodes where id = '${node_id}')`);
  await con.end();
  return result;
}

const updateName = async (node_id, name) => {
  const con = await mysql.createConnection(CONNECTION_PARAMS);
  const result = await con.query(`update nodes
    set name = '${name}'
    where id = '${node_id}'`);
  await con.end();
  return result;
}

const getUtilizationOverview = async (start, end) => {
  const con = await mysql.createConnection(CONNECTION_PARAMS);
  const result = await con.query(`select score_range, summary.utilization, summary.total as time, summary.job_count
    from (select case when u.score >= 0 and u.score <= 99 then '0 - 99'
                when u.score >= 100 and u.score <= 199 then '100 - 199'
                when u.score >= 200 and u.score <= 299 then '200 - 299'
                when u.score >= 300 and u.score <= 999 then '300 - 999'
                when u.score >= 1000 and u.score <= 1999 then '1000 - 1999'
                when u.score >= 2000 and u.score <= 3999 then '2000 - 3999'
                else '4000 - 9999'
            end as score_range,
            u.utilization as utilization,
            u.total as total,
            u.job_count as job_count
        from
            (select n.score, count(*) as job_count, sum(j.time) as total, 
          sum(j.time) / 60 / 60 / TIMESTAMPDIFF(HOUR, "${start}", "${end}") as utilization
        from jobs j
          inner join nodes n ON j.node = n.id
        where start >= "${start}" AND end <= "${end}"
        group by node) as u
    ) as summary
    group by score_range
    `);
  await con.end();
  return result;
}

module.exports = {
  setup,
  setOperator,
  setNode,
  addState,
  addJob,
  getNodeOverview,
  getJobOverview,
  getUtilizationOverview,
  getUtilizationForAllNodes,
  getPasswords,
  updateName
}