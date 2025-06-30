import { createConnection } from 'promise-mysql';
import sha256 from 'js-sha256';

const config = useRuntimeConfig();

const SETUP_CONNECTION_PARAMS = {
  host: '5.75.158.56',
  user: 'rndrstats',
  password: config.dbPassword
};

const CONNECTION_PARAMS = {
  ...SETUP_CONNECTION_PARAMS,
  database: 'rndrstats'
}

export const setup = async () => {
  const con = await createConnection(SETUP_CONNECTION_PARAMS);

  await con.query('CREATE DATABASE IF NOT EXISTS rndrstats;');
  await con.query('USE rndrstats;');
  await con.query('create table if not exists `operators` (`id` int unsigned not null auto_increment primary key,`eth_address` VARCHAR(255) not null,`created` DATETIME null default CURRENT_TIMESTAMP)');

  await con.end();
}

export const setOperator = async (operator) => {
  const con = await createConnection(CONNECTION_PARAMS);
  const result = await con.query(`REPLACE into operators (id, eth_address) 
                  values(${operator.id}, '${operator.eth_address}')`);
  await con.end();
  return result;
}

export const setNode = async (node) => {
  const con = await createConnection(CONNECTION_PARAMS);
  const password = (!node.password || node.password === '') ? `NULL` : `'${sha256(node.password)}'`;
  let query = `insert into nodes (id, operator, jobs_completed, previews_sent, thumbnails_sent, score, gpus, password) 
                  values('${node.id}', ${node.operator}, ${node.jobs_completed}, ${node.previews_sent}, ${node.thumbnails_sent}, ${node.score}, '${node.gpus}', ${password})
                  on duplicate key update 
                  operator=${node.operator},
                  jobs_completed=${node.jobs_completed},
                  previews_sent=${node.previews_sent}, 
                  thumbnails_sent=${node.thumbnails_sent}, 
                  score=${node.score},
                  gpus='${node.gpus}',`;
  if (password !== 'NULL') {
    query += `password=${password},`;
  }
  query += `updated=CURRENT_TIMESTAMP()`;
  await con.query(query);
  await con.end();
}

export const addState = async (state) => {
  const con = await createConnection(CONNECTION_PARAMS);
  await con.query(`INSERT into states (node, type) 
                  values('${state.node_id}', '${state.type}')`);
  await con.end();
}

export const addJob = async (job) => {
  const con = await createConnection(CONNECTION_PARAMS);
  await con.query(`INSERT into jobs (node, start, end, time, result) 
                  values('${job.node}', FROM_UNIXTIME(${job.start}), FROM_UNIXTIME(${job.end}), ${job.time}, '${job.result}')`);
  await con.end();
}

export const getNodeOverview = async (operator_id) => {
  const con = await createConnection(CONNECTION_PARAMS);
  const result = await con.query(`SELECT n.id, n.name, n.updated, n.gpus, n.score, n.jobs_completed, n.previews_sent, n.thumbnails_sent, s.type as state, s.created as since
  FROM states s
    INNER JOIN nodes n ON s.node = n.id
  WHERE s.id IN (SELECT MAX(id) FROM states GROUP BY node) 
  AND s.node IN (SELECT id FROM nodes WHERE operator = ${operator_id})`);
  await con.end();
  return result;
}

export const getUtilizationForAllNodes = async (start, end) => {
  const con = await createConnection(CONNECTION_PARAMS);
  const query = `select n.id, n.gpus, n.score, count(*) as job_count, sum(j.time) as total, 
      sum(j.time) / 60 / 60 / TIMESTAMPDIFF(HOUR, "${start}", "${end}") as utilization
    from jobs j
      inner join nodes n ON j.node = n.id
    where start >= "${start}" AND end <= "${end}"
    and time < 100000
    group by j.node`;
  const result = await con.query(query);
  await con.end();
  return result;
};

export const getJobOverview = async (operator_id, start, end) => {
  const con = await createConnection(CONNECTION_PARAMS);
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

export const getPasswords = async (node_id) => {
  const con = await createConnection(CONNECTION_PARAMS);
  const result = await con.query(`select password from nodes
    where operator = (select operator from nodes where id = '${node_id}')
    and updated > DATE_SUB(NOW(), INTERVAL 1 MONTH)`);
  await con.end();
  return result;
}

export const updateName = async (node_id, name) => {
  const con = await createConnection(CONNECTION_PARAMS);
  const result = await con.query(`update nodes
    set name = '${name}'
    where id = '${node_id}'`);
  await con.end();
  return result;
}

export const getUtilizationOverview = async (start, end) => {
  const con = await createConnection(CONNECTION_PARAMS);
  const result = await con.query(`select score_range, summary.utilization, summary.total as time, summary.job_count
    from (select case when u.score >= 0 and u.score <= 99 then '0 - 99'
                when u.score >= 100 and u.score <= 199 then '100 - 199'
                when u.score >= 200 and u.score <= 300 then '200 - 300'
                when u.score >= 301 and u.score <= 999 then '300 - 999'
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

export const getOperatorPackage = async (operator_id) => {
  const con = await createConnection(CONNECTION_PARAMS);
  const result = await con.query(`select * from package 
    where valid_until >= current_timestamp
      and operator = ${operator_id}`);
  await con.end();
  return result;
}