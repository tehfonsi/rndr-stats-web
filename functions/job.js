import { addJob } from '../functions/utils/database';

const newJob = async (event) => {
  const {node_id, start, end, time, result} = JSON.parse(event.body);

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
    return {
      statusCode: 500,
      body: JSON.stringify(err)
    };
  }
  
  return {
    statusCode: 200,
  };
}

export async function handler(event, _context) {
  if (event.httpMethod === "POST") {
    return newJob(event);
  }
  return { statusCode: 405, body: "Method Not Allowed" };
}