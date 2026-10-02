import { createConnection, createPool } from 'promise-mysql';
import sha256 from 'js-sha256';

const config = useRuntimeConfig();

let POOL = null;

(async () => {
  POOL = await createPool({
    host: '5.75.158.56',
    user: 'rndrstats',
    password: config.dbPassword,
    database: 'rndrstats',
    connectionLimit: 100 // Adjust as needed
  });
})();

const SETUP_CONNECTION_PARAMS = {
  host: '5.75.158.56',
  user: 'rndrstats',
  password: config.dbPassword
};

export const setup = async () => {
  const con = await createConnection(SETUP_CONNECTION_PARAMS);

  await con.query('CREATE DATABASE IF NOT EXISTS rndrstats;');
  await con.query('USE rndrstats;');
  await con.query('create table if not exists `operators` (`id` int unsigned not null auto_increment primary key,`eth_address` VARCHAR(255) null,`sol_address` VARCHAR(255) null,`reward_wallet` VARCHAR(64) null,`created` DATETIME null default CURRENT_TIMESTAMP, index `idx_operators_sol_address` (`sol_address`))');

  await con.end();
}

export const setOperator = async (operator) => {
  const con = await POOL.getConnection();
  try {
    // never wipe a known address with null, keep `created`
    const result = await con.query(`insert into operators (id, eth_address, sol_address)
                    values(?, ?, ?)
                    on duplicate key update
                    eth_address=COALESCE(VALUES(eth_address), eth_address),
                    sol_address=COALESCE(VALUES(sol_address), sol_address)`,
      [operator.id, operator.eth_address || null, operator.sol_address || null]);
    return result;
  } finally {
    con.release();
  }
}

export const findOperatorBySol = async (sol_address) => {
  const con = await POOL.getConnection();
  try {
    // prefer the ETH-based operator if both exist
    const rows = await con.query(`select id, eth_address, sol_address from operators
                    where sol_address = ?
                    order by eth_address is null
                    limit 1`, [sol_address]);
    return rows.length > 0 ? rows[0] : null;
  } finally {
    con.release();
  }
}

// Move everything owned by operator `fromId` to `toId` and delete `fromId`
export const mergeOperator = async (fromId, toId) => {
  const con = await POOL.getConnection();
  try {
    await con.query('update nodes set operator = ? where operator = ?', [toId, fromId]);
    await con.query('update package set operator = ? where operator = ?', [toId, fromId]);
    await con.query('delete from operators where id = ?', [fromId]);
  } finally {
    con.release();
  }
}

export const setNode = async (node) => {
  const con = await POOL.getConnection();
  try {
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
  } finally {
    con.release();
  }
}

export const addState = async (state) => {
  const con = await POOL.getConnection();
  try {
    await con.query(`INSERT into states (node, type) 
                  values('${state.node_id}', '${state.type}')`);
  } finally {
    con.release();
  }
}

export const addJob = async (job) => {
  const con = await POOL.getConnection();
  try {
  await con.query(`INSERT into jobs (node, start, end, time, result) 
                  values('${job.node}', FROM_UNIXTIME(${job.start}), FROM_UNIXTIME(${job.end}), ${job.time}, '${job.result}')`);
  } finally {
    con.release();
  }
}

export const getNodeOverview = async (operator_id) => {
  const con = await POOL.getConnection();
  try {
    const nodes = await con.query(`SELECT id, name, updated, gpus, score, jobs_completed, previews_sent, thumbnails_sent
      FROM nodes WHERE operator = ?`, [operator_id]);
    if (!nodes.length) return [];

    // Latest state per node in a second query: with a literal id list MySQL reads one index entry
    // per node ("Using index for group-by"), 0.05s instead of 2-7s for nodes with 250k+ state rows.
    const states = await con.query(`SELECT s.node, s.type, s.created
      FROM states s
        INNER JOIN (SELECT node, MAX(id) AS id FROM states WHERE node IN (?) GROUP BY node) latest ON latest.id = s.id`,
      [nodes.map((n) => n.id)]);
    const byNode = new Map(states.map((s) => [s.node, s]));

    // nodes without any state are left out, like the former inner join did
    return nodes
      .filter((n) => byNode.has(n.id))
      .map((n) => ({ ...n, state: byNode.get(n.id).type, since: byNode.get(n.id).created }));
  } finally {
    con.release();
  }
}

export const getUtilizationForAllNodes = async (start, end) => {
  const con = await POOL.getConnection();
  try {
    const query = `select n.id, n.gpus, n.score, count(*) as job_count, sum(j.time) as total, 
        sum(j.time) / 60 / 60 / TIMESTAMPDIFF(HOUR, "${start}", "${end}") as utilization
      from jobs j
        inner join nodes n ON j.node = n.id
      where start >= "${start}" AND end <= "${end}"
      and time < 100000
      group by j.node`;
    const result = await con.query(query);
    return result;
  } finally {
    con.release();
  }
};

export const getJobOverview = async (operator_id, start, end) => {
  const con = await POOL.getConnection();
  try {
    const result = await con.query(`select n.id, n.gpus, n.score, count(*) as job_count, sum(j.time) as total, 
      sum(j.time) / 60 / 60 / TIMESTAMPDIFF(HOUR, "${start}", "${end}") as utilization
    from jobs j
      inner join nodes n ON j.node = n.id
    where start >= "${start}" AND end <= "${end}"
    and n.operator = ${operator_id}
    group by node`);
    return result;
  } finally {
    con.release();
  }
}

// busy seconds and job count per node, grouped into time buckets of `bucket` seconds
export const getJobHistory = async (operator_id, start, end, bucket) => {
  const con = await POOL.getConnection();
  try {
    const result = await con.query(`select j.node, floor(unix_timestamp(j.start) / ?) * ? as bucket,
        sum(j.time) as busy, count(*) as job_count
      from jobs j
        inner join nodes n ON j.node = n.id
      where j.start >= from_unixtime(?) and j.end <= from_unixtime(?)
      and n.operator = ?
      group by j.node, bucket
      order by bucket`, [bucket, bucket, start, end, operator_id]);
    return result;
  } finally {
    con.release();
  }
}

export const getPasswords = async (node_id) => {
  const con = await POOL.getConnection();
  try {
    const result = await con.query(`select password from nodes
      where operator = (select operator from nodes where id = ?)
      and updated > DATE_SUB(NOW(), INTERVAL 1 MONTH)`, [node_id]);
    return result;
  } finally {
    con.release();
  }
}

// password hashes of an operator's nodes that reported in the last month
export const getOperatorPasswords = async (operator_id) => {
  const con = await POOL.getConnection();
  try {
    return await con.query(`select password from nodes
      where operator = ?
      and updated > DATE_SUB(NOW(), INTERVAL 1 MONTH)`, [operator_id]);
  } finally {
    con.release();
  }
}

export const updateName = async (node_id, name) => {
  const con = await POOL.getConnection();
  try {
    const result = await con.query('update nodes set name = ? where id = ?', [name, node_id]);
    return result;
  } finally {
    con.release();
  }
}

// Solana wallet that receives the operator's Render rewards, set on the dashboard.
// Not operators.sol_address: that is the obfuscated registry value used to identify the operator.
export const getRewardWallet = async (operator_id) => {
  const con = await POOL.getConnection();
  try {
    const rows = await con.query('select reward_wallet from operators where id = ?', [operator_id]);
    return rows.length ? rows[0].reward_wallet : null;
  } finally {
    con.release();
  }
}

export const setRewardWallet = async (operator_id, wallet) => {
  const con = await POOL.getConnection();
  try {
    return await con.query('update operators set reward_wallet = ? where id = ?', [wallet, operator_id]);
  } finally {
    con.release();
  }
}

export const getUtilizationOverview = async (start, end) => {
  const con = await POOL.getConnection();
  try {
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
    return result;
  } finally {
    con.release();
  }
}

export const getOperatorPackage = async (operator_id) => {
  const con = await POOL.getConnection();
  try {
    const result = await con.query(`select * from package 
      where valid_until >= current_timestamp
        and operator = ${operator_id}`);
    return result;
  } finally {
    con.release();
  }
}