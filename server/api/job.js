import { addJob } from '../utils/database';

const newJob = async (req, res) => {
  const {node_id, start, end, time, result} = req.body;

  const startTimestamp = Date.parse(start)/ 1000;
  const endTimestamp = Date.parse(end) / 1000;
  const job = {
    start: startTimestamp,
    end: endTimestamp,
    time: parseFloat(time),
    result,
    node: node_id
  };

  try {
    await addJob(job)
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    return res.end(JSON.stringify(err));
  }

  res.statusCode = 200;
  return res.end();
}

export default async function (req, res) {
  if (req.method === "POST") {
    return newJob(req, res);
  }
  res.statusCode = 405;
  return res.end("Method Not Allowed");
}